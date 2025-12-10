import { useState, useEffect } from 'react'
import { VscGitCommit, VscRefresh, VscCheck, VscFile, VscDiffAdded, VscDiffModified, VscDiffRemoved } from 'react-icons/vsc'
import { GitCommit, GitStatus } from '../../types'
import '../styles/GitHistoryPanel.css'

interface GitHistoryPanelProps {
  projectId: string
  projectPath: string
  projectName: string
  gitStatus: GitStatus
  onClose: () => void
}

interface FileChange {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'untracked'
}

export function GitHistoryPanel({ projectId, projectPath, projectName, gitStatus, onClose }: GitHistoryPanelProps) {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [fileChanges, setFileChanges] = useState<FileChange[]>([])
  const [loading, setLoading] = useState(true)
  const [committing, setCommitting] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')

  const loadGitData = async () => {
    setLoading(true)
    try {
      // Load commits
      const commitsResult = await window.api.git.getRecentCommits(projectPath, 10)
      if (commitsResult.success && commitsResult.commits) {
        setCommits(commitsResult.commits)
      }

      // Load file changes
      const changesResult = await window.api.git.getFileChanges(projectPath)
      if (changesResult.success && changesResult.changes) {
        setFileChanges(changesResult.changes)
      }
    } catch (error) {
      console.error('Failed to load git data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGitData()
  }, [projectPath])

  const handleRefresh = () => {
    loadGitData()
  }

  const handleCommitAll = async () => {
    if (!commitMessage.trim()) {
      alert('Please enter a commit message')
      return
    }

    setCommitting(true)
    try {
      const result = await window.api.git.commitAll(projectPath, commitMessage)
      if (result.success) {
        setCommitMessage('')
        await loadGitData()
      } else {
        alert(`Commit failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to commit:', error)
      alert('Failed to commit changes')
    } finally {
      setCommitting(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added':
      case 'untracked':
        return <VscDiffAdded className="status-icon added" />
      case 'modified':
        return <VscDiffModified className="status-icon modified" />
      case 'deleted':
        return <VscDiffRemoved className="status-icon deleted" />
      default:
        return <VscFile className="status-icon" />
    }
  }

  return (
    <div className="git-history-panel">
      <div className="git-history-header">
        <h3>Git History - {projectName}</h3>
        <div className="git-history-actions">
          <button
            className="btn-icon"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
          >
            <VscRefresh className={loading ? 'spinning' : ''} />
          </button>
          <button
            className="btn-icon"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="git-history-content">
        {/* File Changes Section */}
        {gitStatus.hasChanges && (
          <div className="git-changes-section">
            <h4>Changes ({fileChanges.length})</h4>

            {fileChanges.length > 0 ? (
              <>
                <div className="file-changes-list">
                  {fileChanges.map((change, index) => (
                    <div key={index} className="file-change-item">
                      {getStatusIcon(change.status)}
                      <span className="file-path" title={change.path}>
                        {change.path}
                      </span>
                      <span className={`status-badge ${change.status}`}>
                        {change.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="commit-section">
                  <input
                    type="text"
                    className="commit-input"
                    placeholder="Commit message..."
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleCommitAll()
                      }
                    }}
                    disabled={committing}
                  />
                  <button
                    className="btn-commit"
                    onClick={handleCommitAll}
                    disabled={committing || !commitMessage.trim()}
                  >
                    <VscCheck />
                    {committing ? 'Committing...' : 'Commit All'}
                  </button>
                </div>
              </>
            ) : (
              <p className="no-changes">No changes detected</p>
            )}
          </div>
        )}

        {/* Commit History Section */}
        <div className="git-commits-section">
          <h4>Recent Commits</h4>

          {loading ? (
            <p className="loading">Loading commits...</p>
          ) : commits.length > 0 ? (
            <div className="commits-list">
              {commits.map((commit) => (
                <div key={commit.hash} className="commit-item">
                  <div className="commit-icon">
                    <VscGitCommit />
                  </div>
                  <div className="commit-details">
                    <div className="commit-message">{commit.message}</div>
                    <div className="commit-meta">
                      <span className="commit-author">{commit.author}</span>
                      <span className="commit-separator">•</span>
                      <span className="commit-hash">{commit.shortHash}</span>
                      <span className="commit-separator">•</span>
                      <span className="commit-date">{formatDate(commit.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-commits">No commits yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
