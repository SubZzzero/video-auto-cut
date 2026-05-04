// Render the file selection control for one or more videos.
export default function FileUpload({ items, activeItemId, onChange, onSelect, disabled, copy }) {
  return (
    <section className="panel stack">
      <div>
        <h2>{copy.filesTitle}</h2>
        <p className="hint">{copy.filesHint}</p>
      </div>
      <div className="upload-box">
        <input
          aria-label={copy.selectVideos}
          type="file"
          accept="video/*"
          multiple
          disabled={disabled}
          onChange={onChange}
        />
        {items.length > 0 ? (
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
        ) : (
          <p className="empty-copy">{copy.noFilesSelected}</p>
        )}
      </div>
    </section>
  )
}
