import { translateScreenState } from '../i18n/translations'

// Render the global screen state summary.
export default function StatusPanel({ state, queueItems, copy }) {
  const successCount = queueItems.filter((item) => item.status === 'success').length
  const errorCount = queueItems.filter((item) => item.status === 'error').length
  const remainingCount = queueItems.length - successCount - errorCount
  const metrics = [
    { value: successCount, label: copy.statusMetrics.completed, tone: 'success' },
    { value: errorCount, label: copy.statusMetrics.failed, tone: 'error' },
    { value: remainingCount, label: copy.statusMetrics.remaining, tone: 'neutral' },
  ]

  return (
    <section className="panel stack status-panel">
      <div className="panel-heading">
        <h2>{copy.statusTitle}</h2>
        <span className="status-badge">{translateScreenState(state, copy)}</span>
      </div>
      {queueItems.length === 0 ? (
        <p className="status-copy">{copy.statusEmpty}</p>
      ) : (
        <div className="status-metrics" role="list" aria-label={copy.statusTitle}>
          {metrics.map((metric) => (
            <div key={metric.label} className={`status-metric status-metric-${metric.tone}`} role="listitem">
              <span className="status-metric-value">{metric.value}</span>
              <span className="status-metric-label">{metric.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
