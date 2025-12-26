import { AppState, AppAction } from '../AppContext'

/**
 * Handles project-related actions
 */
export function projectReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload }

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] }

    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        activeProjectId:
          state.activeProjectId === action.payload
            ? undefined
            : state.activeProjectId
      }

    case 'REORDER_PROJECTS':
      return { ...state, projects: action.payload }

    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload }

    default:
      return state
  }
}
