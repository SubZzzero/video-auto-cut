// Store frontend constants in one editable place.
export const API_BASE_URL = 'http://localhost:8000'

// Keep the default UI language in one place.
export const DEFAULT_LANGUAGE = 'en'

// Keep the polling interval easy to change for local tuning.
export const STATUS_POLL_INTERVAL_MS = 1500

// Provide shared default form values.
export const DEFAULT_FORM_SETTINGS = {
  mode: 'chunk',
  crop: 'none',
  duration: 30,
}

// Keep supported crop modes centralized for UI and API calls.
export const CROP_MODE_VALUES = ['none', 'vertical', 'horizontal']

// Keep queue status names centralized for consistent UI rendering.
export const QUEUE_STATUS = {
  queued: 'queued',
  uploading: 'uploading',
  processing: 'processing',
  success: 'success',
  error: 'error',
}
