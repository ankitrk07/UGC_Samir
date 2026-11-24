import { test, expect } from '@playwright/test';

test('new visitors get dark even when their system prefers light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/for-brands');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 7, 10)');
  await expect(page.getByRole('button', { name: 'Switch to light mode', exact: true }).first()).toBeVisible();
});

test('theme toggles persist through refresh and client navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /hydration|did not match|server html/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/for-brands');
  await page.getByRole('button', { name: 'Switch to light mode', exact: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('trendhive-theme'))).toBe('light');
  await expect(page.locator('.theme-icon-moon').first()).toHaveCSS('opacity', '1');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 249, 246)');
  await page.locator('.footer-links').getByRole('link', { name: 'Pricing', exact: true }).click();
  await expect(page).toHaveURL(/\/pricing/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).first().click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 7, 10)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('saved light is applied before React loads', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('trendhive-theme', 'light'));
  await page.route('**/_next/static/**/*.js', route => route.abort());
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 249, 246)');
});

test('blocked browser storage falls back to dark and still allows toggling', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/pricing');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode', exact: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});

test('dashboard and mobile menu use the same persistent theme control', async ({ page, isMobile }) => {
  await page.goto('/dashboard-demo');
  await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click();
  await expect(page.locator('.dashboard-app')).toHaveCSS('background-color', 'rgb(250, 249, 246)');
  await expect(page.locator('.analytics-panel')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.goto('/for-creators');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  if (isMobile) {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('dialog', { name: 'Navigation' }).getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Close menu', exact: true }).click();
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('invalid stored preferences default to dark', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('trendhive-theme', 'system'));
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
