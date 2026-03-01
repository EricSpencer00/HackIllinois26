import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'], // entry point tested via integration tests
    },
  },
  resolve: {
    alias: {
      '__STATIC_CONTENT_MANIFEST': '/tests/mocks/manifest.ts',
    },
  },
});
