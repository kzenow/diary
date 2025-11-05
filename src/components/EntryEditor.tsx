import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { DiaryEntry, Attachment } from '../types'
import { generateId } from '../db'
import './EntryEditor.css'

interface EntryEditorProps {
  entry: DiaryEntry | null
  onSave: (entry: DiaryEntry) => void
  onCancel: () => void
}

export default function EntryEditor({ entry, onSave, onCancel }: EntryEditorProps) {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setTags(entry.tags)
      setAttachments(entry.attachments)
      editor?.commands.setContent(entry.content)
    } else {
      setTitle('')
      setTags([])
      setAttachments([])
      editor?.commands.setContent('')
    }
  }, [entry, editor])

  const handleSave = () => {
    const content = editor?.getHTML() || ''
    const now = Date.now()

    const savedEntry: DiaryEntry = {
      id: entry?.id || generateId(),
      title: title.trim() || 'Untitled',
      content,
      tags,
      attachments,
      createdAt: entry?.createdAt || now,
      updatedAt: now,
      synced: false,
      deleted: false,
    }

    onSave(savedEntry)
  }

  const addTag = () => {
    const newTag = tagInput.trim()
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 10MB.`)
        continue
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const attachment: Attachment = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target?.result as string,
          createdAt: Date.now(),
        }
        setAttachments([...attachments, attachment])
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="entry-editor">
      <div className="editor-header">
        <input
          type="text"
          className="title-input"
          placeholder="Entry title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>

      {editor && (
        <div className="editor-toolbar">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'is-active' : ''}
          >
            1. List
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="editor-content" />

      <div className="editor-section">
        <h4>Tags</h4>
        <div className="tag-input-container">
          <input
            type="text"
            className="tag-input"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <button className="btn btn-secondary" onClick={addTag}>
            Add
          </button>
        </div>
        <div className="tag-list">
          {tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button onClick={() => removeTag(tag)}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="editor-section">
        <h4>Attachments</h4>
        <label className="file-upload-btn">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <span className="btn btn-secondary">Upload Photos</span>
        </label>
        <div className="attachments-list">
          {attachments.map(att => (
            <div key={att.id} className="attachment-item">
              {att.type.startsWith('image/') && (
                <img src={att.data} alt={att.name} className="attachment-preview" />
              )}
              <div className="attachment-info">
                <span className="attachment-name">{att.name}</span>
                <span className="attachment-size">{formatFileSize(att.size)}</span>
              </div>
              <button
                className="attachment-remove"
                onClick={() => removeAttachment(att.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
