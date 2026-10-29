import {defineConfig, devices} from '@playwright/test';
import {baseURL} from './e2e.config.js';

const serverTimeoutMs = 60_000;
const testTimeoutMs = 30_000;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: testTimeoutMs,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL,
    locale: 'es-BO',
    timezoneId: 'America/La_Paz',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome'], viewport: {width: 1440, height: 900}}}],
  webServer: {
    command: 'node scripts/startServer.js',
    url: `${baseURL}/api/health`,
    timeout: serverTimeoutMs,
    reuseExistingServer: false,
    stdout: 'pipe',
  },
});
