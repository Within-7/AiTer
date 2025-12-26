import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'

export interface TabState {
  tabOrder: string[] // Array of tab IDs in display order (e.g., ['editor-xxx', 'terminal-yyy'])
  selectedTabIds: Set<string> // Multi-selected tab IDs for batch operations
  lastSelectedTabId?: string // Last clicked tab for Shift+Click range selection
}

export type TabAction =
  | { type: 'ADD_TAB'; payload: { tabId: string; tabType: 'editor' | 'terminal' } }
  | { type: 'REMOVE_TAB'; payload: string }
  | { type: 'REORDER_TABS'; payload: string[] }
  | { type: 'SELECT_TAB'; payload: { tabId: string; shiftKey: boolean; ctrlKey: boolean } }
  | { type: 'CLEAR_TAB_SELECTION' }
  | { type: 'REORDER_TABS_BATCH'; payload: { tabIds: string[]; targetIndex: number } }
  | { type: 'REPLACE_TAB'; payload: { oldTabId: string; newTabId: string } }

export const initialTabState: TabState = {
  tabOrder: [],
  selectedTabIds: new Set(),
  lastSelectedTabId: undefined
}

export function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case 'ADD_TAB': {
      const { tabId, tabType } = action.payload
      const fullTabId = `${tabType}-${tabId}`

      // Don't add if already exists
      if (state.tabOrder.includes(fullTabId)) {
        return state
      }

      return {
        ...state,
        tabOrder: [...state.tabOrder, fullTabId]
      }
    }

    case 'REMOVE_TAB': {
      return {
        ...state,
        tabOrder: state.tabOrder.filter(id => id !== action.payload),
        selectedTabIds: new Set([...state.selectedTabIds].filter(id => id !== action.payload)),
        lastSelectedTabId: state.lastSelectedTabId === action.payload
          ? undefined
          : state.lastSelectedTabId
      }
    }

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

    case 'REPLACE_TAB': {
      const { oldTabId, newTabId } = action.payload
      return {
        ...state,
        tabOrder: state.tabOrder.map(id => id === oldTabId ? newTabId : id)
      }
    }

    default:
      return state
  }
}

export interface TabContextType {
  state: TabState
  dispatch: React.Dispatch<TabAction>
  // Helper functions for navigation
  getNextTab: (currentTabId: string) => string | undefined
  getPreviousTab: (currentTabId: string) => string | undefined
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function TabProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tabReducer, initialTabState)

  const getNextTab = useCallback((currentTabId: string) => {
    const currentIndex = state.tabOrder.indexOf(currentTabId)
    if (currentIndex === -1 || currentIndex === state.tabOrder.length - 1) {
      return undefined
    }
    return state.tabOrder[currentIndex + 1]
  }, [state.tabOrder])

  const getPreviousTab = useCallback((currentTabId: string) => {
    const currentIndex = state.tabOrder.indexOf(currentTabId)
    if (currentIndex === -1 || currentIndex === 0) {
      return undefined
    }
    return state.tabOrder[currentIndex - 1]
  }, [state.tabOrder])

  return (
    <TabContext.Provider value={{ state, dispatch, getNextTab, getPreviousTab }}>
      {children}
    </TabContext.Provider>
  )
}

export function useTab() {
  const context = useContext(TabContext)
  if (!context) {
    throw new Error('useTab must be used within TabProvider')
  }
  return context
}
