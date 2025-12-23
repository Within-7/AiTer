import React, { useState, useEffect, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { AppContext } from '../../context/AppContext'
import './AboutPanel.css'

interface VersionInfo {
  current: string
  latest: string | null
  isChecking: boolean
  lastCheckTime: Date | null
  updateAvailable: boolean
  error: string | null
}

export const AboutPanel: React.FC = () => {
  const { t } = useTranslation('about')
  const { t: tCommon } = useTranslation('common')
  const { state, dispatch } = useContext(AppContext)
  const isOpen = state.showAboutPanel

  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    current: '0.1.0', // Will be loaded from package.json
    latest: null,
    isChecking: false,
    lastCheckTime: null,
    updateAvailable: false,
    error: null
  })

  // Get current version from autoUpdate API
  useEffect(() => {
    const loadVersion = async () => {
      try {
        const result = await window.api.autoUpdate.getVersion()
        if (result.success && result.version) {
          setVersionInfo(prev => ({ ...prev, current: result.version }))
        }
      } catch (error) {
        console.error('Failed to load version:', error)
      }
    }
    loadVersion()
  }, [])

  // Listen for auto-update status events
  useEffect(() => {
    const unsubscribe = window.api.autoUpdate.onStatus((data) => {
      if (data.status === 'available' && data.info?.version) {
        setVersionInfo(prev => ({
          ...prev,
          latest: data.info?.version || null,
          isChecking: false,
          lastCheckTime: new Date(),
          updateAvailable: true,
          error: null
        }))
      } else if (data.status === 'not-available') {
        setVersionInfo(prev => ({
          ...prev,
          isChecking: false,
          lastCheckTime: new Date(),
          updateAvailable: false,
          error: null
        }))
      } else if (data.status === 'error') {
        setVersionInfo(prev => ({
          ...prev,
          isChecking: false,
          lastCheckTime: new Date(),
          error: data.error || t('version.checkFailed', 'Update check failed')
        }))
      }
    })

    return () => unsubscribe()
  }, [t])

  const handleClose = () => {
    dispatch({ type: 'SET_ABOUT_PANEL', payload: false })
  }

  const handleCheckUpdate = async () => {
    setVersionInfo(prev => ({ ...prev, isChecking: true, error: null }))

    try {
      // Trigger update check - results come via onStatus callback
      const result = await window.api.autoUpdate.check()

      if (!result.success) {
        setVersionInfo(prev => ({
          ...prev,
          isChecking: false,
          lastCheckTime: new Date(),
          error: result.error || t('version.checkFailed', 'Update check failed')
        }))
      } else {
        // Update check started, wait for status events
        // Set a timeout to clear "isChecking" if no response
        setTimeout(() => {
          setVersionInfo(prev => {
            if (prev.isChecking) {
              return {
                ...prev,
                isChecking: false,
                lastCheckTime: new Date()
              }
            }
            return prev
          })
        }, 10000)
      }
    } catch (error) {
      setVersionInfo(prev => ({
        ...prev,
        isChecking: false,
        lastCheckTime: new Date(),
        error: t('version.networkError', 'Network connection failed')
      }))
    }
  }

  const handleOpenWebsite = () => {
    if (window.api && window.api.shell) {
      window.api.shell.openExternal('http://aiter.within-7.com')
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="about-panel-overlay" onClick={handleOverlayClick}>
      <div className="about-panel">
        <button className="about-close-button" onClick={handleClose}>×</button>

        <div className="about-header">
          <div className="about-logo">
            <span className="about-logo-text">AiTer</span>
          </div>
          <h2 className="about-title">{t('tagline')}</h2>
          <p className="about-subtitle">{t('subtitle')}</p>
        </div>

        <div className="about-content">
          {/* Version Section */}
          <section className="about-section">
            <h3>{t('version.title')}</h3>
            <div className="version-display">
              <div className="version-item">
                <span className="version-label">{t('version.current')}</span>
                <span className="version-value current">{versionInfo.current}</span>
              </div>
              {versionInfo.latest && (
                <div className="version-item">
                  <span className="version-label">{t('version.latest')}</span>
                  <span className={`version-value ${versionInfo.updateAvailable ? 'latest-new' : 'latest-same'}`}>
                    {versionInfo.latest}
                    {versionInfo.updateAvailable && (
                      <span className="update-badge">{t('version.updateAvailable')}</span>
                    )}
                  </span>
                </div>
              )}
              {versionInfo.lastCheckTime && (
                <div className="version-check-time">
                  {t('version.lastCheck')} {versionInfo.lastCheckTime.toLocaleString()}
                </div>
              )}
              {versionInfo.error && (
                <div className="version-error">{versionInfo.error}</div>
              )}
            </div>

            <div className="version-actions">
              <button
                className="about-button primary"
                onClick={handleCheckUpdate}
                disabled={versionInfo.isChecking}
              >
                {versionInfo.isChecking ? t('version.checking') : t('version.checkUpdate')}
              </button>
            </div>
          </section>

          {/* Features Section */}
          <section className="about-section">
            <h3>{t('features.title')}</h3>
            <ul className="feature-list">
              <li>{t('features.multiProject')}</li>
              <li>{t('features.multiTerminal')}</li>
              <li>{t('features.htmlPreview')}</li>
              <li>{t('features.monacoEditor')}</li>
              <li>{t('features.markdownPreview')}</li>
              <li>{t('features.pluginSystem')}</li>
              <li>{t('features.autoUpdate')}</li>
              <li>{t('features.crossPlatform')}</li>
            </ul>
          </section>

          {/* Links Section */}
          <section className="about-section">
            <h3>{t('links.title')}</h3>
            <div className="link-buttons">
              <button className="about-link-button" onClick={handleOpenWebsite}>
                <span className="link-icon">🌐</span>
                <span className="link-text">{t('links.website')}</span>
              </button>
            </div>
          </section>

          {/* Tech Stack Section */}
          <section className="about-section">
            <h3>{t('techStack.title')}</h3>
            <div className="tech-tags">
              <span className="tech-tag">{t('techStack.electron')}</span>
              <span className="tech-tag">{t('techStack.react')}</span>
              <span className="tech-tag">{t('techStack.typescript')}</span>
              <span className="tech-tag">{t('techStack.xterm')}</span>
              <span className="tech-tag">{t('techStack.monaco')}</span>
              <span className="tech-tag">{t('techStack.nodePty')}</span>
            </div>
          </section>

          {/* Copyright Section */}
          <section className="about-footer">
            <p className="copyright">
              {t('copyright.text')}
            </p>
            <p className="copyright-note">
              {t('description')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
