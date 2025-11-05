/**
 * Sync Service Template
 *
 * This file provides a template for implementing cloud sync functionality.
 * You can use Supabase, Firebase, or any other backend service.
 *
 * To implement sync:
 * 1. Set up a backend (Supabase recommended for simplicity)
 * 2. Create tables for entries and tags
 * 3. Implement authentication
 * 4. Fill in the functions below
 * 5. Call syncData() periodically when online
 */

import { DiaryEntry } from './types'
import { getAllEntries, saveEntry } from './db'

// When implementing sync, also import: Tag, getAllTags, saveTag from './db'
// Add your backend configuration:
// const BACKEND_URL = 'YOUR_BACKEND_URL'
// const API_KEY = 'YOUR_API_KEY'

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  // TODO: Implement authentication check
  // Example: Check if user token exists and is valid
  return false
}

/**
 * Sync local entries with the server
 */
export async function syncEntries(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Offline - skipping sync')
    return
  }

  try {
    // Get all local entries that haven't been synced
    const localEntries = await getAllEntries()
    const unsyncedEntries = localEntries.filter(e => !e.synced && !e.deleted)

    // Upload unsynced entries
    for (const entry of unsyncedEntries) {
      await uploadEntry(entry)
    }

    // Download entries from server
    const serverEntries = await fetchEntriesFromServer()

    // Merge with local entries
    for (const serverEntry of serverEntries) {
      await mergeEntry(serverEntry)
    }

    console.log('Sync completed successfully')
  } catch (error) {
    console.error('Sync failed:', error)
    throw error
  }
}

/**
 * Upload a single entry to the server
 */
async function uploadEntry(_entry: DiaryEntry): Promise<void> {
  // TODO: Implement upload logic
  // Example with fetch:
  /*
  const response = await fetch(`${BACKEND_URL}/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(entry)
  })

  if (!response.ok) {
    throw new Error('Failed to upload entry')
  }

  // Mark as synced locally
  entry.synced = true
  await saveEntry(entry)
  */
}

/**
 * Fetch all entries from the server
 */
async function fetchEntriesFromServer(): Promise<DiaryEntry[]> {
  // TODO: Implement fetch logic
  // Example with fetch:
  /*
  const response = await fetch(`${BACKEND_URL}/entries`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch entries')
  }

  return await response.json()
  */
  return []
}

/**
 * Merge a server entry with local data
 * Implements conflict resolution based on timestamps
 */
async function mergeEntry(serverEntry: DiaryEntry): Promise<void> {
  const localEntry = await getAllEntries().then(entries =>
    entries.find(e => e.id === serverEntry.id)
  )

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
  } else if (localEntry.updatedAt > serverEntry.updatedAt) {
    // Local version is newer - upload it
    await uploadEntry(localEntry)
  }
  // If timestamps are equal, they're in sync
}

/**
 * Sync tags with the server
 */
export async function syncTags(): Promise<void> {
  // TODO: Implement tag sync similar to entry sync
  // This is simpler as tags rarely conflict
}

/**
 * Full sync of all data
 */
export async function syncData(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Offline - skipping sync')
    return
  }

  if (!await isAuthenticated()) {
    console.log('Not authenticated - skipping sync')
    return
  }

  try {
    await syncEntries()
    await syncTags()
  } catch (error) {
    console.error('Sync failed:', error)
    // Don't throw - allow app to continue working offline
  }
}

/**
 * Set up automatic background sync
 */
export function setupAutoSync(intervalMs: number = 5 * 60 * 1000): () => void {
  // Sync immediately
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

// Backend Setup Guide
/*
SUPABASE SETUP EXAMPLE:

1. Create a Supabase project at https://supabase.com

2. Create tables:

-- Entries table
create table entries (
  id text primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  attachments jsonb not null default '[]',
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean not null default false
);

-- Enable Row Level Security
alter table entries enable row level security;

-- Policy: Users can only access their own entries
create policy "Users can access own entries"
  on entries for all
  using (auth.uid() = user_id);

3. Install Supabase client:
npm install @supabase/supabase-js

4. Initialize Supabase:
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

5. Implement the functions above using Supabase client

Example uploadEntry:
async function uploadEntry(entry: DiaryEntry) {
  const { error } = await supabase
    .from('entries')
    .upsert({
      ...entry,
      user_id: (await supabase.auth.getUser()).data.user?.id
    })

  if (error) throw error

  entry.synced = true
  await saveEntry(entry)
}
*/
