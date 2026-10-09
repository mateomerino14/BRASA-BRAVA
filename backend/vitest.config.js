import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 20_000,
    fileParallelism: !process.env.TEST_DATABASE_URL,
    coverage: {include: ['src/**/*.js'], exclude: ['src/scripts/**', 'src/server.js']},
  },
});
