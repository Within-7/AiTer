import React, { useState, useRef, useCallback } from 'react'
import { KeyboardShortcut } from '../../../types'

interface ShortcutInputProps {
  value: KeyboardShortcut
  onChange: (shortcut: KeyboardShortcut) => void
  disabled?: boolean
}

// Format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut, isMac: boolean): string {
  const parts: string[] = []

  if (shortcut.ctrlKey) {
    parts.push(isMac ? '^' : 'Ctrl')
  }
  if (shortcut.altKey) {
    parts.push(isMac ? '⌥' : 'Alt')
  }
  if (shortcut.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  if (shortcut.metaKey) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }

  // Format the key
  let keyDisplay = shortcut.key.toUpperCase()

  // Special key names
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'ARROWUP': '↑',
    'ARROWDOWN': '↓',
    'ARROWLEFT': '←',
    'ARROWRIGHT': '→',
    'ENTER': '↵',
    'ESCAPE': 'Esc',
    'BACKSPACE': '⌫',
    'DELETE': 'Del',
    'TAB': 'Tab',
    '`': '`',
    '[': '[',
    ']': ']',
    ',': ',',
    '.': '.',
    '/': '/',
    '\\': '\\',
    '-': '-',
    '=': '='
  }

  keyDisplay = keyMap[shortcut.key.toUpperCase()] || keyMap[shortcut.key] || keyDisplay

  parts.push(keyDisplay)

  return isMac ? parts.join('') : parts.join(' + ')
}

export const ShortcutInput: React.FC<ShortcutInputProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef<HTMLButtonElement>(null)
  const isMac = navigator.platform.toLowerCase().includes('mac')

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isRecording) return

    e.preventDefault()
    e.stopPropagation()

    // Ignore modifier-only keypresses
    const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta', 'CapsLock']
    if (modifierKeys.includes(e.key)) {
      return
    }

    // Escape cancels recording
    if (e.key === 'Escape') {
      setIsRecording(false)
      return
    }

    // Build the new shortcut
    const newShortcut: KeyboardShortcut = {
      key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
      ctrlKey: e.ctrlKey || undefined,
      altKey: e.altKey || undefined,
      shiftKey: e.shiftKey || undefined,
      metaKey: e.metaKey || undefined
    }

    // Clean up undefined values
    Object.keys(newShortcut).forEach(key => {
      if (newShortcut[key as keyof KeyboardShortcut] === undefined) {
        delete newShortcut[key as keyof KeyboardShortcut]
      }
    })

    onChange(newShortcut)
    setIsRecording(false)
  }, [isRecording, onChange])

  const handleClick = () => {
    if (!disabled) {
      setIsRecording(true)
    }
  }

  const handleBlur = () => {
    setIsRecording(false)
  }

  return (
    <button
      ref={inputRef}
      type="button"
      className={`shortcut-input ${isRecording ? 'recording' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      disabled={disabled}
    >
      {isRecording ? (
        <span className="recording-text">按下快捷键...</span>
      ) : (
        <span className="shortcut-display">{formatShortcut(value, isMac)}</span>
      )}
    </button>
  )
}
