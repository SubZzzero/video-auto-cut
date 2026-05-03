import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configure Vite for local React development and tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
