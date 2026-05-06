import { useEffect, useRef, useState } from 'react'

import {
  MIN_RANGE_DURATION_SECONDS,
  TIME_RANGE_STEP_SECONDS,
} from '../config/constants'
import { translateErrorMessage } from '../i18n/translations'
import {
  isPresetSelected,
  resolveCropPlacement,
} from '../utils/crop'
import {
  formatClockValue,
  formatDurationSummary,
} from '../utils/time'
import { normalizeVideoMetadata } from '../utils/video'


// Build a preview URL for one local file.
function usePreviewUrl(file) {
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(nextPreviewUrl)

    return () => {
      URL.revokeObjectURL(nextPreviewUrl)
    }
  }, [file])

  return previewUrl
}


// Read the rendered preview box from the live video element.
function readVideoRect(videoElement) {
  const nextRect = videoElement.getBoundingClientRect()
  return {
    width: Math.round(nextRect.width),
    height: Math.round(nextRect.height),
  }
}


// Convert one source-space crop placement into rendered overlay pixels.
function buildDisplayCropBox(cropPlacement, sourceWidth, sourceHeight, videoRect) {
  if (!cropPlacement || sourceWidth <= 0 || sourceHeight <= 0 || videoRect.width <= 0 || videoRect.height <= 0) {
    return null
  }

  return {
    left: (cropPlacement.cropX / sourceWidth) * videoRect.width,
    top: (cropPlacement.cropY / sourceHeight) * videoRect.height,
    width: (cropPlacement.cropWidth / sourceWidth) * videoRect.width,
    height: (cropPlacement.cropHeight / sourceHeight) * videoRect.height,
  }
}


