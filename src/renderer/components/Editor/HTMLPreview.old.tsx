import React, { useEffect, useRef, useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { EditorTab } from '../../../types'
import './HTMLPreview.css'

interface HTMLPreviewProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  mode: 'preview' | 'edit'
  currentFilePath?: string // The path of the currently open HTML file
}

export const HTMLPreview: React.FC<HTMLPreviewProps> = ({
  value,
  onChange,
  onSave,
  mode,
  currentFilePath
}) => {
  const { state, dispatch } = useContext(AppContext)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  // Use a key to force iframe recreation on content change
  // This ensures a fresh document context and prevents script re-execution errors
  const [iframeKey, setIframeKey] = useState(0)

  useEffect(() => {
    // Force iframe recreation when switching to preview mode or when value changes
    // This solves the problem of const/let re-declaration in React Strict Mode
    if (mode === 'preview') {
      setIframeKey(prev => prev + 1)
    }
  }, [value, mode])

  // Handle messages from iframe (link clicks)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: Only accept messages from our iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return
      }

      if (event.data.type === 'OPEN_FILE') {
        const { href, target } = event.data

        // Resolve relative path based on current file's directory
        let filePath = href
        if (currentFilePath && !href.startsWith('/') && !href.startsWith('http')) {
          // Get directory of current HTML file
          const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'))
          filePath = `${currentDir}/${href}`
        }

        // Normalize path (remove ./ and ../)
        filePath = filePath.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/')

        try {
          // Read file content
          const result = await window.api.fs.readFile(filePath)
          if (result.success && result.content !== undefined && result.fileType) {
            // Extract filename from path
            const fileName = filePath.substring(filePath.lastIndexOf('/') + 1)

            // Create editor tab
            const tab: EditorTab = {
              id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              filePath: filePath,
              fileName: fileName,
              fileType: result.fileType as EditorTab['fileType'],
              content: result.content,
              isDirty: false
            }

            // If target is _blank or shift/ctrl was pressed, open in new tab
            // Otherwise, reuse current tab
            if (target === '_blank') {
              dispatch({ type: 'ADD_EDITOR_TAB', payload: tab })
            } else {
              // Find and update current tab
              const currentTab = state.editorTabs.find(t => t.filePath === currentFilePath)
              if (currentTab) {
                // Update existing tab
                dispatch({ type: 'REMOVE_EDITOR_TAB', payload: currentTab.id })
              }
              dispatch({ type: 'ADD_EDITOR_TAB', payload: tab })
            }
          } else {
            console.error('Failed to read file:', result.error || 'Unknown error')
          }
        } catch (error) {
          console.error('Error opening file:', error)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [currentFilePath, state.editorTabs, dispatch])

  // Inject link interception script into iframe
  useEffect(() => {
    if (mode === 'preview' && iframeRef.current) {
      const iframe = iframeRef.current

      // Wait for iframe to load
      const injectScript = () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (!iframeDoc) return

        // Inject script to intercept link clicks
        const script = iframeDoc.createElement('script')
        script.textContent = `
          (function() {
            // Intercept all link clicks
            document.addEventListener('click', function(e) {
              let target = e.target;

              // Find the closest <a> tag
              while (target && target.tagName !== 'A') {
                target = target.parentElement;
              }

              if (target && target.tagName === 'A') {
                const href = target.getAttribute('href');

                // Only intercept local file links (not external URLs)
                if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
                  e.preventDefault();

                  // Send message to parent window
                  window.parent.postMessage({
                    type: 'OPEN_FILE',
                    href: href,
                    target: target.getAttribute('target') || '_self'
                  }, '*');
                }
              }
            }, true);
          })();
        `

        // Append to head or body
        const head = iframeDoc.head || iframeDoc.getElementsByTagName('head')[0]
        if (head) {
          head.appendChild(script)
        }
      }

      // Try to inject immediately
      injectScript()

      // Also try after a short delay in case iframe is still loading
      const timer = setTimeout(injectScript, 100)

      return () => clearTimeout(timer)
    }
  }, [mode, iframeKey])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      onSave()
    }
  }

  return (
    <div className="html-preview">
      {mode === 'edit' ? (
        <div className="html-editor-pane-full">
          <textarea
            className="html-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your HTML here..."
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="html-preview-pane-full">
          {/* SAFE: iframe with sandbox provides security isolation */}
          {/* Using srcdoc for better isolation and key for forced recreation */}
          {/* This approach prevents script re-execution errors in React Strict Mode */}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            className="html-preview-iframe"
            srcDoc={value}
            sandbox="allow-same-origin allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="HTML Preview"
          />
        </div>
      )}
    </div>
  )
}
