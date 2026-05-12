import ProgressBar from './ProgressBar'
import ResultList from './ResultList'
import { translateErrorMessage, translateRuntimeMessage } from '../i18n/translations'
import { formatClockValue } from '../utils/time'
import queueIcon from '../../../img/ico/folder-done.png'


// Build one compact range summary for the queue list.
function formatQueueRange(item) {
  return `${formatClockValue(item.startTime)} - ${formatClockValue(item.endTime)} | ${item.duration}s`
}

// Resolve one translated queue-state badge label.
function resolveQueueStatusLabel(item, copy) {
  return copy.queueStates[item.status] ?? item.status
}

// Render the batch queue and per-file progress details.
export default function QueueList({ items, copy }) {
  return (
    <section className="panel panel-queue stack">
      <div className="panel-hero">
        <div className="panel-icon-shell" aria-hidden="true">
          <img src={queueIcon} alt="" className="panel-icon" />
        </div>
        <div className="panel-intro">
          <h2>{copy.queueTitle}</h2>
          <p className="hint">{copy.queueHint}</p>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="queue-list-scroll">
          <ul className="queue-list">
            {items.map((item) => (
              <li key={item.id} className="queue-item">
                <div className="queue-header">
                  <span className="queue-name">{item.file.name}</span>
                  <span className={`queue-status-badge queue-status-badge-${item.status}`}>{resolveQueueStatusLabel(item, copy)}</span>
                </div>
                <p className="queue-range">{formatQueueRange(item)}</p>
                <p className="queue-meta">{translateRuntimeMessage(item.message, copy)}</p>
                <ProgressBar value={item.progress} status={item.status} />
                {item.metadataError ? <p className="error-text">{translateErrorMessage(item.metadataError, copy)}</p> : null}
                {item.error ? <p className="error-text">{translateErrorMessage(item.error, copy)}</p> : null}
                <ResultList outputs={item.outputs} copy={copy} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="empty-copy">{copy.queueEmpty}</p>
      )}
    </section>
  )
}
