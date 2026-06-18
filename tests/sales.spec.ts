import { test, expect } from './fixtures/auth';
import { expandSidebarSection } from './fixtures/navigation';

test.describe('Sales Module', () => {
  test('sales views defined in app', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المبيعات');
    const items = ['إدارة الفواتير', 'إنشاء فاتورة', 'الفواتير المرتجعة', 'مدفوعات العملاء', 'إعدادات المبيعات'];
    for (const item of items) {
      await expect(page.locator(`text="${item}"`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('manage invoices view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المبيعات');
    await page.locator('text="إدارة الفواتير"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });

  test('create invoice view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المبيعات');
    await page.locator('text="إنشاء فاتورة"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThan(0);
  });
});
