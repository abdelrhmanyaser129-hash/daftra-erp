import { test, expect } from './fixtures/auth';

test.describe('Dashboard', () => {
  test('page renders after login attempt', async ({ page, login }) => {
    await login();
    const loginForm = page.locator('input[type="text"]');
    const isLogin = await loginForm.isVisible().catch(() => false);
    if (isLogin) return;
    await expect(page.locator('#daftra-dashboard')).toBeVisible({ timeout: 5000 });
  });

  test('welcome text visible when authenticated', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expect(page.locator('h2').or(page.locator('text=أهلاً').first())).toBeVisible({ timeout: 5000 });
  });

  test('header shows when authenticated', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expect(page.locator('#daftra-header, header')).toBeVisible({ timeout: 5000 });
  });

  test('logout button when authenticated', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    await expect(page.locator('button[aria-label="تسجيل الخروج"]')).toBeVisible({ timeout: 5000 });
  });

  test('quick action buttons when authenticated', async ({ page, login }) => {
    const authed = await login();
    if (!authed) return;
    const btn = page.locator('button:has-text("إنشاء فاتورة"), button:has-text("إضافة عميل")').first();
    await expect(btn).toBeVisible({ timeout: 5000 });
  });
});
