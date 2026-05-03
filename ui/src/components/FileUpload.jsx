// Render the file selection control for one or more videos.
export default function FileUpload({ files, onChange, disabled, copy }) {
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
        {files.length > 0 ? (
          <ul className="file-list">
            {files.map((file) => (
              <li key={`${file.name}-${file.lastModified}`} className="file-item">
                {file.name}
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
