import { expect, test } from 'vitest'

import {
  formatClockValue,
  parseClockInput,
  resolveEndTime,
  resolveStartTime,
} from './time'


// Verify that numeric typing auto-normalizes into `HH:MM:SS` values.
test('parses compact numeric input into seconds', () => {
  expect(parseClockInput('215')).toBe(135)
  expect(parseClockInput('00:02:15')).toBe(135)
})


// Verify that second values render as full clock strings.
test('formats seconds as a stable clock string', () => {
  expect(formatClockValue(135)).toBe('00:02:15')
  expect(formatClockValue(3661)).toBe('01:01:01')
})


// Verify that start time cannot move past the selected end.
test('clamps start time before the selected end', () => {
  expect(resolveStartTime(90, 60, 300)).toBe(59)
})


// Verify that end time cannot move before the selected start.
test('clamps end time after the selected start', () => {
  expect(resolveEndTime(40, 55, 300)).toBe(56)
})
