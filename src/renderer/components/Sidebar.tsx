import { useContext, useState, useEffect } from 'react'
import { VscFiles, VscSourceControl } from 'react-icons/vsc'
import { AppContext } from '../context/AppContext'
import { ExplorerView } from './ExplorerView'
import { GitView } from './GitView'
import '../styles/Sidebar.css'

export function Sidebar() {
  const { state, dispatch } = useContext(AppContext)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Monitor fullscreen state changes
  useEffect(() => {
    const checkFullscreen = () => {
      const isFs =
        !!(document.fullscreenElement ||
           (document as any).webkitFullscreenElement ||
           (document as any).mozFullScreenElement) ||
        (window.innerHeight >= window.screen.height - 50)

      setIsFullscreen(isFs)
    }

    checkFullscreen()
    window.addEventListener('resize', checkFullscreen)
    document.addEventListener('fullscreenchange', checkFullscreen)
    document.addEventListener('webkitfullscreenchange', checkFullscreen)
    document.addEventListener('mozfullscreenchange', checkFullscreen)

    return () => {
      window.removeEventListener('resize', checkFullscreen)
      document.removeEventListener('fullscreenchange', checkFullscreen)
      document.removeEventListener('webkitfullscreenchange', checkFullscreen)
      document.removeEventListener('mozfullscreenchange', checkFullscreen)
    }
  }, [])

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className={!isFullscreen ? 'has-traffic-lights' : ''}>AiTer</h2>
      </div>

      {/* View Switcher */}
      <div className="view-switcher">
        <button
          className={`view-button ${state.sidebarView === 'explorer' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'explorer' })}
          title="Explorer"
        >
          <VscFiles />
        </button>
        <button
          className={`view-button ${state.sidebarView === 'git' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_SIDEBAR_VIEW', payload: 'git' })}
          title="Source Control"
        >
          <VscSourceControl />
        </button>
      </div>

      {/* View Content */}
      <div className="sidebar-content">
        {state.sidebarView === 'explorer' ? <ExplorerView /> : <GitView />}
      </div>
    </div>
  )
}
