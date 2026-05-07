// Clamp a progress value into the visible percentage range.
function normalizeProgress(value) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}


// Render a status-aware percentage bar for one queue item.
export default function ProgressBar({ value, status = 'queued' }) {
  const normalizedValue = normalizeProgress(value)

  return (
    <div
      className={`progress-track progress-track-${status}`}
      role="progressbar"
      aria-label="Progress bar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
    >
      <div
        className={`progress-value progress-value-${status}`}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  )
}
