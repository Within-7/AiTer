import React, { useMemo } from 'react'
import '../../styles/DiffViewer.css'

interface DiffViewerProps {
  diffContent: string
  fileName: string
  commitHash?: string
  commitMessage?: string
}

interface DiffLine {
  type: 'added' | 'removed' | 'context' | 'header' | 'hunk'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export function DiffViewer({ diffContent, fileName, commitHash, commitMessage }: DiffViewerProps) {
  const parsedLines = useMemo(() => {
    if (!diffContent) return []

    const lines = diffContent.split('\n')
    const result: DiffLine[] = []

    let oldLine = 0
    let newLine = 0

    for (const line of lines) {
      if (line.startsWith('diff --git') || line.startsWith('index ') ||
          line.startsWith('---') || line.startsWith('+++') ||
          line.startsWith('new file') || line.startsWith('deleted file')) {
        result.push({ type: 'header', content: line })
      } else if (line.startsWith('@@')) {
        // Parse hunk header to get line numbers
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
        if (match) {
          oldLine = parseInt(match[1], 10)
          newLine = parseInt(match[2], 10)
        }
        result.push({ type: 'hunk', content: line })
      } else if (line.startsWith('+')) {
        result.push({
          type: 'added',
          content: line.substring(1),
          newLineNumber: newLine++
        })
      } else if (line.startsWith('-')) {
        result.push({
          type: 'removed',
          content: line.substring(1),
          oldLineNumber: oldLine++
        })
      } else if (line.startsWith(' ')) {
        result.push({
          type: 'context',
          content: line.substring(1),
          oldLineNumber: oldLine++,
          newLineNumber: newLine++
        })
      } else if (line === '') {
        // Empty line in context
        result.push({
          type: 'context',
          content: '',
          oldLineNumber: oldLine++,
          newLineNumber: newLine++
        })
      }
    }

    return result
  }, [diffContent])

  // Calculate statistics
  const stats = useMemo(() => {
    let additions = 0
    let deletions = 0
    for (const line of parsedLines) {
      if (line.type === 'added') additions++
      if (line.type === 'removed') deletions++
    }
    return { additions, deletions }
  }, [parsedLines])

  if (!diffContent) {
    return (
      <div className="diff-viewer diff-viewer-empty">
        <p>No changes to display</p>
      </div>
    )
  }

  return (
    <div className="diff-viewer">
      <div className="diff-viewer-header">
        <div className="diff-file-info">
          <span className="diff-file-name">{fileName}</span>
          {commitHash && (
            <span className="diff-commit-hash">{commitHash.substring(0, 7)}</span>
          )}
        </div>
        <div className="diff-stats">
          <span className="diff-additions">+{stats.additions}</span>
          <span className="diff-deletions">-{stats.deletions}</span>
        </div>
      </div>

      {commitMessage && (
        <div className="diff-commit-message">
          {commitMessage}
        </div>
      )}

      <div className="diff-content">
        <table className="diff-table">
          <tbody>
            {parsedLines.map((line, index) => (
              <tr key={index} className={`diff-line diff-line-${line.type}`}>
                <td className="diff-line-number diff-line-old">
                  {line.type === 'removed' || line.type === 'context' ? line.oldLineNumber : ''}
                </td>
                <td className="diff-line-number diff-line-new">
                  {line.type === 'added' || line.type === 'context' ? line.newLineNumber : ''}
                </td>
                <td className="diff-line-marker">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </td>
                <td className="diff-line-content">
                  <pre>{line.content}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
