import { useContext, useState, useEffect, useMemo } from 'react'
import { VscTerminal, VscFiles } from 'react-icons/vsc'
import { AppContext } from '../context/AppContext'
import { FileTree } from './FileTree/FileTree'
import { FileNode, EditorTab } from '../../types'
import { getProjectColor } from '../utils/projectColors'
import '../styles/ExplorerView.css'

export function ExplorerView() {
  const { state, dispatch } = useContext(AppContext)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Calculate which project the active tab belongs to
  const activeProjectId = useMemo(() => {
    if (state.activeEditorTabId) {
      const activeTab = state.editorTabs.find(t => t.id === state.activeEditorTabId)
      if (activeTab) {
        return state.projects.find(p =>
          activeTab.filePath.startsWith(p.path)
        )?.id
      }
    } else if (state.activeTerminalId) {
      const activeTerminal = state.terminals.find(t => t.id === state.activeTerminalId)
      if (activeTerminal) {
        return activeTerminal.projectId
      }
    }
    return undefined
  }, [state.activeEditorTabId, state.activeTerminalId, state.editorTabs, state.terminals, state.projects])

  // Auto-expand project when its tab is selected
  useEffect(() => {
    if (activeProjectId) {
      setExpandedProjects(prev => {
        if (prev.size !== 1 || !prev.has(activeProjectId)) {
          return new Set([activeProjectId])
        }
        return prev
      })
    }
  }, [activeProjectId])

  const handleAddProject = async () => {
    const result = await window.api.dialog.openFolder()
    if (result.success && result.data) {
      const addResult = await window.api.projects.add(
        result.data.path,
        result.data.name
      )
      if (addResult.success && addResult.project) {
        setExpandedProjects(new Set([addResult.project!.id]))
      }
    }
  }

  const handleRemoveProject = async (id: string) => {
    const result = await window.api.projects.remove(id)
    if (result.success) {
      setExpandedProjects(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleToggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      if (prev.has(projectId)) {
        return new Set()
      } else {
        return new Set([projectId])
      }
    })
  }

  const handleFileClick = async (file: FileNode) => {
    if (file.type === 'file') {
      try {
        const result = await window.api.fs.readFile(file.path)
        if (result.success && result.content !== undefined && result.fileType) {
          const tab: EditorTab = {
            id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            filePath: file.path,
            fileName: file.name,
            fileType: result.fileType as EditorTab['fileType'],
            content: result.content,
            isDirty: false
          }
          dispatch({ type: 'ADD_EDITOR_TAB', payload: tab })
        }
      } catch (error) {
        console.error('Error opening file:', error)
      }
    }
  }

  return (
    <div className="explorer-view">
      <div className="explorer-view-header">
        <div className="header-title">
          <VscFiles className="header-icon" />
          <h2>Explorer</h2>
        </div>
        <button
          className="btn-icon btn-add"
          onClick={handleAddProject}
          title="Add Project"
        >
          +
        </button>
      </div>

      <div className="explorer-view-content">
        {state.projects.map(project => {
          const projectColor = getProjectColor(project.id, project.color)

          return (
            <div key={project.id} className="project-section">
              <div
                className="project-header"
                onClick={() => handleToggleProject(project.id)}
              >
                <span className="expand-icon">
                  {expandedProjects.has(project.id) ? '▼' : '▶'}
                </span>
                <span
                  className="project-color-indicator"
                  style={{ backgroundColor: projectColor }}
                  title={`Project color: ${projectColor}`}
                />
                <span className="project-name">{project.name}</span>

                <button
                  className="btn-icon btn-terminal"
                  onClick={async (e) => {
                    e.stopPropagation()
                    const result = await window.api.terminal.create(
                      project.path,
                      project.id,
                      project.name
                    )
                    if (result.success && result.terminal) {
                      dispatch({ type: 'ADD_TERMINAL', payload: result.terminal })
                    }
                  }}
                  title="Open Terminal"
                >
                  <VscTerminal />
                </button>
                <button
                  className="btn-icon btn-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveProject(project.id)
                  }}
                  title="Remove Project"
                >
                  ×
                </button>
              </div>
              {expandedProjects.has(project.id) && (
                <FileTree
                  projectId={project.id}
                  projectPath={project.path}
                  projectName={project.name}
                  onFileClick={handleFileClick}
                  activeFilePath={
                    state.activeEditorTabId
                      ? state.editorTabs.find(t => t.id === state.activeEditorTabId)?.filePath
                      : undefined
                  }
                />
              )}
            </div>
          )
        })}
        {state.projects.length === 0 && (
          <div className="explorer-view-empty">
            <p>No projects added yet</p>
            <p>Click the + button to add a project</p>
          </div>
        )}
      </div>
    </div>
  )
}
