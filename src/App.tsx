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
  }

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id)
    await loadData()
    if (selectedEntry?.id === id) {
      setSelectedEntry(null)
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

  return (
    <div className="app">
      <header className="header">
        <h1>📔 Personal Diary</h1>
        <div className="header-actions">
          <div className="online-indicator">
            <div className={`online-dot ${isOnline ? '' : 'offline'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
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
