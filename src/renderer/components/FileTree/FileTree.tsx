import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FileNode, FileChange } from '../../../types'
import { FileTreeNode } from './FileTreeNode'
import './FileTree.css'

interface FileTreeProps {
  projectId: string
  projectPath: string
  projectName: string
  onFileClick: (file: FileNode) => void
  activeFilePath?: string
}

export const FileTree: React.FC<FileTreeProps> = ({
  projectPath,
  onFileClick,
  activeFilePath
}) => {
  const [nodes, setNodes] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gitChanges, setGitChanges] = useState<Map<string, FileChange['status']>>(new Map())
  const gitPollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load git file changes
  const loadGitChanges = useCallback(async () => {
    try {
      const result = await window.api.git.getFileChanges(projectPath)
      if (result.success && result.changes) {
        const changesMap = new Map<string, FileChange['status']>()
        result.changes.forEach(change => {
          // Store full path for matching
          const fullPath = `${projectPath}/${change.path}`
          changesMap.set(fullPath, change.status)
        })
        setGitChanges(changesMap)
      }
    } catch (err) {
      // Silently ignore git errors (project might not be a git repo)
    }
  }, [projectPath])

  useEffect(() => {
    loadDirectory(projectPath)
    loadGitChanges()

    // Poll git status every 3 seconds
    gitPollIntervalRef.current = setInterval(loadGitChanges, 3000)

    return () => {
      if (gitPollIntervalRef.current) {
        clearInterval(gitPollIntervalRef.current)
      }
    }
  }, [projectPath, loadGitChanges])

  const loadDirectory = async (path: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await window.api.fs.readDir(path, 1)
      if (result.success && result.nodes) {
        setNodes(result.nodes)
      } else {
        setError(result.error || 'Failed to load directory')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (node: FileNode) => {
    if (node.type !== 'directory') return

    // If already has children loaded, just toggle
    if (node.children && node.children.length > 0) {
      updateNodeExpansion(node.id, !node.isExpanded)
      return
    }

    // Load children if not loaded
    try {
      const result = await window.api.fs.readDir(node.path, 1)
      if (result.success && result.nodes) {
        updateNodeChildren(node.id, result.nodes)
        updateNodeExpansion(node.id, true)
      }
    } catch (err) {
      console.error('Failed to load directory:', err)
    }
  }

  const updateNodeExpansion = (nodeId: string, isExpanded: boolean) => {
    setNodes(prevNodes => updateNodeInTree(prevNodes, nodeId, { isExpanded }))
  }

  const updateNodeChildren = (nodeId: string, children: FileNode[]) => {
    setNodes(prevNodes => updateNodeInTree(prevNodes, nodeId, { children, isExpanded: true }))
  }

  const updateNodeInTree = (
    nodes: FileNode[],
    nodeId: string,
    updates: Partial<FileNode>
  ): FileNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, ...updates }
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeInTree(node.children, nodeId, updates)
        }
      }
      return node
    })
  }

  if (loading && nodes.length === 0) {
    return (
      <div className="file-tree">
        <div className="file-tree-loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="file-tree">
        <div className="file-tree-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="file-tree">
      <div className="file-tree-content">
        {nodes.map(node => (
          <FileTreeNode
            key={node.id}
            node={node}
            level={0}
            onToggle={handleToggle}
            onClick={onFileClick}
            activeFilePath={activeFilePath}
            gitChanges={gitChanges}
          />
        ))}
      </div>
    </div>
  )
}
