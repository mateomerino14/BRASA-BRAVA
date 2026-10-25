import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3200);
const baseURL = `http://127.0.0.1:${port}`;
const serverStartupMs = 180_000;
const testTimeoutMs = 60_000;
const ciRetries = 1;

let retries = 0;
let reporter = 'list';
if (process.env.CI) {
  retries = ciRetries;
  reporter = [['list'], ['html', {open: 'never'}]];
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries,
  reporter,
  timeout: testTimeoutMs,
  use: {
    baseURL,
    locale: 'es-BO',
    timezoneId: 'America/La_Paz',
    viewport: {width: 1440, height: 900},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome'], viewport: {width: 1440, height: 900}}}],
  webServer: {
    command: 'node src/server.js',
    url: `${baseURL}/api/health`,
    timeout: serverStartupMs,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
