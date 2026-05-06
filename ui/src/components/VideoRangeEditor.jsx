import { useEffect, useRef, useState } from 'react'

import {
  PREVIEW_SEEK_STEP_SECONDS,
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


const TIME_SEGMENT_RANGES = [
  { start: 0, end: 2 },
  { start: 3, end: 5 },
  { start: 6, end: 8 },
]


// Detect whether one caret index points at a fixed time separator.
function isTimeSeparatorIndex(value, index) {
  return index >= 0 && index < value.length && value[index] === ':'
}


// Detect whether one input selection includes a fixed time separator.
function selectionIncludesTimeSeparator(value, start, end) {
  return value.slice(start, end).includes(':')
}


// Snap one mixed selection onto the nearest digit-only time segment.
function resolveTimeSegmentSelection(start, end) {
  const selectionCenter = (start + end) / 2
  let bestSegment = TIME_SEGMENT_RANGES[0]
  let bestOverlap = -1
  let bestDistance = Number.POSITIVE_INFINITY

  for (const segment of TIME_SEGMENT_RANGES) {
    const overlapStart = Math.max(start, segment.start)
    const overlapEnd = Math.min(end, segment.end)
    const overlap = Math.max(overlapEnd - overlapStart, 0)
    const segmentCenter = (segment.start + segment.end) / 2
    const distance = Math.abs(selectionCenter - segmentCenter)

    if (overlap > bestOverlap || (overlap === bestOverlap && distance < bestDistance)) {
      bestSegment = segment
      bestOverlap = overlap
      bestDistance = distance
    }
  }

  return bestSegment
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
  const formattedStartTime = formatClockValue(item.startTime)
  const formattedEndTime = formatClockValue(item.endTime)
  const itemIdRef = useRef(item.id)
  const videoRef = useRef(null)
  const dragStateRef = useRef(null)
  const [videoRect, setVideoRect] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeTimeField, setActiveTimeField] = useState(null)
  const [startTimeDraft, setStartTimeDraft] = useState(formattedStartTime)
  const [endTimeDraft, setEndTimeDraft] = useState(formattedEndTime)
  const cropPlacement = resolveCropPlacement(item.sourceWidth, item.sourceHeight, item.crop, item.cropX, item.cropY)
  const displayCropBox = buildDisplayCropBox(cropPlacement, item.sourceWidth, item.sourceHeight, videoRect)
  const isOverlayVisible = isPresetSelected(item.crop) && Boolean(displayCropBox)
  const playbackTimeLabel = `${formatClockValue(currentTime)} / ${formatClockValue(item.durationSeconds)}`

  useEffect(() => {
    if (itemIdRef.current === item.id) {
      return
    }

    itemIdRef.current = item.id
    setCurrentTime(0)
    setIsPlaying(false)
    setActiveTimeField(null)
    setStartTimeDraft(formattedStartTime)
    setEndTimeDraft(formattedEndTime)
  }, [formattedEndTime, formattedStartTime, item.id])

  useEffect(() => {
    if (activeTimeField !== 'start') {
      setStartTimeDraft(formattedStartTime)
    }
  }, [activeTimeField, formattedStartTime])

  useEffect(() => {
    if (activeTimeField !== 'end') {
      setEndTimeDraft(formattedEndTime)
    }
  }, [activeTimeField, formattedEndTime])

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

  // Keep the visible playback timer aligned with the live preview element.
  function syncCurrentTime() {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    setCurrentTime(videoElement.currentTime)
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
    setCurrentTime(event.currentTarget.currentTime)
    setIsPlaying(false)

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

  // Toggle preview playback without relying on native browser controls.
  async function togglePreviewPlayback() {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    if (videoElement.paused || videoElement.ended) {
      try {
        await videoElement.play()
      } catch {
        // Ignore blocked playback attempts and keep the current UI state.
      }
      return
    }

    videoElement.pause()
  }

  // Allow quick play and pause directly from the cropped preview surface.
  function handlePreviewClick() {
    if (!isOverlayVisible) {
      return
    }

    void togglePreviewPlayback()
  }

  // Route compact transport button clicks to the shared playback toggle.
  function handleTransportButtonClick() {
    void togglePreviewPlayback()
  }

  // Seek the local preview to one exact second from the transport slider.
  function handlePreviewSeekChange(event) {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    const nextTime = Number(event.target.value)
    videoElement.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  // Keep the raw start-time draft visible while the user is typing.
  function handleStartInputChange(event) {
    setActiveTimeField('start')
    setStartTimeDraft(event.target.value)
    onStartTimeChange(event)
  }

  // Keep the raw end-time draft visible while the user is typing.
  function handleEndInputChange(event) {
    setActiveTimeField('end')
    setEndTimeDraft(event.target.value)
    onEndTimeChange(event)
  }

  // Restore the canonical formatted start time after editing completes.
  function handleStartInputBlur() {
    setActiveTimeField((currentField) => (currentField === 'start' ? null : currentField))
    setStartTimeDraft(formattedStartTime)
  }

  // Restore the canonical formatted end time after editing completes.
  function handleEndInputBlur() {
    setActiveTimeField((currentField) => (currentField === 'end' ? null : currentField))
    setEndTimeDraft(formattedEndTime)
  }

  // Keep time-field selections inside one digit segment without selecting separators.
  function handleTimeInputSelect(event) {
    const { currentTarget } = event
    const selectionStart = currentTarget.selectionStart ?? 0
    const selectionEnd = currentTarget.selectionEnd ?? selectionStart

    if (selectionStart === selectionEnd || !selectionIncludesTimeSeparator(currentTarget.value, selectionStart, selectionEnd)) {
      return
    }

    const nextSelection = resolveTimeSegmentSelection(selectionStart, selectionEnd)
    currentTarget.setSelectionRange(nextSelection.start, nextSelection.end)
  }

  // Keep fixed `HH:MM:SS` separators from being removed during editing.
  function handleTimeInputKeyDown(event) {
    const { key, currentTarget } = event
    const selectionStart = currentTarget.selectionStart ?? 0
    const selectionEnd = currentTarget.selectionEnd ?? selectionStart
    const hasSelection = selectionStart !== selectionEnd

    if (hasSelection) {
      return
    }

    if (key === 'Backspace' && isTimeSeparatorIndex(currentTarget.value, selectionStart - 1)) {
      event.preventDefault()
      currentTarget.setSelectionRange(selectionStart - 1, selectionStart - 1)
    }

    if (key === 'Delete' && isTimeSeparatorIndex(currentTarget.value, selectionStart)) {
      event.preventDefault()
      currentTarget.setSelectionRange(selectionStart + 1, selectionStart + 1)
    }
  }

  // Mirror the current preview playback state into the compact transport row.
  function handlePlaybackStateChange(event) {
    setIsPlaying(!event.currentTarget.paused && !event.currentTarget.ended)
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
        {/* <span className="range-file-name">{item.file.name}</span> */}
      </div>
      <div className="video-preview-shell">
        <video
          ref={videoRef}
          className={`video-preview ${isOverlayVisible ? 'video-preview-interactive' : ''}`}
          src={previewUrl}
          controls={!isOverlayVisible}
          preload="metadata"
          onClick={handlePreviewClick}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={syncCurrentTime}
          onPlay={handlePlaybackStateChange}
          onPause={handlePlaybackStateChange}
          onEnded={handlePlaybackStateChange}
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
      {isOverlayVisible ? (
        <div className="preview-transport" aria-label={copy.previewPlaybackLabel}>
          <div className="preview-transport-main">
            <button type="button" className="preview-playback-button" onClick={handleTransportButtonClick}>
              {isPlaying ? copy.pausePreview : copy.playPreview}
            </button>
            <span className="preview-timecode">{playbackTimeLabel}</span>
          </div>
          <input
            type="range"
            className="preview-seek-slider"
            aria-label={copy.previewSeekLabel}
            min="0"
            max={String(maxDuration)}
            step={String(PREVIEW_SEEK_STEP_SECONDS)}
            value={Math.min(currentTime, maxDuration)}
            onChange={handlePreviewSeekChange}
          />
        </div>
      ) : null}
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
            value={activeTimeField === 'start' ? startTimeDraft : formattedStartTime}
            disabled={disabled}
            onFocus={() => setActiveTimeField('start')}
            onBlur={handleStartInputBlur}
            onSelect={handleTimeInputSelect}
            onKeyDown={handleTimeInputKeyDown}
            onChange={handleStartInputChange}
          />
        </div>
        <div className="field">
          <label htmlFor="end-time">{copy.endTimeLabel}</label>
          <input
            id="end-time"
            inputMode="numeric"
            value={activeTimeField === 'end' ? endTimeDraft : formattedEndTime}
            disabled={disabled}
            onFocus={() => setActiveTimeField('end')}
            onBlur={handleEndInputBlur}
            onSelect={handleTimeInputSelect}
            onKeyDown={handleTimeInputKeyDown}
            onChange={handleEndInputChange}
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
