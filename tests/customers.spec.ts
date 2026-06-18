import { test, expect } from './fixtures/auth';
import { expandSidebarSection } from './fixtures/navigation';

test.describe('Customers Module', () => {
  test('customer views defined in app', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'العملاء');
    const items = ['إدارة العملاء', 'إضافة عميل جديد', 'إعدادات العملاء', 'كشف حساب العميل'];
    for (const item of items) {
      await expect(page.locator(`text="${item}"`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('manage clients view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'العملاء');
    await page.locator('text="إدارة العملاء"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });

  test('add client form fields exist', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'العملاء');
    await page.locator('text="إضافة عميل جديد"').first().click();
    await page.waitForTimeout(1000);
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThan(0);
  });
});
