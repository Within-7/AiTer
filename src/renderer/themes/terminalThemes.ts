import { ITheme } from '@xterm/xterm'
import { TerminalThemeName } from '../../types'

export interface TerminalThemeDefinition {
  name: string
  theme: ITheme
}

// macOS Terminal Homebrew theme - classic green on black
const homebrewTheme: ITheme = {
  background: '#000000',
  foreground: '#00ff00',
  cursor: '#00ff00',
  cursorAccent: '#000000',
  selectionBackground: 'rgba(0, 255, 0, 0.3)',
  black: '#000000',
  red: '#990000',
  green: '#00a600',
  yellow: '#999900',
  blue: '#0000b2',
  magenta: '#b200b2',
  cyan: '#00a6b2',
  white: '#bfbfbf',
  brightBlack: '#666666',
  brightRed: '#e50000',
  brightGreen: '#00d900',
  brightYellow: '#e5e500',
  brightBlue: '#0000ff',
  brightMagenta: '#e500e5',
  brightCyan: '#00e5e5',
  brightWhite: '#e5e5e5'
}

// VS Code Dark theme
const vscodeDarkTheme: ITheme = {
  background: '#1e1e1e',
  foreground: '#cccccc',
  cursor: '#ffffff',
  cursorAccent: '#000000',
  selectionBackground: 'rgba(255, 255, 255, 0.3)',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#ffffff'
}

// Dracula theme
const draculaTheme: ITheme = {
  background: '#282a36',
  foreground: '#f8f8f2',
  cursor: '#f8f8f2',
  cursorAccent: '#282a36',
  selectionBackground: 'rgba(68, 71, 90, 0.5)',
  black: '#21222c',
  red: '#ff5555',
  green: '#50fa7b',
  yellow: '#f1fa8c',
  blue: '#bd93f9',
  magenta: '#ff79c6',
  cyan: '#8be9fd',
  white: '#f8f8f2',
  brightBlack: '#6272a4',
  brightRed: '#ff6e6e',
  brightGreen: '#69ff94',
  brightYellow: '#ffffa5',
  brightBlue: '#d6acff',
  brightMagenta: '#ff92df',
  brightCyan: '#a4ffff',
  brightWhite: '#ffffff'
}

// Solarized Dark theme
const solarizedDarkTheme: ITheme = {
  background: '#002b36',
  foreground: '#839496',
  cursor: '#839496',
  cursorAccent: '#002b36',
  selectionBackground: 'rgba(7, 54, 66, 0.5)',
  black: '#073642',
  red: '#dc322f',
  green: '#859900',
  yellow: '#b58900',
  blue: '#268bd2',
  magenta: '#d33682',
  cyan: '#2aa198',
  white: '#eee8d5',
  brightBlack: '#002b36',
  brightRed: '#cb4b16',
  brightGreen: '#586e75',
  brightYellow: '#657b83',
  brightBlue: '#839496',
  brightMagenta: '#6c71c4',
  brightCyan: '#93a1a1',
  brightWhite: '#fdf6e3'
}

export const terminalThemes: Record<TerminalThemeName, TerminalThemeDefinition> = {
  'homebrew': {
    name: 'Homebrew',
    theme: homebrewTheme
  },
  'vscode-dark': {
    name: 'VS Code Dark',
    theme: vscodeDarkTheme
  },
  'dracula': {
    name: 'Dracula',
    theme: draculaTheme
  },
  'solarized-dark': {
    name: 'Solarized Dark',
    theme: solarizedDarkTheme
  }
}

export const getTerminalTheme = (themeName: TerminalThemeName): ITheme => {
  return terminalThemes[themeName]?.theme || terminalThemes['homebrew'].theme
}

export const getTerminalThemeNames = (): { value: TerminalThemeName; label: string }[] => {
  return Object.entries(terminalThemes).map(([value, def]) => ({
    value: value as TerminalThemeName,
    label: def.name
  }))
}
