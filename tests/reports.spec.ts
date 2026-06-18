import { test, expect } from './fixtures/auth';
import { expandSidebarSection } from './fixtures/navigation';

test.describe('Reports Module', () => {
  test('reports view defined in app', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'التقارير');
    await expect(page.locator('text="التقرير الشامل الموحد والربحية"').first()).toBeVisible({ timeout: 3000 });
  });

  test('unified reports view renders', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expandSidebarSection(page, 'التقارير');
    await page.locator('text="التقرير الشامل الموحد والربحية"').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('header')).toBeVisible();
  });
});
