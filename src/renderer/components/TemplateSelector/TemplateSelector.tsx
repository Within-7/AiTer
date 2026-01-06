import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { VscFolder, VscNewFolder } from 'react-icons/vsc'
import './TemplateSelector.css'

/**
 * Project template configuration from backend
 */
interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon?: string
  category: 'basic' | 'work' | 'development' | 'enterprise'
  order: number
  templateDir: string
  requiredLicense?: string
}

interface TemplateSelectorProps {
  onSelect: (templateId: string | null, projectPath: string, projectName: string) => void
  onCancel: () => void
}

/**
 * Category labels for display
 */
const CATEGORY_LABELS: Record<ProjectTemplate['category'], string> = {
  basic: 'Basic',
  work: 'Work',
  development: 'Development',
  enterprise: 'Enterprise'
}

/**
 * TemplateSelector component
 * Allows users to select a project template when creating a new project
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  onCancel
}) => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [step, setStep] = useState<'template' | 'location'>('template')
  const [projectPath, setProjectPath] = useState('')
  const [projectName, setProjectName] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const result = await window.api.templates.list()
        if (result.success && result.templates) {
          setTemplates(result.templates)
          // Auto-select 'blank' template if available
          const blankTemplate = result.templates.find(t => t.id === 'blank')
          if (blankTemplate) {
            setSelectedTemplateId(blankTemplate.id)
          } else if (result.templates.length > 0) {
            setSelectedTemplateId(result.templates[0].id)
          }
        } else {
          setError(result.error || 'Failed to load templates')
        }
      } catch (err) {
        setError('Failed to load templates')
        console.error('Error loading templates:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onCancel()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onCancel])

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<ProjectTemplate['category'], ProjectTemplate[]>)

  // Handle folder selection
  const handleSelectFolder = async () => {
    try {
      const result = await window.api.dialog.openFolder()
      if (result.success && result.data) {
        setProjectPath(result.data.path)
        setProjectName(result.data.name)
      }
    } catch (err) {
      console.error('Error selecting folder:', err)
    }
  }

  // Handle create project
  const handleCreate = () => {
    if (projectPath && projectName) {
      onSelect(selectedTemplateId, projectPath, projectName)
    }
  }

  // Render template selection step
  const renderTemplateStep = () => (
    <>
      <div className="template-selector-header">
        <h3>Select Project Template</h3>
        <p className="template-selector-subtitle">
          Choose a template to start your project with pre-configured AI CLI rules
        </p>
      </div>

      <div className="template-selector-content">
        {loading && (
          <div className="template-selector-loading">Loading templates...</div>
        )}

        {error && (
          <div className="template-selector-error">{error}</div>
        )}

        {!loading && !error && (
          <div className="template-categories">
            {(['basic', 'work', 'development', 'enterprise'] as const).map(category => {
              const categoryTemplates = templatesByCategory[category]
              if (!categoryTemplates || categoryTemplates.length === 0) return null

              return (
                <div key={category} className="template-category">
                  <h4 className="template-category-title">{CATEGORY_LABELS[category]}</h4>
                  <div className="template-list">
                    {categoryTemplates.map(template => (
                      <div
                        key={template.id}
                        className={`template-card ${selectedTemplateId === template.id ? 'selected' : ''}`}
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        <div className="template-icon">
                          {template.icon || '📁'}
                        </div>
                        <div className="template-info">
                          <div className="template-name">{template.name}</div>
                          <div className="template-description">{template.description}</div>
                        </div>
                        {selectedTemplateId === template.id && (
                          <div className="template-check">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="template-selector-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setStep('location')}
          disabled={!selectedTemplateId && templates.length > 0}
        >
          Next
        </button>
      </div>
    </>
  )

  // Render location selection step
  const renderLocationStep = () => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

    return (
      <>
        <div className="template-selector-header">
          <h3>Select Project Location</h3>
          <p className="template-selector-subtitle">
            Choose a folder for your new project
          </p>
        </div>

        <div className="template-selector-content location-step">
          {/* Selected template preview */}
          {selectedTemplate && (
            <div className="selected-template-preview">
              <div className="template-icon">{selectedTemplate.icon || '📁'}</div>
              <div className="template-info">
                <div className="template-name">{selectedTemplate.name}</div>
                <div className="template-description">{selectedTemplate.description}</div>
              </div>
            </div>
          )}

          {/* Folder selection */}
          <div className="folder-selection">
            <label>Project Folder</label>
            <div className="folder-input-group">
              <input
                type="text"
                value={projectPath}
                placeholder="Select a folder..."
                readOnly
                className="folder-input"
              />
              <button
                type="button"
                className="btn-browse"
                onClick={handleSelectFolder}
              >
                <VscFolder />
                Browse
              </button>
            </div>
          </div>

          {/* Project name (auto-filled from folder) */}
          {projectPath && (
            <div className="project-name-display">
              <label>Project Name</label>
              <div className="project-name-value">{projectName}</div>
            </div>
          )}
        </div>

        <div className="template-selector-actions">
          <button type="button" className="btn-secondary" onClick={() => setStep('template')}>
            Back
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCreate}
            disabled={!projectPath || !projectName}
          >
            <VscNewFolder />
            Create Project
          </button>
        </div>
      </>
    )
  }

  return createPortal(
    <div className="template-selector-overlay">
      <div ref={dialogRef} className="template-selector-dialog">
        {step === 'template' ? renderTemplateStep() : renderLocationStep()}
      </div>
    </div>,
    document.body
  )
}