// Render local preview and range controls for one queued file.
export default function VideoRangeEditor({
  item,
  disabled,
  onStartTimeChange,
  onEndTimeChange,
  onStartSliderChange,
  onEndSliderChange,
  onCropPositionChange,
  onVideoMetadataChange,
  copy,
}) {
  const previewUrl = usePreviewUrl(item.file)
  const maxDuration = Math.max(item.durationSeconds, MIN_RANGE_DURATION_SECONDS)
  const selectedDuration = Math.max(item.endTime - item.startTime, 0)
  const videoRef = useRef(null)
  const dragStateRef = useRef(null)
  const [videoRect, setVideoRect] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const cropPlacement = resolveCropPlacement(item.sourceWidth, item.sourceHeight, item.crop, item.cropX, item.cropY)
  const displayCropBox = buildDisplayCropBox(cropPlacement, item.sourceWidth, item.sourceHeight, videoRect)
  const isOverlayVisible = isPresetSelected(item.crop) && Boolean(displayCropBox)

  // Refresh rendered overlay measurements after layout changes.
  function syncVideoRect() {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    const nextRect = readVideoRect(videoElement)
    setVideoRect((currentRect) => {
      if (currentRect.width === nextRect.width && currentRect.height === nextRect.height) {
        return currentRect
      }

      return nextRect
    })
  }

  useEffect(() => {
    syncVideoRect()

    if (typeof ResizeObserver !== 'function' || !videoRef.current) {
      window.addEventListener('resize', syncVideoRect)
      return () => {
        window.removeEventListener('resize', syncVideoRect)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      syncVideoRect()
    })
    resizeObserver.observe(videoRef.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [previewUrl])

  // Keep source metadata aligned with the actual browser-loaded preview.
  function handleLoadedMetadata(event) {
    syncVideoRect()

    try {
      onVideoMetadataChange(normalizeVideoMetadata(event.currentTarget))
    } catch {
      // Ignore partial metadata reads and keep the existing queue state.
    }
  }

  // Start one constrained drag interaction on the crop frame.
  function handleCropPointerDown(event) {
    if (!cropPlacement || !displayCropBox || disabled) {
      return
    }

    event.preventDefault()
    dragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCropX: cropPlacement.cropX,
      startCropY: cropPlacement.cropY,
      sourceWidth: item.sourceWidth,
      sourceHeight: item.sourceHeight,
      cropMode: item.crop,
      scaleX: item.sourceWidth / videoRect.width,
      scaleY: item.sourceHeight / videoRect.height,
    }
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) {
      return undefined
    }

    // Update source-space crop coordinates while the user drags.
    function handlePointerMove(event) {
      const dragState = dragStateRef.current
      if (!dragState) {
        return
      }

      const deltaX = Math.round((event.clientX - dragState.startClientX) * dragState.scaleX)
      const deltaY = Math.round((event.clientY - dragState.startClientY) * dragState.scaleY)
      const nextPlacement = resolveCropPlacement(
        dragState.sourceWidth,
        dragState.sourceHeight,
        dragState.cropMode,
        dragState.startCropX + deltaX,
        dragState.startCropY + deltaY,
      )

      if (!nextPlacement) {
        return
      }

      onCropPositionChange({ cropX: nextPlacement.cropX, cropY: nextPlacement.cropY })
    }

    // Finish the current drag interaction.
    function handlePointerUp() {
      dragStateRef.current = null
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, onCropPositionChange])

  return (
    <section className="range-editor stack">
      <div className="panel-heading">
        <div>
          <h3>{copy.rangeEditorTitle}</h3>
          <p className="field-help">{copy.rangeEditorHint}</p>
        </div>
        <span className="range-file-name">{item.file.name}</span>
      </div>
      <div className="video-preview-shell">
        <video
          ref={videoRef}
          className="video-preview"
          src={previewUrl}
          controls
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
        />
        {isOverlayVisible ? (
          <div className="crop-overlay" data-testid="crop-overlay" aria-hidden="true">
            <div className="crop-mask" style={{ top: 0, left: 0, width: '100%', height: `${displayCropBox.top}px` }} />
            <div
              className="crop-mask"
              style={{
                top: `${displayCropBox.top + displayCropBox.height}px`,
                left: 0,
                width: '100%',
                height: `${Math.max(0, videoRect.height - displayCropBox.top - displayCropBox.height)}px`,
              }}
            />
            <div
              className="crop-mask"
              style={{
                top: `${displayCropBox.top}px`,
                left: 0,
                width: `${displayCropBox.left}px`,
                height: `${displayCropBox.height}px`,
              }}
            />
            <div
              className="crop-mask"
              style={{
                top: `${displayCropBox.top}px`,
                left: `${displayCropBox.left + displayCropBox.width}px`,
                width: `${Math.max(0, videoRect.width - displayCropBox.left - displayCropBox.width)}px`,
                height: `${displayCropBox.height}px`,
              }}
            />
            <div
              className={`crop-frame ${isDragging ? 'crop-frame-dragging' : ''}`}
              data-testid="crop-frame"
              onPointerDown={handleCropPointerDown}
              style={{
                left: `${displayCropBox.left}px`,
                top: `${displayCropBox.top}px`,
                width: `${displayCropBox.width}px`,
                height: `${displayCropBox.height}px`,
              }}
            />
          </div>
        ) : null}
      </div>
      <div className="range-metrics" role="list" aria-label={copy.rangeMetricsLabel}>
        <div className="range-metric" role="listitem">
          <span className="range-metric-label">{copy.totalDurationLabel}</span>
          <strong>{formatClockValue(item.durationSeconds)}</strong>
        </div>
        <div className="range-metric" role="listitem">
          <span className="range-metric-label">{copy.startTimeLabel}</span>
          <strong>{formatClockValue(item.startTime)}</strong>
        </div>
        <div className="range-metric" role="listitem">
          <span className="range-metric-label">{copy.endTimeLabel}</span>
          <strong>{formatClockValue(item.endTime)}</strong>
        </div>
        <div className="range-metric" role="listitem">
          <span className="range-metric-label">{copy.selectedDurationLabel}</span>
          <strong>{formatDurationSummary(selectedDuration)}</strong>
        </div>
      </div>
      <div className="time-input-grid">
        <div className="field">
          <label htmlFor="start-time">{copy.startTimeLabel}</label>
          <input
            id="start-time"
            inputMode="numeric"
            value={formatClockValue(item.startTime)}
            disabled={disabled}
            onChange={onStartTimeChange}
          />
        </div>
        <div className="field">
          <label htmlFor="end-time">{copy.endTimeLabel}</label>
          <input
            id="end-time"
            inputMode="numeric"
            value={formatClockValue(item.endTime)}
            disabled={disabled}
            onChange={onEndTimeChange}
          />
        </div>
      </div>
      <div className="range-slider-group field">
        <span className="field-label">{copy.timelineLabel}</span>
        <div className="range-slider-stack">
          <input
            aria-label={copy.startSliderLabel}
            min="0"
            max={String(maxDuration)}
            step={String(TIME_RANGE_STEP_SECONDS)}
            type="range"
            value={item.startTime}
            disabled={disabled}
            onChange={onStartSliderChange}
          />
          <input
            aria-label={copy.endSliderLabel}
            min="0"
            max={String(maxDuration)}
            step={String(TIME_RANGE_STEP_SECONDS)}
            type="range"
            value={item.endTime}
            disabled={disabled}
            onChange={onEndSliderChange}
          />
        </div>
      </div>
      {item.metadataError ? <p className="error-text">{translateErrorMessage(item.metadataError, copy)}</p> : null}
    </section>
  )
}
