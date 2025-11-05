import { useState } from 'react'
import { Tag } from '../types'
import { generateId } from '../db'
import './TagManager.css'

interface TagManagerProps {
  tags: Tag[]
  onSaveTag: (tag: Tag) => void
  onDeleteTag: (id: string) => void
  onClose: () => void
}

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#dc2626', // Red
  '#ea580c', // Orange
  '#ca8a04', // Yellow
  '#16a34a', // Green
  '#0891b2', // Cyan
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#64748b', // Slate
]

export default function TagManager({ tags, onSaveTag, onDeleteTag, onClose }: TagManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#4f46e5')

  const handleStartEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return

    const tag = tags.find(t => t.id === editingId)
    if (tag) {
      onSaveTag({
        ...tag,
        name: editName.trim(),
        color: editColor,
      })
    }
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const handleCreateTag = () => {
    const name = newTagName.trim()
    if (!name) return

    // Check if tag already exists
    if (tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      alert('A tag with this name already exists')
      return
    }

    const newTag: Tag = {
      id: generateId(),
      name,
      color: newTagColor,
      createdAt: Date.now(),
    }

    onSaveTag(newTag)
    setNewTagName('')
    setNewTagColor('#4f46e5')
  }

  const handleDelete = (tag: Tag) => {
    if (confirm(`Delete tag "${tag.name}"? This won't delete entries with this tag.`)) {
      onDeleteTag(tag.id)
    }
  }

  return (
    <div className="tag-manager-overlay" onClick={onClose}>
      <div className="tag-manager" onClick={(e) => e.stopPropagation()}>
        <div className="tag-manager-header">
          <h2>Manage Tags</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tag-manager-content">
          {/* Create New Tag Section */}
          <div className="new-tag-section">
            <h3>Create New Tag</h3>
            <div className="tag-form">
              <input
                type="text"
                className="tag-name-input"
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
              />
              <div className="color-picker-section">
                <label>Color:</label>
                <div className="color-preset-grid">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className={`color-preset ${newTagColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                      title={color}
                    />
                  ))}
                  <input
                    type="color"
                    className="color-picker-custom"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    title="Custom color"
                  />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleCreateTag}>
                Create Tag
              </button>
            </div>
          </div>

          {/* Existing Tags List */}
          <div className="existing-tags-section">
            <h3>Existing Tags ({tags.length})</h3>
            {tags.length === 0 ? (
              <p className="empty-message">No tags yet. Create your first tag above!</p>
            ) : (
              <div className="tags-list">
                {tags.map(tag => (
                  <div key={tag.id} className="tag-item">
                    {editingId === tag.id ? (
                      // Edit Mode
                      <div className="tag-edit-form">
                        <input
                          type="text"
                          className="tag-name-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          autoFocus
                        />
                        <div className="color-picker-section">
                          <label>Color:</label>
                          <div className="color-preset-grid">
                            {PRESET_COLORS.map(color => (
                              <button
                                key={color}
                                className={`color-preset ${editColor === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setEditColor(color)}
                                title={color}
                              />
                            ))}
                            <input
                              type="color"
                              className="color-picker-custom"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              title="Custom color"
                            />
                          </div>
                        </div>
                        <div className="tag-edit-actions">
                          <button className="btn btn-primary" onClick={handleSaveEdit}>
                            Save
                          </button>
                          <button className="btn btn-secondary" onClick={handleCancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="tag-display">
                          <span
                            className="tag-color-badge"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="tag-name">{tag.name}</span>
                        </div>
                        <div className="tag-actions">
                          <button
                            className="btn-icon edit-btn"
                            onClick={() => handleStartEdit(tag)}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-icon delete-btn"
                            onClick={() => handleDelete(tag)}
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
