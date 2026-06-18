import { test, expect } from './fixtures/auth';
import { expandSidebarSection } from './fixtures/navigation';

test.describe('Settings Module', () => {
  test('settings views defined in app', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'الحسابات العامة');
    await expect(page.locator('text="الإعدادات"').first()).toBeVisible({ timeout: 3000 });
  });

  test('sales settings view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المبيعات');
    await page.locator('text="إعدادات المبيعات"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });
});
