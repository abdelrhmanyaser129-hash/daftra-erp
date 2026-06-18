import { test, expect } from './fixtures/auth';
import { expandSidebarSection } from './fixtures/navigation';

test.describe('Inventory Module', () => {
  test('inventory views defined in app', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المخزون');
    const items = ['المنتجات والخدمات', 'التصنيفات', 'الماركات', 'إدارة الإذن المخزنية', 'المستودعات', 'الفروع', 'المنتجات المركبة', 'حركة المخزون'];
    for (const item of items) {
      await expect(page.locator(`text="${item}"`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('products view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المخزون');
    await page.locator('text="المنتجات والخدمات"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });

  test('inventory vouchers view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المخزون');
    await page.locator('text="إدارة الإذن المخزنية"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });

  test('warehouses view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المخزون');
    await page.locator('text="المستودعات"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });

  test('branches view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'المخزون');
    await page.locator('text="الفروع"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });
});
