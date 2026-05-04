// Store frontend constants in one editable place.
export const API_BASE_URL = 'http://localhost:8000'

// Keep the default UI language in one place.
export const DEFAULT_LANGUAGE = 'en'

// Keep the polling interval easy to change for local tuning.
export const STATUS_POLL_INTERVAL_MS = 1500

// Provide shared default form values.
export const DEFAULT_FORM_SETTINGS = {
  crop: 'none',
  duration: 30,
}

// Keep one consistent time-input precision in the UI.
export const TIME_INPUT_DIGIT_COUNT = 6

// Keep the minimum selected range duration explicit.
export const MIN_RANGE_DURATION_SECONDS = 1

// Keep slider steps aligned with second-based trimming.
export const TIME_RANGE_STEP_SECONDS = 1

// Keep supported crop modes centralized for UI and API calls.
export const CROP_MODE_VALUES = ['none', 'vertical', 'portrait_4_5', 'square_1_1', 'portrait_3_4', 'horizontal']

// Keep queue status names centralized for consistent UI rendering.
export const QUEUE_STATUS = {
  queued: 'queued',
  uploading: 'uploading',
  processing: 'processing',
  success: 'success',
  error: 'error',
}
