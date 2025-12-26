import { AppState, AppAction } from '../AppContext'
import { projectReducer } from './projectReducer'
import { terminalReducer } from './terminalReducer'
import { editorReducer } from './editorReducer'
import { tabReducer } from './tabReducer'
import { uiReducer } from './uiReducer'

/**
 * Combined reducer that delegates actions to domain-specific reducers
 *
 * This replaces the large monolithic appReducer with a composition of smaller,
 * focused reducers. Each reducer handles its own domain:
 * - projectReducer: Project CRUD operations
 * - terminalReducer: Terminal lifecycle and data
 * - editorReducer: Editor tab management and content
 * - tabReducer: Tab order and multi-selection
 * - uiReducer: UI panels, settings, and sidebar
 *
 * The reducers are applied in sequence, allowing each to handle its specific actions
 * while passing through unhandled actions unchanged.
 */
export function combinedReducer(state: AppState, action: AppAction): AppState {
  // Apply each reducer in sequence
  // Each reducer returns state unchanged for actions it doesn't handle
  state = projectReducer(state, action)
  state = terminalReducer(state, action)
  state = editorReducer(state, action)
  state = tabReducer(state, action)
  state = uiReducer(state, action)

  return state
}
