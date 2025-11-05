/**
 * Sync Service - Supabase Implementation
 *
 * Handles syncing diary entries and tags between local IndexedDB and Supabase cloud storage
 */

import { DiaryEntry, Tag } from './types'
import { getAllEntries, saveEntry, getAllTags, saveTag } from './db'
import { supabase, isSupabaseConfigured } from './supabaseClient'

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Get current user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

/**
 * Sync local entries with the server
 */
export async function syncEntries(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Offline - skipping entry sync')
    return
  }

  if (!await isAuthenticated()) {
    console.log('Not authenticated - skipping entry sync')
    return
  }

  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('User ID not found')
  }

  try {
    // Get all local entries
    const localEntries = await getAllEntries()
    const unsyncedEntries = localEntries.filter(e => !e.synced)

    // Upload unsynced entries (including deleted ones)
    for (const entry of unsyncedEntries) {
      await uploadEntry(entry, userId)
    }

    // Download entries from server
    const serverEntries = await fetchEntriesFromServer()

    // Merge with local entries
    for (const serverEntry of serverEntries) {
      await mergeEntry(serverEntry)
    }

    console.log('Entry sync completed successfully')
  } catch (error) {
    console.error('Entry sync failed:', error)
    throw error
  }
}

/**
 * Upload a single entry to the server
 */
async function uploadEntry(entry: DiaryEntry, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('entries')
      .upsert({
        id: entry.id,
        user_id: userId,
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        attachments: entry.attachments,
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
        deleted: entry.deleted,
        synced: true,
      })

    if (error) throw error

    // Mark as synced locally
    entry.synced = true
    await saveEntry(entry)
  } catch (error) {
    console.error('Failed to upload entry:', error)
    throw error
  }
}

/**
 * Fetch all entries from the server
 */
async function fetchEntriesFromServer(): Promise<DiaryEntry[]> {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Map server format to app format
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      tags: item.tags || [],
      attachments: item.attachments || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      deleted: item.deleted || false,
      synced: true,
    }))
  } catch (error) {
    console.error('Failed to fetch entries from server:', error)
    throw error
  }
}

/**
 * Merge a server entry with local data
 * Implements conflict resolution based on timestamps
 */
async function mergeEntry(serverEntry: DiaryEntry): Promise<void> {
  const localEntries = await getAllEntries()
  const localEntry = localEntries.find(e => e.id === serverEntry.id)

  if (!localEntry) {
    // New entry from server - save it locally
    serverEntry.synced = true
    await saveEntry(serverEntry)
    return
  }

  // Conflict resolution: Use the most recently updated version
  if (serverEntry.updatedAt > localEntry.updatedAt) {
    // Server version is newer
    serverEntry.synced = true
    await saveEntry(serverEntry)
  } else if (localEntry.updatedAt > serverEntry.updatedAt && !localEntry.synced) {
    // Local version is newer and not synced - upload it
    const userId = await getCurrentUserId()
    if (userId) {
      await uploadEntry(localEntry, userId)
    }
  }
  // If timestamps are equal or local is synced, they're already in sync
}

/**
 * Sync tags with the server
 */
export async function syncTags(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Offline - skipping tag sync')
    return
  }

  if (!await isAuthenticated()) {
    console.log('Not authenticated - skipping tag sync')
    return
  }

  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('User ID not found')
  }

  try {
    // Get all local tags
    const localTags = await getAllTags()

    // Upload all local tags (upsert will handle duplicates)
    for (const tag of localTags) {
      await uploadTag(tag, userId)
    }

    // Download tags from server
    const serverTags = await fetchTagsFromServer()

    // Save server tags locally
    for (const tag of serverTags) {
      await saveTag(tag)
    }

    console.log('Tag sync completed successfully')
  } catch (error) {
    console.error('Tag sync failed:', error)
    throw error
  }
}

/**
 * Upload a single tag to the server
 */
async function uploadTag(tag: Tag, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tags')
      .upsert({
        id: tag.id,
        user_id: userId,
        name: tag.name,
        color: tag.color,
        created_at: tag.createdAt,
      })

    if (error) throw error
  } catch (error) {
    console.error('Failed to upload tag:', error)
    throw error
  }
}

/**
 * Fetch all tags from the server
 */
async function fetchTagsFromServer(): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')

    if (error) throw error

    // Map server format to app format
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      color: item.color,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Failed to fetch tags from server:', error)
    throw error
  }
}

/**
 * Full sync of all data
 */
export async function syncData(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Offline - skipping sync')
    return
  }

  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured - skipping sync')
    return
  }

  if (!await isAuthenticated()) {
    console.log('Not authenticated - skipping sync')
    return
  }

  try {
    await syncEntries()
    await syncTags()
    console.log('Full sync completed successfully')
  } catch (error) {
    console.error('Sync failed:', error)
    // Don't throw - allow app to continue working offline
  }
}

/**
 * Set up automatic background sync
 */
export function setupAutoSync(intervalMs: number = 5 * 60 * 1000): () => void {
  // Sync immediately if authenticated
  syncData()

  // Set up periodic sync
  const intervalId = setInterval(() => {
    syncData()
  }, intervalMs)

  // Listen for online event to sync immediately
  const handleOnline = () => syncData()
  window.addEventListener('online', handleOnline)

  // Return cleanup function
  return () => {
    clearInterval(intervalId)
    window.removeEventListener('online', handleOnline)
  }
}
