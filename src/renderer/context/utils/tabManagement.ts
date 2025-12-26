/**
 * Utility functions for tab management
 */

/**
 * Removes a tab from tabOrder and activates the next appropriate tab
 * This eliminates duplicate logic between REMOVE_TERMINAL and REMOVE_EDITOR_TAB
 *
 * @param removedTabId - The tab ID being removed (e.g., 'terminal-xxx' or 'editor-xxx')
 * @param currentTabOrder - Current array of tab IDs
 * @param currentActiveTerminalId - Current active terminal ID (or undefined)
 * @param currentActiveEditorTabId - Current active editor tab ID (or undefined)
 * @param isActiveTab - Whether the tab being removed is currently active
 * @returns Updated state with new tabOrder and active IDs
 */
export function removeTabAndActivateNext(
  removedTabId: string,
  currentTabOrder: string[],
  currentActiveTerminalId: string | undefined,
  currentActiveEditorTabId: string | undefined,
  isActiveTab: boolean
): {
  newTabOrder: string[]
  newActiveTerminalId: string | undefined
  newActiveEditorTabId: string | undefined
} {
  const newTabOrder = currentTabOrder.filter(id => id !== removedTabId)

  // If this wasn't the active tab, just remove it from tabOrder
  if (!isActiveTab) {
    return {
      newTabOrder,
      newActiveTerminalId: currentActiveTerminalId,
      newActiveEditorTabId: currentActiveEditorTabId
    }
  }

  // Find the index of the removed tab
  const removedIndex = currentTabOrder.indexOf(removedTabId)

  let newActiveTerminalId = currentActiveTerminalId
  let newActiveEditorTabId = currentActiveEditorTabId

  if (removedIndex > 0 && newTabOrder.length > 0) {
    // Get the previous tab in order
    const previousTabId = newTabOrder[removedIndex - 1]

    if (previousTabId.startsWith('terminal-')) {
      newActiveTerminalId = previousTabId.substring('terminal-'.length)
      newActiveEditorTabId = undefined
    } else if (previousTabId.startsWith('editor-')) {
      newActiveEditorTabId = previousTabId.substring('editor-'.length)
      newActiveTerminalId = undefined
    }
  } else if (newTabOrder.length > 0) {
    // If removed tab was first, activate the new first tab
    const nextTabId = newTabOrder[0]

    if (nextTabId.startsWith('terminal-')) {
      newActiveTerminalId = nextTabId.substring('terminal-'.length)
      newActiveEditorTabId = undefined
    } else if (nextTabId.startsWith('editor-')) {
      newActiveEditorTabId = nextTabId.substring('editor-'.length)
      newActiveTerminalId = undefined
    }
  } else {
    // No tabs left
    newActiveTerminalId = undefined
    newActiveEditorTabId = undefined
  }

  return {
    newTabOrder,
    newActiveTerminalId,
    newActiveEditorTabId
  }
}
