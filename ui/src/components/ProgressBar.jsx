// Render a simple percentage bar for job progress.
export default function ProgressBar({ value }) {
  return (
    <div className="progress-track" aria-label="Progress bar">
      <div className="progress-value" style={{ width: `${value}%` }} />
    </div>
  )
}
