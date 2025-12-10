import { useContext, useState, useEffect } from 'react'
import { VscSourceControl } from 'react-icons/vsc'
import { AppContext } from '../context/AppContext'
import { GitHistoryPanel } from './GitHistoryPanel'
import { GitStatus } from '../../types'
import '../styles/GitView.css'

export function GitView() {
  const { state } = useContext(AppContext)
  const [gitStatuses, setGitStatuses] = useState<Map<string, GitStatus>>(new Map())
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Load Git status for all projects
  useEffect(() => {
    const loadGitStatuses = async () => {
      const statusMap = new Map<string, GitStatus>()

      for (const project of state.projects) {
        try {
          const result = await window.api.git.getStatus(project.path)
          if (result.success && result.status) {
            statusMap.set(project.id, result.status)
          }
        } catch (error) {
          console.error(`Failed to get git status for ${project.name}:`, error)
        }
      }

      setGitStatuses(statusMap)
    }

    if (state.projects.length > 0) {
      loadGitStatuses()

      // Refresh git statuses every 10 seconds
      const interval = setInterval(loadGitStatuses, 10000)
      return () => clearInterval(interval)
    }
  }, [state.projects])

  const gitProjects = state.projects.filter(project => {
    const status = gitStatuses.get(project.id)
    return status?.isRepo
  })

  return (
    <div className="git-view">
      <div className="git-view-header">
        <div className="header-title">
          <VscSourceControl className="header-icon" />
          <h2>Source Control</h2>
        </div>
      </div>

      <div className="git-view-content">
        {gitProjects.length === 0 ? (
          <div className="git-view-empty">
            <VscSourceControl className="empty-icon" />
            <p>No Git repositories found</p>
            <p className="empty-hint">
              Projects with Git will appear here
            </p>
          </div>
        ) : (
          <div className="git-projects-list">
            {gitProjects.map(project => {
              const gitStatus = gitStatuses.get(project.id)
              const isSelected = selectedProjectId === project.id

              return (
                <div key={project.id} className="git-project-item">
                  <div
                    className={`git-project-header ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedProjectId(isSelected ? null : project.id)}
                  >
                    <div className="project-info">
                      <span className="project-name">{project.name}</span>
                      {gitStatus && (
                        <div className="project-git-info">
                          <span className="branch-name">
                            {gitStatus.currentBranch || 'main'}
                          </span>
                          {gitStatus.hasChanges && (
                            <span className="changes-indicator">
                              {gitStatus.ahead && gitStatus.ahead > 0 && (
                                <span className="ahead-indicator" title={`${gitStatus.ahead} commits ahead`}>
                                  ↑{gitStatus.ahead}
                                </span>
                              )}
                              {gitStatus.behind && gitStatus.behind > 0 && (
                                <span className="behind-indicator" title={`${gitStatus.behind} commits behind`}>
                                  ↓{gitStatus.behind}
                                </span>
                              )}
                              <span className="modified-indicator" title="Uncommitted changes">
                                •
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="expand-icon">
                      {isSelected ? '▼' : '▶'}
                    </span>
                  </div>

                  {isSelected && gitStatus && (
                    <GitHistoryPanel
                      projectId={project.id}
                      projectPath={project.path}
                      projectName={project.name}
                      gitStatus={gitStatus}
                      onClose={() => setSelectedProjectId(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
