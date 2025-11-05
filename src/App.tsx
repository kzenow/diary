import { useEffect, useState } from 'react'
import { DiaryEntry, ViewMode, Tag } from './types'
import {
  getAllEntries,
  saveEntry,
  deleteEntry,
  searchEntries,
  getAllTags,
  saveTag,
  generateId,
} from './db'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { isAuthenticated, syncData, setupAutoSync } from './sync'
import Auth from './components/Auth'
import EntryList from './components/EntryList'
import EntryEditor from './components/EntryEditor'
import CalendarView from './components/CalendarView'
import './App.css'

function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [currentView, setCurrentView] = useState<ViewMode>('list')
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setShowAuth(false)
        // Sync data when user signs in
        syncData().then(() => loadData())
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Set up auto-sync when authenticated
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      return
    }

    // Set up automatic sync every 5 minutes
    const cleanup = setupAutoSync(5 * 60 * 1000)
    return cleanup
  }, [user])

  // Load entries and tags on mount
  useEffect(() => {
    loadData()
  }, [])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Filter entries when search or tags change
  useEffect(() => {
    filterEntries()
  }, [entries, searchQuery, selectedTags])

  const checkAuth = async () => {
    if (!isSupabaseConfigured()) {
      setAuthChecked(true)
      return
    }

    const authenticated = await isAuthenticated()
    if (authenticated) {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      // Sync data after checking auth
      await syncData()
    }
    setAuthChecked(true)
  }

  const loadData = async () => {
    const loadedEntries = await getAllEntries()
    const loadedTags = await getAllTags()
    setEntries(loadedEntries)
    setTags(loadedTags)
  }

  const filterEntries = async () => {
    let result = entries

    // Apply search filter
    if (searchQuery.trim()) {
      result = await searchEntries(searchQuery)
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      result = result.filter(entry =>
        selectedTags.some(tag => entry.tags.includes(tag))
      )
    }

    setFilteredEntries(result)
  }

  const handleSaveEntry = async (entry: DiaryEntry) => {
    await saveEntry(entry)

    // Save any new tags
    for (const tagName of entry.tags) {
      const existingTag = tags.find(t => t.name === tagName)
      if (!existingTag) {
        const newTag: Tag = {
          id: generateId(),
          name: tagName,
          color: '#4f46e5',
          createdAt: Date.now(),
        }
        await saveTag(newTag)
      }
    }

    await loadData()
    setIsEditing(false)
    setSelectedEntry(null)

    // Sync after saving if authenticated
    if (user) {
      syncData()
    }
  }

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id)
    await loadData()
    if (selectedEntry?.id === id) {
      setSelectedEntry(null)
    }

    // Sync after deleting if authenticated
    if (user) {
      syncData()
    }
  }

  const handleNewEntry = () => {
    setSelectedEntry(null)
    setIsEditing(true)
  }

  const handleSelectEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setSelectedEntry(null)
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleAuthStateChange = () => {
    // Refresh auth state
    checkAuth()
  }

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: 'var(--text-secondary)'
      }}>
        Loading...
      </div>
    )
  }

  // Show auth screen if Supabase is configured but user is not authenticated
  if (isSupabaseConfigured() && !user && showAuth) {
    return <Auth onAuthStateChange={handleAuthStateChange} />
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📔 Personal Diary</h1>
        <div className="header-actions">
          <div className="online-indicator">
            <div className={`online-dot ${isOnline ? '' : 'offline'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {isSupabaseConfigured() && (
            user ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {user.email}
                </span>
                <button className="btn btn-secondary" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowAuth(true)}>
                Sign In
              </button>
            )
          )}
          <button className="btn btn-primary" onClick={handleNewEntry}>
            + New Entry
          </button>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Search</h3>
            <input
              type="text"
              className="search-box"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sidebar-section">
            <h3>View</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn ${currentView === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('list')}
              >
                List
              </button>
              <button
                className={`btn ${currentView === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('calendar')}
              >
                Calendar
              </button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="sidebar-section">
              <h3>Tags</h3>
              <div className="tag-list">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    className={`tag ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag.name)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h3>Stats</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Total entries: {entries.length}
            </p>
            {isSupabaseConfigured() && user && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Syncing enabled
              </p>
            )}
          </div>
        </aside>

        <main className="content-area">
          {isEditing ? (
            <EntryEditor
              entry={selectedEntry}
              onSave={handleSaveEntry}
              onCancel={handleCancelEdit}
            />
          ) : currentView === 'list' ? (
            <EntryList
              entries={filteredEntries}
              selectedEntry={selectedEntry}
              onSelectEntry={handleSelectEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          ) : (
            <CalendarView
              entries={filteredEntries}
              onSelectEntry={handleSelectEntry}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
