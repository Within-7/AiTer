import React, { useState } from 'react'
import './Plugins.css'

interface AddPluginDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (urlOrPackageName: string) => Promise<void>
}

export const AddPluginDialog: React.FC<AddPluginDialogProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [urlOrPackageName, setUrlOrPackageName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!urlOrPackageName.trim()) {
      setError('Please enter a package URL or name')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      await onAdd(urlOrPackageName.trim())
      setUrlOrPackageName('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add plugin')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    if (!isAdding) {
      setUrlOrPackageName('')
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="plugin-dialog-overlay" onClick={handleClose}>
      <div className="plugin-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="plugin-dialog-header">
          <h3>Add Custom Plugin</h3>
          <button
            className="plugin-dialog-close"
            onClick={handleClose}
            disabled={isAdding}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <form className="plugin-dialog-content" onSubmit={handleSubmit}>
          <div className="plugin-dialog-field">
            <label htmlFor="plugin-url">Package URL or Name</label>
            <input
              id="plugin-url"
              type="text"
              value={urlOrPackageName}
              onChange={(e) => setUrlOrPackageName(e.target.value)}
              placeholder="https://www.npmjs.com/package/@within-7/minto or @within-7/minto"
              disabled={isAdding}
              autoFocus
            />
            <p className="plugin-dialog-hint">
              Enter an npm package URL (e.g., https://www.npmjs.com/package/package-name) or
              package name (e.g., @scope/package-name)
            </p>
          </div>

          {error && (
            <div className="plugin-dialog-error">
              <span className="plugin-dialog-error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="plugin-dialog-actions">
            <button
              type="button"
              className="plugin-dialog-button plugin-dialog-button-cancel"
              onClick={handleClose}
              disabled={isAdding}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="plugin-dialog-button plugin-dialog-button-primary"
              disabled={isAdding}
            >
              {isAdding ? 'Adding...' : 'Add Plugin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
