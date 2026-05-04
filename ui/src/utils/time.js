import {
  MIN_RANGE_DURATION_SECONDS,
  TIME_INPUT_DIGIT_COUNT,
} from '../config/constants'


// Clamp one second value into a valid duration range.
export function clampTimeValue(value, maxDuration) {
  return Math.min(Math.max(value, 0), maxDuration)
}


// Convert raw input into a compact six-digit time string.
function normalizeTimeDigits(value) {
  const digitsOnly = value.replace(/\D/g, '').slice(-TIME_INPUT_DIGIT_COUNT)
  return digitsOnly.padStart(TIME_INPUT_DIGIT_COUNT, '0')
}


// Format one second count as `HH:MM:SS`.
export function formatClockValue(value) {
  const totalSeconds = Math.max(0, Math.floor(value))
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}


// Parse typed `HH:MM:SS`-style input into a second count.
export function parseClockInput(value) {
  const normalizedDigits = normalizeTimeDigits(value)
  const hours = Number(normalizedDigits.slice(0, 2))
  const minutes = Number(normalizedDigits.slice(2, 4))
  const seconds = Number(normalizedDigits.slice(4, 6))

  return (hours * 3600) + (minutes * 60) + seconds
}


// Clamp one start time so the selected range always stays valid.
export function resolveStartTime(nextValue, currentEndTime, maxDuration) {
  const maximumStartTime = Math.max(currentEndTime - MIN_RANGE_DURATION_SECONDS, 0)
  return Math.min(clampTimeValue(nextValue, maxDuration), maximumStartTime)
}


// Clamp one end time so the selected range always stays valid.
export function resolveEndTime(nextValue, currentStartTime, maxDuration) {
  const minimumEndTime = currentStartTime + MIN_RANGE_DURATION_SECONDS
  return Math.max(clampTimeValue(nextValue, maxDuration), minimumEndTime)
}


// Build a readable selected-duration label.
export function formatDurationSummary(value) {
  return formatClockValue(Math.max(value, 0))
}
