import React, { Suspense, lazy, useRef, useEffect } from 'react'
import type { OnMount } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'

// Lazy load the Editor component from @monaco-editor/react
const Editor = lazy(() =>
  import('@monaco-editor/react').then(module => ({ default: module.default }))
)

interface MonacoMarkdownEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  onMount: OnMount
}

// Minimal loading skeleton for markdown editor
const MarkdownEditorSkeleton: React.FC = () => {
  return (
    <div className="monaco-editor-skeleton">
      <div className="monaco-editor-skeleton-body">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="monaco-editor-skeleton-line">
            <div className="monaco-editor-skeleton-line-number">{i + 1}</div>
            <div
              className="monaco-editor-skeleton-line-content"
              style={{ width: `${Math.random() * 60 + 30}%` }}
            ></div>
          </div>
        ))}
      </div>
      <div className="monaco-editor-skeleton-spinner">
        <div className="spinner"></div>
        <div className="loading-text">Loading markdown editor...</div>
      </div>
    </div>
  )
}

// Lazy-loaded Monaco Editor specifically for Markdown
export const MonacoMarkdownEditor: React.FC<MonacoMarkdownEditorProps> = ({
  value,
  onChange,
  onMount
}) => {
  return (
    <Suspense fallback={<MarkdownEditorSkeleton />}>
      <Editor
        height="100%"
        language="markdown"
        value={value}
        theme="vs-dark"
        onChange={onChange}
        onMount={onMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          renderWhitespace: 'selection'
        }}
      />
    </Suspense>
  )
}
