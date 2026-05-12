import { useId, useRef } from 'react'

import filesIcon from '../../../img/ico/folder.png'

// Build one compact file-selection label for the upload trigger.
function formatSelectedFilesLabel(items, copy) {
  if (items.length === 0) {
    return copy.noFilesSelected
  }

  if (items.length === 1) {
    return items[0].file.name
  }

  return `${items[0].file.name} +${items.length - 1}`
}

// Render the file selection control for one or more videos.
export default function FileUpload({ items, activeItemId, onChange, onSelect, disabled, copy }) {
  const inputId = useId()
  const inputRef = useRef(null)
  const selectedFilesLabel = formatSelectedFilesLabel(items, copy)

  // Open the hidden native file picker from the styled trigger.
  function handleUploadTriggerClick() {
    if (disabled) {
      return
    }

    inputRef.current?.click()
  }

  return (
    <section className="panel panel-files stack">
      <div className="panel-hero">
        <div className="panel-icon-shell" aria-hidden="true">
          <img src={filesIcon} alt="" className="panel-icon" />
        </div>
        <div className="panel-intro">
          <h2>{copy.filesTitle}</h2>
          <p className="hint">{copy.filesHint}</p>
        </div>
      </div>
      <div className="upload-box">
        <button type="button" className="upload-trigger" disabled={disabled} onClick={handleUploadTriggerClick}>
          <span className="upload-trigger-button">{copy.selectVideos}</span>
          <span className={`upload-trigger-name ${items.length === 0 ? 'upload-trigger-name-empty' : ''}`}>
            {selectedFilesLabel}
          </span>
        </button>
        <input
          ref={inputRef}
          id={inputId}
          className="upload-native-input"
          aria-label={copy.selectVideos}
          type="file"
          accept="video/*"
          multiple
          disabled={disabled}
          onChange={onChange}
        />
        {items.length > 0 ? (
          <div className="file-list-scroll">
            <ul className="file-list">
              {items.map((item) => (
                <li key={item.id} className={`file-item ${item.id === activeItemId ? 'file-item-active' : ''}`}>
                  <button type="button" className="file-select-button" disabled={disabled} onClick={() => onSelect(item.id)}>
                    <span>{item.file.name}</span>
                    <span className="file-select-meta">{copy.editRangeAction}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="empty-copy">{copy.noFilesSelected}</p>
        )}
      </div>
    </section>
  )
}
