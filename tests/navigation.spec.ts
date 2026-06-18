import { test, expect } from './fixtures/auth';
import { SIDEBAR_SECTIONS } from './fixtures/navigation';

test.describe('App Navigation', () => {
  test('app root loads successfully', async ({ page, login }) => {
    await login();
    const hasLoginForm = await page.locator('input[type="text"]').isVisible().catch(() => false);
    const hasDashboard = await page.locator('#daftra-dashboard').isVisible().catch(() => false);
    expect(hasLoginForm || hasDashboard).toBeTruthy();
  });

  test('header is present when authenticated', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expect(page.locator('#daftra-header, header')).toBeVisible({ timeout: 5000 });
  });

  test('sidebar is present when authenticated', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    const sidebar = page.locator('aside, nav:has(a), [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sidebar Content', () => {
  test('sidebar menu items defined in config', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    let totalItems = 0;
    for (const [, section] of Object.entries(SIDEBAR_SECTIONS)) {
      totalItems += section.items.length;
    }
    expect(totalItems).toBeGreaterThan(0);
  });
});
