///////////////////////////////////////////////////////////////////////////////
// 🛑 CRITICAL: SYSTEM-GENERATED FILE - DO NOT MODIFY DIRECTLY
//
// ANY MANUAL CHANGES MADE TO THIS FILE WILL BE WIPED ON THE NEXT 'tilt up'.
// TO MODIFY THIS CONFIGURATION:
// 1. Edit the source generator in: .tilt/topologies/
// 2. Or update platform-computing-provisioner.manifest.json
//
// Generation Source: TypeScript.generate_playwright_config()
// Service: identity-management-backend
// Type: BACKEND
///////////////////////////////////////////////////////////////////////////////
import { defineConfig } from '@playwright/test';

export default defineConfig({
  expect: {
    timeout: 5000,
  },

  forbidOnly: !!process.env.CI,
  fullyParallel: false,

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
  ],

  retries: process.env.CI ? 2 : 0,
  testDir: './test',
  timeout: 30000,

  use: {
    baseURL: process.env.BASE_URL || 'http://beauty-crm.localhost/api/v1/identity',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },

  workers: 1,
});
