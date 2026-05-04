import { useEffect, useState } from 'react'

import {
  MIN_RANGE_DURATION_SECONDS,
  TIME_RANGE_STEP_SECONDS,
} from '../config/constants'
import { translateErrorMessage } from '../i18n/translations'
import {
  formatClockValue,
  formatDurationSummary,
} from '../utils/time'


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


// Render local preview and range controls for one queued file.
export default function VideoRangeEditor({
  item,
  disabled,
  onStartTimeChange,
  onEndTimeChange,
  onStartSliderChange,
  onEndSliderChange,
  copy,
}) {
  const previewUrl = usePreviewUrl(item.file)
  const maxDuration = Math.max(item.durationSeconds, MIN_RANGE_DURATION_SECONDS)
  const selectedDuration = Math.max(item.endTime - item.startTime, 0)

  return (
    <section className="range-editor stack">
      <div className="panel-heading">
        <div>
          <h3>{copy.rangeEditorTitle}</h3>
          <p className="field-help">{copy.rangeEditorHint}</p>
        </div>
        <span className="range-file-name">{item.file.name}</span>
      </div>
      <video className="video-preview" src={previewUrl} controls preload="metadata" />
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
