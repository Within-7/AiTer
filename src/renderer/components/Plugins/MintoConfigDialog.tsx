import React, { useState, useEffect } from 'react'
import { MintoConfig } from '../../../types/pluginConfigs'

interface MintoConfigDialogProps {
  isOpen: boolean
  currentConfig: MintoConfig
  onClose: () => void
  onSave: (config: MintoConfig) => Promise<void>
}

export const MintoConfigDialog: React.FC<MintoConfigDialogProps> = ({
  isOpen,
  currentConfig,
  onClose,
  onSave
}) => {
  const [autoUpdate, setAutoUpdate] = useState(
    currentConfig.autoUpdate ?? false
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setAutoUpdate(currentConfig.autoUpdate ?? false)
      setError(null)
    }
  }, [isOpen, currentConfig])

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      const config: MintoConfig = {
        autoUpdate
      }

      await onSave(config)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="minto-config-overlay" onClick={handleOverlayClick}>
      <div className="minto-config-dialog">
        <div className="minto-config-header">
          <h2>Minto Configuration</h2>
          <button
            className="minto-config-close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="minto-config-content">
          <div className="minto-config-field">
            <label className="minto-config-checkbox-label">
              <input
                type="checkbox"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
                disabled={isSaving}
              />
              <span>Automatically update Minto</span>
            </label>
            <p className="minto-config-hint">
              Automatically update Minto CLI to the latest version when updates are available (updates run in terminal)
            </p>
          </div>

          {error && (
            <div className="minto-config-error">
              <span className="minto-config-error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>

        <div className="minto-config-footer">
          <button
            className="minto-config-btn minto-config-btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="minto-config-btn minto-config-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}
