import { AppState, AppAction } from '../AppContext'

/**
 * Handles tab order and selection actions
 */
export function tabReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'REORDER_TABS':
      return {
        ...state,
        tabOrder: action.payload
      }

    case 'SELECT_TAB': {
      const { tabId, shiftKey, ctrlKey } = action.payload
      const newSelection = new Set(state.selectedTabIds)

      if (shiftKey && state.lastSelectedTabId) {
        // Shift+Click: Range selection from lastSelectedTabId to tabId
        const startIndex = state.tabOrder.indexOf(state.lastSelectedTabId)
        const endIndex = state.tabOrder.indexOf(tabId)

        if (startIndex !== -1 && endIndex !== -1) {
          const [from, to] = startIndex < endIndex
            ? [startIndex, endIndex]
            : [endIndex, startIndex]

          // Add all tabs in range to selection
          for (let i = from; i <= to; i++) {
            newSelection.add(state.tabOrder[i])
          }
        }

        return {
          ...state,
          selectedTabIds: newSelection
          // Don't update lastSelectedTabId on shift-click
        }
      } else if (ctrlKey) {
        // Ctrl/Cmd+Click: Toggle individual selection
        if (newSelection.has(tabId)) {
          newSelection.delete(tabId)
        } else {
          newSelection.add(tabId)
        }

        return {
          ...state,
          selectedTabIds: newSelection,
          lastSelectedTabId: tabId
        }
      } else {
        // Normal click: Clear selection and select only this tab
        return {
          ...state,
          selectedTabIds: new Set([tabId]),
          lastSelectedTabId: tabId
        }
      }
    }

    case 'CLEAR_TAB_SELECTION':
      return {
        ...state,
        selectedTabIds: new Set(),
        lastSelectedTabId: undefined
      }

    case 'REORDER_TABS_BATCH': {
      const { tabIds, targetIndex } = action.payload

      // Remove the dragged tabs from their current positions
      const remainingTabs = state.tabOrder.filter(id => !tabIds.includes(id))

      // Calculate the adjusted target index
      // Count how many dragged tabs were before the target position
      let adjustedIndex = targetIndex
      for (const id of tabIds) {
        const originalIndex = state.tabOrder.indexOf(id)
        if (originalIndex !== -1 && originalIndex < targetIndex) {
          adjustedIndex--
        }
      }

      // Ensure the adjusted index is within bounds
      adjustedIndex = Math.max(0, Math.min(adjustedIndex, remainingTabs.length))

      // Insert the dragged tabs at the target position (preserve their relative order)
      const orderedDraggedTabs = state.tabOrder.filter(id => tabIds.includes(id))
      const newTabOrder = [
        ...remainingTabs.slice(0, adjustedIndex),
        ...orderedDraggedTabs,
        ...remainingTabs.slice(adjustedIndex)
      ]

      return {
        ...state,
        tabOrder: newTabOrder
      }
    }

    default:
      return state
  }
}
