import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['pipeline/phase-1/tests/**/*.test.ts', 'pipeline/phase-2/tests/**/*.test.ts', 'pipeline/phase-3/tests/**/*.test.ts', 'pipeline/phase-4/tests/**/*.test.ts', 'components/**/*.test.ts', 'store/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['**/*.d.ts'],
    },
  },
});
