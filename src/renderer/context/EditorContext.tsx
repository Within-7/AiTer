import { createContext, useContext, useReducer, ReactNode } from 'react'
import { EditorTab } from '../../types'

export interface EditorState {
  editorTabs: EditorTab[]
  activeEditorTabId?: string
}

export type EditorAction =
  | { type: 'ADD_EDITOR_TAB'; payload: EditorTab }
  | { type: 'REMOVE_EDITOR_TAB'; payload: string }
  | { type: 'SET_ACTIVE_EDITOR_TAB'; payload: string }
  | { type: 'REORDER_EDITOR_TABS'; payload: EditorTab[] }
  | { type: 'UPDATE_EDITOR_CONTENT'; payload: { id: string; content: string } }
  | { type: 'MARK_TAB_DIRTY'; payload: { id: string; isDirty: boolean } }
  | { type: 'PIN_EDITOR_TAB'; payload: string }
  | { type: 'CLEAR_ACTIVE_EDITOR' }

export const initialEditorState: EditorState = {
  editorTabs: [],
  activeEditorTabId: undefined
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'ADD_EDITOR_TAB': {
      // Check if tab already exists for this file
      // For HTML files with serverUrl (which may have query params), compare both filePath and serverUrl
      // For regular files, just compare filePath
      const existing = state.editorTabs.find(t => {
        if (action.payload.serverUrl && t.serverUrl) {
          // Both have serverUrl, compare the full URL (includes query params)
          return t.serverUrl === action.payload.serverUrl
        }
        // No serverUrl, just compare filePath
        return t.filePath === action.payload.filePath
      })

      if (existing) {
        // If existing tab is a preview tab, pin it (user explicitly opened the same file again)
        if (existing.isPreview) {
          return {
            ...state,
            editorTabs: state.editorTabs.map(t =>
              t.id === existing.id ? { ...t, isPreview: false } : t
            ),
            activeEditorTabId: existing.id
          }
        }
        return {
          ...state,
          activeEditorTabId: existing.id
        }
      }

      // Check if there's an existing preview tab that should be replaced
      const existingPreviewTab = state.editorTabs.find(t => t.isPreview)

      if (existingPreviewTab && action.payload.isPreview) {
        // Replace the existing preview tab with the new one
        return {
          ...state,
          editorTabs: state.editorTabs
            .filter(t => t.id !== existingPreviewTab.id)
            .concat(action.payload),
          activeEditorTabId: action.payload.id
        }
      }

      return {
        ...state,
        editorTabs: [...state.editorTabs, action.payload],
        activeEditorTabId: action.payload.id
      }
    }

    case 'REMOVE_EDITOR_TAB': {
      const newTabs = state.editorTabs.filter(t => t.id !== action.payload)

      // If this was the active editor tab, clear the active state
      // Tab navigation will be handled by TabContext
      return {
        ...state,
        editorTabs: newTabs,
        activeEditorTabId: state.activeEditorTabId === action.payload
          ? undefined
          : state.activeEditorTabId
      }
    }

    case 'SET_ACTIVE_EDITOR_TAB':
      return {
        ...state,
        activeEditorTabId: action.payload
      }

    case 'REORDER_EDITOR_TABS':
      return {
        ...state,
        editorTabs: action.payload
      }

    case 'UPDATE_EDITOR_CONTENT':
      return {
        ...state,
        editorTabs: state.editorTabs.map(tab =>
          tab.id === action.payload.id
            ? { ...tab, content: action.payload.content, isDirty: true, isPreview: false }
            : tab
        )
      }

    case 'MARK_TAB_DIRTY':
      return {
        ...state,
        editorTabs: state.editorTabs.map(tab =>
          tab.id === action.payload.id
            ? { ...tab, isDirty: action.payload.isDirty }
            : tab
        )
      }

    case 'PIN_EDITOR_TAB':
      return {
        ...state,
        editorTabs: state.editorTabs.map(tab =>
          tab.id === action.payload
            ? { ...tab, isPreview: false }
            : tab
        )
      }

    case 'CLEAR_ACTIVE_EDITOR':
      return {
        ...state,
        activeEditorTabId: undefined
      }

    default:
      return state
  }
}

export interface EditorContextType {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState)

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}
