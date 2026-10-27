import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de extremo a extremo contra los emuladores de Firebase. Antes se inician
 * y siembran los emuladores (en firebase/: `npm run emuladores` y `npm run semilla:emulador`);
 * Playwright levanta la interfaz en modo emuladores si no está ya en localhost:4200.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    launchOptions: process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {},
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run start:emuladores -- --port 4200', url: 'http://localhost:4200', reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
});
