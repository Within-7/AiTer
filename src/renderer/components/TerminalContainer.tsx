import { Terminal as TerminalType, AppSettings } from '../../types'
import { XTerminal } from './XTerminal'
import '../styles/TerminalContainer.css'

interface TerminalContainerProps {
  terminals: TerminalType[]
  activeTerminalId?: string
  settings: AppSettings
}

export function TerminalContainer({
  terminals,
  activeTerminalId,
  settings
}: TerminalContainerProps) {
  return (
    <div className="terminal-container">
      {terminals.map((terminal) => {
        const isActive = terminal.id === activeTerminalId
        return (
          <div
            key={terminal.id}
            className={`terminal-wrapper ${isActive ? 'active' : 'hidden'}`}
          >
            <XTerminal
              terminal={terminal}
              settings={settings}
              isActive={isActive}
            />
          </div>
        )
      })}
    </div>
  )
}
