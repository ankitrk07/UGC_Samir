import { defineConfig, devices } from '@playwright/test';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const port = new URL(baseURL).port || '3000';
export default defineConfig({
 testDir:'./tests/browser',fullyParallel:true,
 use:{baseURL,launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH},reducedMotion:'reduce',trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],browserName:'chromium'}}],
 webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port '+port,url:baseURL,reuseExistingServer:!process.env.CI,timeout:120000}
});
