# Plugin Components

UI components for managing AiTer plugins (AI CLI tools like Minto, Claude Code CLI, Gemini CLI).

## Components

### PluginPanel

Main plugin management interface displayed as a modal overlay.

**Features:**
- Lists all available plugins
- Shows installation status and version info
- Handles install/update/remove/configure actions
- Displays loading and error states
- Listens to install/update progress events
- Mock data support for development (when backend not available)

**Usage:**
```tsx
import { PluginPanel } from './components/Plugins'

<PluginPanel
  isOpen={showPlugins}
  onClose={() => setShowPlugins(false)}
/>
```

**Props:**
- `isOpen: boolean` - Controls panel visibility
- `onClose: () => void` - Callback when panel closes

### PluginCard

Individual plugin display card showing details and action buttons.

**Features:**
- Plugin icon, name, description
- Status indicator with color coding
- Update available badge
- Version information
- Tags for categorization
- Contextual action buttons (Install/Update/Configure/Remove)
- Processing state handling

**Props:**
- `plugin: PluginListItem` - Plugin data
- `onInstall: (pluginId: string) => void` - Install handler
- `onUpdate: (pluginId: string) => void` - Update handler
- `onRemove: (pluginId: string) => void` - Remove handler
- `onConfigure: (pluginId: string) => void` - Configure handler
- `isProcessing: boolean` - Disable actions during operations

### MintoConfigDialog

Configuration dialog specifically for Minto CLI plugin.

**Features:**
- GitHub personal access token input (password field)
- Show/hide token toggle
- Auto-check updates checkbox
- "How to create token" link
- Validation and save functionality
- Loading state during save

**Props:**
- `isOpen: boolean` - Controls dialog visibility
- `currentConfig: MintoConfig` - Current configuration values
- `onClose: () => void` - Callback when dialog closes
- `onSave: (config: MintoConfig) => Promise<void>` - Save handler

**MintoConfig interface:**
```typescript
{
  githubToken?: string
  autoCheckUpdates?: boolean
}
```

## Status Colors

- **Installed**: Green (#4caf50)
- **Not Installed**: Gray (#757575)
- **Update Available**: Orange (#ff9800)
- **Installing/Updating/Removing**: Blue (#2196f3)
- **Error**: Red (#f44336)

## API Integration

### Required window.api.plugins Methods

```typescript
window.api.plugins = {
  // List all plugins
  list(): Promise<{ success: boolean; plugins?: PluginListItem[]; error?: string }>

  // Install a plugin
  install(pluginId: string): Promise<{ success: boolean; version?: string; error?: string }>

  // Update a plugin
  update(pluginId: string): Promise<{ success: boolean; version?: string; error?: string }>

  // Remove a plugin
  remove(pluginId: string): Promise<{ success: boolean; error?: string }>

  // Configure a plugin
  configure(pluginId: string, config: Record<string, unknown>): Promise<{ success: boolean; error?: string }>

  // Get plugin configuration
  getConfiguration(pluginId: string): Promise<{ success: boolean; config?: Record<string, unknown>; error?: string }>

  // Listen for install progress
  onInstallProgress(callback: (event: ProgressEvent) => void): () => void

  // Listen for update progress
  onUpdateProgress(callback: (event: ProgressEvent) => void): () => void
}
```

### Progress Event Format

```typescript
{
  pluginId: string
  progress: number // 0-100
  phase: string // e.g., 'downloading', 'extracting', 'installing'
  message: string // Human-readable status message
}
```

## Development Mode

When `window.api.plugins` is undefined (backend not implemented), the `PluginPanel` shows mock data:

- Minto CLI
- Claude Code CLI
- Gemini CLI

All actions show an alert: "Plugin system not available. Backend implementation needed."

## Styling

Styles are in `Plugins.css` following VSCode dark theme:

- Background: #252526, #2d2d30
- Borders: #3c3c3c, #4e4e4e
- Text: #cccccc (primary), #858585 (secondary)
- Primary action: #007acc
- Update action: #ff9800
- Danger action: #f48771

## Accessibility

- Proper ARIA labels on close buttons
- Keyboard navigation support
- Focus management in dialogs
- Color-blind friendly status indicators (icons + text)
- Screen reader friendly structure

## Future Enhancements

1. **Toast Notifications**: Show install/update progress in status bar
2. **Plugin Details View**: Expanded view with full description, screenshots
3. **Plugin Search**: Filter plugins by name/tags
4. **Plugin Categories**: Group by type (Git tools, AI assistants, etc.)
5. **Batch Operations**: Install/update multiple plugins at once
6. **Plugin Ratings**: Community ratings and reviews
7. **Auto-Updates**: Background update checks with notifications
8. **Plugin Dependencies**: Handle plugin interdependencies

## Integration Example

```tsx
// In your main App or StatusBar component
import { useState } from 'react'
import { PluginPanel } from './components/Plugins'

function StatusBar() {
  const [showPlugins, setShowPlugins] = useState(false)

  return (
    <>
      <div className="status-bar">
        <button onClick={() => setShowPlugins(true)}>
          Plugins
        </button>
      </div>

      <PluginPanel
        isOpen={showPlugins}
        onClose={() => setShowPlugins(false)}
      />
    </>
  )
}
```

## Backend Implementation Checklist

To complete the plugin system, implement:

- [ ] `src/main/plugins/PluginManager.ts` - Core plugin manager
- [ ] `src/main/plugins/installers/MintoInstaller.ts` - Minto installer
- [ ] `src/main/plugins/installers/ClaudeCodeInstaller.ts` - Claude Code installer
- [ ] `src/main/plugins/installers/GeminiInstaller.ts` - Gemini installer
- [ ] IPC handlers in `src/main/ipc.ts` for all plugin methods
- [ ] Preload API exposure in `src/preload/index.ts`
- [ ] Plugin state persistence in `src/main/store.ts`
- [ ] Progress event emitters for long operations
- [ ] Error handling and rollback on failed installs

## Testing

Manual testing checklist:

- [ ] Panel opens/closes correctly
- [ ] Plugins load and display
- [ ] Install button works (when backend ready)
- [ ] Update badge shows when update available
- [ ] Configure dialog opens with current config
- [ ] Token show/hide toggle works
- [ ] Save configuration persists
- [ ] Remove confirmation dialog appears
- [ ] Error states display properly
- [ ] Loading spinners show during operations
- [ ] Progress events update UI
- [ ] Keyboard navigation works
- [ ] Responsive on small screens
