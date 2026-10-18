import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    // Use vmThreads to avoid "Timeout waiting for worker to respond" on slower machines
    pool: 'vmThreads',
    maxWorkers: 2,
    testTimeout: 20000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      include: [
        'src/components/**',
        'src/lib/**',
      ],
      exclude: [
        'src/components/**/*.d.ts',
        'src/lib/ai.ts', // server-only, imports groq-sdk
      ],
      // skipFull: false so 100%-covered files still appear in the text table
      reporter: [['text', { skipFull: false }], 'html', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub Next.js server-only guard so tests can import server modules
      'server-only': path.resolve(__dirname, './src/tests/__mocks__/server-only.ts'),
      // Stub groq-sdk so tests never call the real API
      'groq-sdk': path.resolve(__dirname, './src/tests/__mocks__/groq-sdk.ts'),
    },
  },
})
