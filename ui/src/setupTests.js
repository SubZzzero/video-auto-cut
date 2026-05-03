import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Reset the rendered DOM between tests.
afterEach(() => {
  cleanup()
})
