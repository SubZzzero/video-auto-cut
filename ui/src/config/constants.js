// Store frontend constants in one editable place.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

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

// Keep preview seek controls easy to tune from one place.
export const PREVIEW_SEEK_STEP_SECONDS = 1

// Keep supported crop modes centralized for UI and API calls.
export const CROP_MODE_VALUES = ['none', 'vertical', 'portrait_4_5', 'square_1_1', 'portrait_3_4', 'horizontal']

// Keep frontend crop ratio math aligned with backend presets.
export const CROP_PRESET_RATIOS = {
  vertical: { width: 9, height: 16 },
  portrait_4_5: { width: 4, height: 5 },
  square_1_1: { width: 1, height: 1 },
  portrait_3_4: { width: 3, height: 4 },
  horizontal: { width: 16, height: 9 },
}

// Keep crop snapping responsive without tying it to rendered preview pixels.
export const CROP_FRAME_SNAP_THRESHOLD_RATIO = 0.03

// Keep the minimum crop snapping threshold large enough to feel usable.
export const CROP_FRAME_SNAP_THRESHOLD_MIN_PX = 12

// Keep the maximum crop snapping threshold from feeling too aggressive.
export const CROP_FRAME_SNAP_THRESHOLD_MAX_PX = 48

// Keep queue status names centralized for consistent UI rendering.
export const QUEUE_STATUS = {
  queued: 'queued',
  uploading: 'uploading',
  processing: 'processing',
  cancelled: 'cancelled',
  success: 'success',
  error: 'error',
}
