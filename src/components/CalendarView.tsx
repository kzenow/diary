import { useState } from 'react'
import Calendar from 'react-calendar'
import { DiaryEntry } from '../types'
import 'react-calendar/dist/Calendar.css'
import './CalendarView.css'

interface CalendarViewProps {
  entries: DiaryEntry[]
  onSelectEntry: (entry: DiaryEntry) => void
}

export default function CalendarView({ entries, onSelectEntry }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Get entries for a specific date
  const getEntriesForDate = (date: Date) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return entries.filter(entry => {
      const entryDate = new Date(entry.createdAt)
      return entryDate >= startOfDay && entryDate <= endOfDay
    })
  }

  // Check if a date has entries
  const hasEntriesOnDate = (date: Date) => {
    return getEntriesForDate(date).length > 0
  }

  const selectedEntries = getEntriesForDate(selectedDate)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        <Calendar
          onChange={(value) => setSelectedDate(value as Date)}
          value={selectedDate}
          tileClassName={({ date }) =>
            hasEntriesOnDate(date) ? 'has-entries' : null
          }
        />
      </div>

      <div className="selected-date-entries">
        <h2>{formatDate(selectedDate)}</h2>
        {selectedEntries.length === 0 ? (
          <div className="empty-state">
            <p>No entries for this day</p>
          </div>
        ) : (
          <div className="date-entries-list">
            {selectedEntries.map(entry => (
              <div
                key={entry.id}
                className="date-entry-card"
                onClick={() => onSelectEntry(entry)}
              >
                <div className="date-entry-header">
                  <h3>{entry.title || 'Untitled'}</h3>
                  <span className="entry-time">{formatTime(entry.createdAt)}</span>
                </div>
                <p className="date-entry-preview">
                  {entry.content.replace(/<[^>]*>/g, '').slice(0, 150)}
                  {entry.content.length > 150 ? '...' : ''}
                </p>
                {entry.tags.length > 0 && (
                  <div className="date-entry-tags">
                    {entry.tags.map(tag => (
                      <span key={tag} className="entry-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
