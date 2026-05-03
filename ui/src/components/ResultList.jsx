import { API_BASE_URL } from '../config/constants'
import { formatResultCount } from '../i18n/translations'

// Render generated files for one queue item.
export default function ResultList({ outputs, copy }) {
  if (outputs.length === 0) {
    return null
  }

  return (
    <section className="result-section">
      <div className="result-header">
        <h3>{copy.outputsTitle}</h3>
        <span className="result-meta">{formatResultCount(copy, outputs.length)}</span>
      </div>
      <div className="result-scroll">
        <ul className="result-list">
          {outputs.map((output) => (
            <li key={output.relative_path} className="result-item">
              <div className="result-header">
                <span className="result-name">{output.name}</span>
              </div>
              <div className="result-meta">
                <a href={`${API_BASE_URL}${output.url}`} target="_blank" rel="noreferrer">
                  {copy.openOutput}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
