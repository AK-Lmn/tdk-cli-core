///////////////////////////////////////////////////////////////////////////////
// 🛑 CRITICAL: SYSTEM-GENERATED FILE - DO NOT MODIFY DIRECTLY
//
// ANY MANUAL CHANGES MADE TO THIS FILE WILL BE WIPED ON THE NEXT 'tilt up'.
// TO MODIFY THIS CONFIGURATION:
// 1. Edit the source generator in: .tilt/topologies/
// 2. Or update platform-computing-provisioner.manifest.json
//
// Generation Source: TypeScript.generate_playwright_config()
// Service: appointment-management-frontend
// Type: FRONTEND
///////////////////////////////////////////////////////////////////////////////
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  expect: {
    timeout: 10000,
  },
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  maxFailures: process.env.CI ? undefined : 1,

  outputDir: path.join(__dirname, 'test-results/artifacts'),

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        viewport: { height: 720, width: 1280 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        headless: true,
        viewport: { height: 720, width: 1280 },
      },
    },
  ],

  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/test-results.json' }],
    [
      'html',
      {
        open: 'never',
        outputFolder: 'test-results/html-report',
      },
    ],
    ['junit', { outputFile: 'test-results/junit-report.xml' }],
    ['blob', { outputFile: 'test-results/test-blob-report.zip' }],
  ],

  retries: process.env.CI ? 2 : 0,
  testDir: './tests/e2e',
  timeout: 60 * 1000,

  use: {
    actionTimeout: 20000,
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },

  webServer: process.env.CI
    ? undefined
    : {
        command: 'bun run dev',
        port: 5173,
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },

  workers: process.env.CI ? 1 : undefined,
});
