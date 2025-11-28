import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import '../styles/StatusBar.css'

export function StatusBar() {
  const { state } = useContext(AppContext)

  // Get active terminal info
  const activeTerminal = state.terminals.find(t => t.id === state.activeTerminalId)

  // Get active project info
  const activeProject = state.projects.find(p => p.id === state.activeProjectId)

  // Count stats
  const projectCount = state.projects.length
  const terminalCount = state.terminals.length
  const editorTabCount = state.editorTabs.length

  return (
    <div className="status-bar">
      <div className="status-bar-section status-bar-left">
        {activeProject && (
          <span className="status-item" title="Active Project">
            📁 {activeProject.name}
          </span>
        )}
        {activeTerminal && (
          <span className="status-item" title="Active Terminal">
            ▶ {activeTerminal.shell.split('/').pop()}
          </span>
        )}
      </div>

      <div className="status-bar-section status-bar-center">
        {activeTerminal && activeTerminal.pid && (
          <span className="status-item" title="Process ID">
            PID: {activeTerminal.pid}
          </span>
        )}
      </div>

      <div className="status-bar-section status-bar-right">
        {projectCount > 0 && (
          <span className="status-item" title="Projects">
            {projectCount} {projectCount === 1 ? 'Project' : 'Projects'}
          </span>
        )}
        {terminalCount > 0 && (
          <span className="status-item" title="Terminals">
            {terminalCount} {terminalCount === 1 ? 'Terminal' : 'Terminals'}
          </span>
        )}
        {editorTabCount > 0 && (
          <span className="status-item" title="Editor Tabs">
            {editorTabCount} {editorTabCount === 1 ? 'Tab' : 'Tabs'}
          </span>
        )}
      </div>
    </div>
  )
}
