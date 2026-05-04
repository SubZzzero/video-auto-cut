import ProgressBar from './ProgressBar'
import ResultList from './ResultList'
import { translateErrorMessage, translateRuntimeMessage } from '../i18n/translations'
import { formatClockValue } from '../utils/time'


// Build one compact range summary for the queue list.
function formatQueueRange(item) {
  return `${formatClockValue(item.startTime)} - ${formatClockValue(item.endTime)} | ${item.duration}s`
}

// Render the batch queue and per-file progress details.
export default function QueueList({ items, copy }) {
  return (
    <section className="panel stack">
      <div>
        <h2>{copy.queueTitle}</h2>
        <p className="hint">{copy.queueHint}</p>
      </div>
      {items.length > 0 ? (
          <ul className="queue-list">
            {items.map((item) => (
              <li key={item.id} className="queue-item">
                <div className="queue-header">
                  <span className="queue-name">{item.file.name}</span>
                </div>
                <p className="queue-range">{formatQueueRange(item)}</p>
                <p className="queue-meta">{translateRuntimeMessage(item.message, copy)}</p>
                <ProgressBar value={item.progress} />
              {item.metadataError ? <p className="error-text">{translateErrorMessage(item.metadataError, copy)}</p> : null}
              {item.error ? <p className="error-text">{translateErrorMessage(item.error, copy)}</p> : null}
              <ResultList outputs={item.outputs} copy={copy} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-copy">{copy.queueEmpty}</p>
      )}
    </section>
  )
}
