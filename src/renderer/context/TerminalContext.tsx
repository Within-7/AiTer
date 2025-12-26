import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Terminal } from '../../types'

export interface TerminalState {
  terminals: Terminal[]
  activeTerminalId?: string
  terminalDataBuffer: Map<string, string>
}

export type TerminalAction =
  | { type: 'ADD_TERMINAL'; payload: Terminal }
  | { type: 'REMOVE_TERMINAL'; payload: string }
  | { type: 'SET_ACTIVE_TERMINAL'; payload: string }
  | { type: 'UPDATE_TERMINAL_NAME'; payload: { id: string; name: string } }
  | { type: 'REORDER_TERMINALS'; payload: Terminal[] }
  | { type: 'TERMINAL_DATA'; payload: { id: string; data: string } }
  | { type: 'TERMINAL_EXIT'; payload: { id: string; exitCode: number } }
  | { type: 'CLEAR_ACTIVE_TERMINAL' }

export const initialTerminalState: TerminalState = {
  terminals: [],
  activeTerminalId: undefined,
  terminalDataBuffer: new Map()
}

export function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'ADD_TERMINAL':
      return {
        ...state,
        terminals: [...state.terminals, action.payload],
        activeTerminalId: action.payload.id
      }

    case 'REMOVE_TERMINAL': {
      const newTerminals = state.terminals.filter((t) => t.id !== action.payload)

      // If this was the active terminal, clear the active state
      // Tab navigation will be handled by TabContext
      return {
        ...state,
        terminals: newTerminals,
        activeTerminalId: state.activeTerminalId === action.payload
          ? undefined
          : state.activeTerminalId
      }
    }

    case 'SET_ACTIVE_TERMINAL':
      return {
        ...state,
        activeTerminalId: action.payload
      }

    case 'UPDATE_TERMINAL_NAME':
      return {
        ...state,
        terminals: state.terminals.map(t =>
          t.id === action.payload.id
            ? { ...t, name: action.payload.name }
            : t
        )
      }

    case 'REORDER_TERMINALS':
      return {
        ...state,
        terminals: action.payload
      }

    case 'TERMINAL_DATA': {
      const newBuffer = new Map(state.terminalDataBuffer)
      const existing = newBuffer.get(action.payload.id) || ''
      newBuffer.set(action.payload.id, existing + action.payload.data)
      return { ...state, terminalDataBuffer: newBuffer }
    }

    case 'TERMINAL_EXIT':
      // Could show notification or handle cleanup
      console.log(
        `Terminal ${action.payload.id} exited with code ${action.payload.exitCode}`
      )
      return state

    case 'CLEAR_ACTIVE_TERMINAL':
      return {
        ...state,
        activeTerminalId: undefined
      }

    default:
      return state
  }
}

export interface TerminalContextType {
  state: TerminalState
  dispatch: React.Dispatch<TerminalAction>
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined)

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(terminalReducer, initialTerminalState)

  return (
    <TerminalContext.Provider value={{ state, dispatch }}>
      {children}
    </TerminalContext.Provider>
  )
}

export function useTerminal() {
  const context = useContext(TerminalContext)
  if (!context) {
    throw new Error('useTerminal must be used within TerminalProvider')
  }
  return context
}
