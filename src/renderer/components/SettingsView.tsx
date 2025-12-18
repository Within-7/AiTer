import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { getTerminalThemeNames } from '../themes/terminalThemes'
import { TerminalThemeName } from '../../types'
import '../styles/SettingsView.css'

export function SettingsView() {
  const { state, dispatch } = useContext(AppContext)
  const { settings } = state

  const handleSettingChange = async <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } })
    await window.api.settings.update({ [key]: value })
  }

  const themeOptions = getTerminalThemeNames()

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h3>Settings</h3>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h4>Terminal</h4>

          <div className="setting-item">
            <label htmlFor="terminal-theme">Theme</label>
            <select
              id="terminal-theme"
              value={settings.terminalTheme}
              onChange={(e) => handleSettingChange('terminalTheme', e.target.value as TerminalThemeName)}
            >
              {themeOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="font-size">Font Size</label>
            <div className="setting-input-group">
              <input
                id="font-size"
                type="number"
                min="8"
                max="32"
                value={settings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value, 10))}
              />
              <span className="setting-unit">px</span>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="font-family">Font Family</label>
            <select
              id="font-family"
              value={settings.fontFamily}
              onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
            >
              <option value="Menlo, Monaco, 'Courier New', monospace">Menlo</option>
              <option value="Monaco, Menlo, 'Courier New', monospace">Monaco</option>
              <option value="'SF Mono', Menlo, Monaco, monospace">SF Mono</option>
              <option value="'Fira Code', Menlo, Monaco, monospace">Fira Code</option>
              <option value="'JetBrains Mono', Menlo, Monaco, monospace">JetBrains Mono</option>
              <option value="Consolas, 'Courier New', monospace">Consolas</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="cursor-style">Cursor Style</label>
            <select
              id="cursor-style"
              value={settings.cursorStyle}
              onChange={(e) => handleSettingChange('cursorStyle', e.target.value as 'block' | 'underline' | 'bar')}
            >
              <option value="block">Block</option>
              <option value="underline">Underline</option>
              <option value="bar">Bar</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="cursor-blink">Cursor Blink</label>
            <input
              id="cursor-blink"
              type="checkbox"
              checked={settings.cursorBlink}
              onChange={(e) => handleSettingChange('cursorBlink', e.target.checked)}
            />
          </div>

          <div className="setting-item">
            <label htmlFor="scrollback-lines">Scrollback Lines</label>
            <input
              id="scrollback-lines"
              type="number"
              min="100"
              max="10000"
              step="100"
              value={settings.scrollbackLines}
              onChange={(e) => handleSettingChange('scrollbackLines', parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
