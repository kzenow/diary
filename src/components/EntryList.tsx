import { DiaryEntry } from '../types'
import './EntryList.css'

interface EntryListProps {
  entries: DiaryEntry[]
  selectedEntry: DiaryEntry | null
  onSelectEntry: (entry: DiaryEntry) => void
  onDeleteEntry: (id: string) => void
}

export default function EntryList({
  entries,
  selectedEntry,
  onSelectEntry,
  onDeleteEntry,
}: EntryListProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getPreview = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    const text = div.textContent || div.innerText || ''
    return text.slice(0, 100) + (text.length > 100 ? '...' : '')
  }

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📔</div>
        <h2>No entries yet</h2>
        <p>Click "New Entry" to start writing</p>
      </div>
    )
  }

  return (
    <div className="entry-list">
      {entries.map(entry => (
        <div
          key={entry.id}
          className={`entry-card ${selectedEntry?.id === entry.id ? 'selected' : ''}`}
          onClick={() => onSelectEntry(entry)}
        >
          <div className="entry-card-header">
            <h3 className="entry-title">{entry.title || 'Untitled'}</h3>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Delete this entry?')) {
                  onDeleteEntry(entry.id)
                }
              }}
            >
              ×
            </button>
          </div>
          <p className="entry-preview">{getPreview(entry.content)}</p>
          <div className="entry-meta">
            <span className="entry-date">{formatDate(entry.createdAt)}</span>
            {entry.tags.length > 0 && (
              <div className="entry-tags">
                {entry.tags.map(tag => (
                  <span key={tag} className="entry-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {!entry.synced && (
            <div className="sync-indicator">Not synced</div>
          )}
        </div>
      ))}
    </div>
  )
}
