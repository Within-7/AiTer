import { useEffect, useCallback, useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { ShortcutAction, KeyboardShortcut, ShortcutConfig } from '../../types'

// Default shortcuts
const defaultShortcuts: ShortcutConfig[] = [
  { action: 'newTerminal', label: '新建终端', shortcut: { key: 't', metaKey: true }, enabled: true },
  { action: 'closeTab', label: '关闭标签页', shortcut: { key: 'w', metaKey: true }, enabled: true },
  { action: 'saveFile', label: '保存文件', shortcut: { key: 's', metaKey: true }, enabled: true },
  { action: 'openSettings', label: '打开设置', shortcut: { key: ',', metaKey: true }, enabled: true },
  { action: 'newWindow', label: '新窗口', shortcut: { key: 'n', metaKey: true, shiftKey: true }, enabled: true },
  { action: 'toggleSidebar', label: '切换侧边栏', shortcut: { key: 'b', metaKey: true }, enabled: true },
  { action: 'nextTab', label: '下一个标签页', shortcut: { key: ']', metaKey: true, shiftKey: true }, enabled: true },
  { action: 'prevTab', label: '上一个标签页', shortcut: { key: '[', metaKey: true, shiftKey: true }, enabled: true },
  { action: 'focusTerminal', label: '聚焦终端', shortcut: { key: '`', ctrlKey: true }, enabled: true },
  { action: 'focusEditor', label: '聚焦编辑器', shortcut: { key: 'e', metaKey: true, shiftKey: true }, enabled: true }
]

export type ShortcutHandler = (action: ShortcutAction) => void

// Check if keyboard event matches a shortcut
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Normalize the key comparison
  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const shortcutKey = shortcut.key.length === 1 ? shortcut.key.toLowerCase() : shortcut.key

  if (eventKey !== shortcutKey) {
    return false
  }

  // Check modifiers
  const ctrlMatch = (shortcut.ctrlKey ?? false) === event.ctrlKey
  const altMatch = (shortcut.altKey ?? false) === event.altKey
  const shiftMatch = (shortcut.shiftKey ?? false) === event.shiftKey
  const metaMatch = (shortcut.metaKey ?? false) === event.metaKey

  return ctrlMatch && altMatch && shiftMatch && metaMatch
}

export function useKeyboardShortcuts(handler: ShortcutHandler) {
  const { state } = useContext(AppContext)
  const shortcuts = state.settings.shortcuts || defaultShortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if we're in an input element (except for specific shortcuts)
    const target = event.target as HTMLElement
    const isInInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable

    // Find matching shortcut
    for (const config of shortcuts) {
      if (!config.enabled) continue

      if (matchesShortcut(event, config.shortcut)) {
        // Allow certain shortcuts even in input fields
        const allowInInput = ['saveFile', 'closeTab', 'openSettings']

        if (isInInput && !allowInInput.includes(config.action)) {
          continue
        }

        event.preventDefault()
        event.stopPropagation()
        handler(config.action)
        return
      }
    }
  }, [shortcuts, handler])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Get shortcut for a specific action (for display purposes)
export function getShortcutForAction(
  shortcuts: ShortcutConfig[] | undefined,
  action: ShortcutAction
): KeyboardShortcut | undefined {
  const config = (shortcuts || defaultShortcuts).find(s => s.action === action && s.enabled)
  return config?.shortcut
}

// Format shortcut for display
export function formatShortcutDisplay(shortcut: KeyboardShortcut, isMac: boolean = true): string {
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

  let keyDisplay = shortcut.key.toUpperCase()
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
