import { getCropOptions } from '../i18n/translations'

// Render processing settings and the main action button.
export default function Controls({ settings, disabled, canSubmit, onCropChange, onDurationChange, onSubmit, copy }) {
  const cropOptions = getCropOptions(copy)

  return (
    <section className="panel stack controls-panel">
      <div className="controls-header">
        <h2>{copy.settingsTitle}</h2>
        <p className="hint">{copy.settingsHint}</p>
      </div>
      <div className="settings-grid">
        <div className="field setting-card">
          <div className="setting-copy">
            <span className="field-label" id="crop-label">{copy.cropLabel}</span>
            <p className="field-help">{copy.cropInfo}</p>
          </div>
          <select
            id="crop"
            aria-labelledby="crop-label"
            value={settings.crop}
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
            value={settings.duration}
            disabled={disabled}
            onChange={onDurationChange}
          />
        </div>
      </div>
      <div className="action-row">
        <button type="button" disabled={!canSubmit || disabled} onClick={onSubmit}>
          {copy.startProcessing}
        </button>
      </div>
    </section>
  )
}
