import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './ImageViewer.css'

interface ImageViewerProps {
  src: string  // base64 data URI or URL
  fileName: string
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, fileName }) => {
  const { t } = useTranslation('editor')
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageInfo, setImageInfo] = useState<{
    width: number
    height: number
    type: string
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageInfo({
        width: img.naturalWidth,
        height: img.naturalHeight,
        type: getImageType(src)
      })

      // Auto-fit image on load
      if (containerRef.current && img.naturalWidth && img.naturalHeight) {
        handleFitToWindow(img.naturalWidth, img.naturalHeight)
      }
    }
    img.src = src
  }, [src])

  const getImageType = (src: string): string => {
    if (src.startsWith('data:image/')) {
      const match = src.match(/data:image\/([^;]+)/)
      return match ? match[1].toUpperCase() : 'Unknown'
    }
    const ext = fileName.split('.').pop()?.toUpperCase()
    return ext || 'Unknown'
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.1, Math.min(5, scale + delta))
    setScale(newScale)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev + 0.1))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.1, prev - 0.1))
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleFitToWindow = (imgWidth?: number, imgHeight?: number) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerWidth = container.clientWidth - 40
    const containerHeight = container.clientHeight - 100

    const width = imgWidth || imageInfo?.width || 0
    const height = imgHeight || imageInfo?.height || 0

    if (width === 0 || height === 0) return

    const scaleX = containerWidth / width
    const scaleY = containerHeight / height
    const newScale = Math.min(scaleX, scaleY, 1)

    setScale(newScale)
    setPosition({ x: 0, y: 0 })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileSize = (): string => {
    if (src.startsWith('data:')) {
      const base64 = src.split(',')[1]
      if (base64) {
        const bytes = Math.ceil((base64.length * 3) / 4)
        return formatFileSize(bytes)
      }
    }
    return 'Unknown'
  }

  return (
    <div className="image-viewer" ref={containerRef}>
      <div className="image-viewer-toolbar">
        <div className="image-viewer-info">
          <span className="image-viewer-filename">{fileName}</span>
          {imageInfo && (
            <span className="image-viewer-meta">
              {imageInfo.width} × {imageInfo.height} · {imageInfo.type} · {getFileSize()}
            </span>
          )}
        </div>
        <div className="image-viewer-controls">
          <span className="image-viewer-zoom-label">
            {Math.round(scale * 100)}%
          </span>
          <button
            className="image-viewer-button"
            onClick={handleZoomOut}
            title={t('image.zoomOut', 'Zoom Out (Scroll Down)')}
            disabled={scale <= 0.1}
          >
            -
          </button>
          <button
            className="image-viewer-button"
            onClick={handleZoomIn}
            title={t('image.zoomIn', 'Zoom In (Scroll Up)')}
            disabled={scale >= 5}
          >
            +
          </button>
          <button
            className="image-viewer-button"
            onClick={handleReset}
            title={t('image.resetSize', 'Reset to Original Size')}
          >
            1:1
          </button>
          <button
            className="image-viewer-button"
            onClick={() => handleFitToWindow()}
            title={t('image.fitToWindow', 'Fit to Window')}
          >
            {t('image.fit', 'Fit')}
          </button>
        </div>
      </div>

      <div
        className="image-viewer-canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={fileName}
          className="image-viewer-image"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
          draggable={false}
        />
      </div>
    </div>
  )
}
