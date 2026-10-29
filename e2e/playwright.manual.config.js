import {defineConfig} from '@playwright/test';
import baseConfig from './playwright.config.js';

const manualViewport = {width: 1366, height: 1000};

export default defineConfig({
  ...baseConfig,
  testDir: './manual',
  retries: 0,
  timeout: 180_000,
  use: {...baseConfig.use, viewport: manualViewport, deviceScaleFactor: 1.5},
  projects: [{name: 'manual', use: {viewport: manualViewport, deviceScaleFactor: 1.5}}],
});
