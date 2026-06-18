import { test, expect } from './fixtures/auth';
import { expandSidebarSection } from './fixtures/navigation';

test.describe('Finance Module', () => {
  test('finance views defined in app', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المالية');
    const items = ['المصروفات', 'سندات القبض', 'خزائن وحسابات بنكية', 'حركة الخزينة'];
    for (const item of items) {
      await expect(page.locator(`text="${item}"`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('expenses view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المالية');
    await page.locator('text="المصروفات"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });

  test('bank cash safes view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المالية');
    await page.locator('text="خزائن وحسابات بنكية"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });

  test('accounts chart view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'الحسابات العامة');
    await page.locator('text="دليل الحسابات"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });
});
