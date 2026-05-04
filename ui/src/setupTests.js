import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Provide a stable object URL implementation for local preview tests.
function ensureObjectUrlSupport() {
  if (!URL.createObjectURL) {
    URL.createObjectURL = () => 'blob:test-preview'
  }

  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = () => {}
  }
}


ensureObjectUrlSupport()

// Reset the rendered DOM between tests.
afterEach(() => {
  cleanup()
})
