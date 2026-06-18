import { test, expect } from './fixtures/auth';
import { expandSidebarSection } from './fixtures/navigation';

test.describe('Purchases Module', () => {
  test('purchase views defined in app', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المشتريات');
    const items = ['فواتير الشراء', 'مرتجعات المشتريات', 'إدارة الموردين', 'مدفوعات الموردين', 'كشف حساب المورد'];
    for (const item of items) {
      await expect(page.locator(`text="${item}"`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('purchase invoices view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المشتريات');
    await page.locator('text="فواتير الشراء"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });
});
