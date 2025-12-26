import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Project } from '../../types'

export interface ProjectState {
  projects: Project[]
  activeProjectId?: string
}

export type ProjectAction =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'REMOVE_PROJECT'; payload: string }
  | { type: 'REORDER_PROJECTS'; payload: Project[] }
  | { type: 'SET_ACTIVE_PROJECT'; payload: string }

export const initialProjectState: ProjectState = {
  projects: [],
  activeProjectId: undefined
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
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

export interface ProjectContextType {
  state: ProjectState
  dispatch: React.Dispatch<ProjectAction>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialProjectState)

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}
