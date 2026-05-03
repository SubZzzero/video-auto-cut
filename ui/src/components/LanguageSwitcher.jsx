import { LANGUAGE_OPTIONS } from '../i18n/translations'

// Render the UI language selector.
export default function LanguageSwitcher({ language, onChange, copy }) {
  return (
    <div className="language-control">
      <label htmlFor="language">{copy.languageLabel}</label>
      <select id="language" value={language} onChange={onChange}>
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
