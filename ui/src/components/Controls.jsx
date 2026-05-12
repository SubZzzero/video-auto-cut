import VideoRangeEditor from './VideoRangeEditor'
import { getCropOptions } from '../i18n/translations'
import settingsIcon from '../../../img/ico/settings.png'

// Render processing settings and the main action button.
export default function Controls({
  activeItem,
  disabled,
  canSubmit,
  canCancel,
  isCancelling,
  onCropChange,
  onCropPositionChange,
  onDurationChange,
  onStartTimeChange,
  onEndTimeChange,
  onStartSliderChange,
  onEndSliderChange,
  onVideoMetadataChange,
  onSubmit,
  onCancel,
  copy,
}) {
  const cropOptions = getCropOptions(copy)

  if (!activeItem) {
    return (
      <section className="panel panel-settings stack controls-panel">
        <div className="panel-hero">
          <div className="panel-icon-shell" aria-hidden="true">
            <img src={settingsIcon} alt="" className="panel-icon" />
          </div>
          <div className="controls-header">
            <h2>{copy.settingsTitle}</h2>
            <p className="hint">{copy.settingsEmpty}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="panel panel-settings stack controls-panel">
      <div className="panel-hero">
        <div className="panel-icon-shell" aria-hidden="true">
          <img src={settingsIcon} alt="" className="panel-icon" />
        </div>
        <div className="controls-header">
          <h2>{copy.settingsTitle}</h2>
          <p className="hint">{copy.settingsHint}</p>
        </div>
      </div>
      <VideoRangeEditor
        item={activeItem}
        disabled={disabled}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onStartSliderChange={onStartSliderChange}
        onEndSliderChange={onEndSliderChange}
        onCropPositionChange={onCropPositionChange}
        onVideoMetadataChange={onVideoMetadataChange}
        copy={copy}
      />
      <div className="settings-grid">
        <div className="field setting-card">
          <div className="setting-copy">
            <span className="field-label" id="crop-label">{copy.cropLabel}</span>
            <p className="field-help">{copy.cropInfo}</p>
          </div>
          <select
            id="crop"
            aria-labelledby="crop-label"
            value={activeItem.crop}
            disabled={disabled}
            onChange={onCropChange}
          >
            {cropOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field setting-card">
          <div className="setting-copy">
            <span className="field-label" id="duration-label">{copy.durationLabel}</span>
            <p className="field-help">{copy.durationInfoChunk}</p>
          </div>
          <input
            id="duration"
            aria-labelledby="duration-label"
            min="1"
            type="number"
            value={activeItem.duration}
            disabled={disabled}
            onChange={onDurationChange}
          />
        </div>
      </div>
      <div className="action-row">
        {canCancel ? (
          <button
            type="button"
            className="action-button-secondary"
            disabled={isCancelling}
            onClick={onCancel}
          >
            {copy.stopProcessing}
          </button>
        ) : (
          <button type="button" disabled={!canSubmit || disabled} onClick={onSubmit}>
            {copy.startProcessing}
          </button>
        )}
      </div>
    </section>
  )
}
