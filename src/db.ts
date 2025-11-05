import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { DiaryEntry, Tag } from './types'

interface DiaryDB extends DBSchema {
  entries: {
    key: string
    value: DiaryEntry
    indexes: {
      'by-date': number
      'by-updated': number
      'by-tag': string
    }
  }
  tags: {
    key: string
    value: Tag
    indexes: { 'by-name': string }
  }
}

const DB_NAME = 'personal-diary-db'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<DiaryDB> | null = null

export async function getDB(): Promise<IDBPDatabase<DiaryDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<DiaryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create entries store
      if (!db.objectStoreNames.contains('entries')) {
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' })
        entryStore.createIndex('by-date', 'createdAt')
        entryStore.createIndex('by-updated', 'updatedAt')
        entryStore.createIndex('by-tag', 'tags', { multiEntry: true })
      }

      // Create tags store
      if (!db.objectStoreNames.contains('tags')) {
        const tagStore = db.createObjectStore('tags', { keyPath: 'id' })
        tagStore.createIndex('by-name', 'name', { unique: true })
      }
    },
  })

  return dbInstance
}

// Entry operations
export async function getAllEntries(): Promise<DiaryEntry[]> {
  const db = await getDB()
  const entries = await db.getAllFromIndex('entries', 'by-updated')
  return entries.filter(e => !e.deleted).reverse() // Most recent first
}

export async function getEntry(id: string): Promise<DiaryEntry | undefined> {
  const db = await getDB()
  return db.get('entries', id)
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const db = await getDB()
  await db.put('entries', entry)
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB()
  const entry = await db.get('entries', id)
  if (entry) {
    entry.deleted = true
    entry.updatedAt = Date.now()
    entry.synced = false
    await db.put('entries', entry)
  }
}

export async function searchEntries(query: string): Promise<DiaryEntry[]> {
  const allEntries = await getAllEntries()

  const lowerQuery = query.toLowerCase()
  return allEntries.filter(entry =>
    entry.title.toLowerCase().includes(lowerQuery) ||
    entry.content.toLowerCase().includes(lowerQuery) ||
    entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export async function getEntriesByTag(tagName: string): Promise<DiaryEntry[]> {
  const db = await getDB()
  const entries = await db.getAllFromIndex('entries', 'by-tag', tagName)
  return entries.filter(e => !e.deleted)
}

export async function getEntriesByDateRange(start: Date, end: Date): Promise<DiaryEntry[]> {
  const allEntries = await getAllEntries()

  const startTime = start.getTime()
  const endTime = end.getTime()

  return allEntries.filter(entry =>
    entry.createdAt >= startTime && entry.createdAt <= endTime
  )
}

// Tag operations
export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB()
  return db.getAll('tags')
}

export async function saveTag(tag: Tag): Promise<void> {
  const db = await getDB()
  await db.put('tags', tag)
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tags', id)
}

// Utility to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
