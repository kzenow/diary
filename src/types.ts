export interface DiaryEntry {
  id: string
  title: string
  content: string // HTML content from rich text editor
  createdAt: number // timestamp
  updatedAt: number // timestamp
  tags: string[]
  attachments: Attachment[]
  synced: boolean // whether this has been synced to server
  deleted: boolean // soft delete flag
}

export interface Attachment {
  id: string
  name: string
  type: string // MIME type
  size: number
  data: string // base64 encoded data or blob URL
  createdAt: number
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: number
}

export type ViewMode = 'list' | 'calendar' | 'editor'

export interface AppState {
  currentView: ViewMode
  selectedEntry: DiaryEntry | null
  searchQuery: string
  selectedTags: string[]
  isOnline: boolean
}
