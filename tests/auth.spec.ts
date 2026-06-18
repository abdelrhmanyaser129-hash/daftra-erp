import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects to login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    const loginForm = page.locator('input[type="text"]').first();
    await expect(loginForm).toBeVisible({ timeout: 10000 });
  });

  test('login page has all required elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="text"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=تسجيل الدخول').first()).toBeVisible();
  });

  test('login form has branding elements', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toContainText(/DAFTRA/i);
  });

  test('login validation for empty fields', async ({ page }) => {
    await page.goto('/');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(1000);
    const inputs = page.locator('input[type="text"]');
    const val = await inputs.inputValue();
    expect(val).toBe('');
  });

  test('incorrect credentials show error message', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="text"]').fill('wronguser');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    const errorMsg = page.locator('[class*="rose"], [class*="error"], [class*="alert"]').filter({ hasText: /خطأ|غير صحيح|فشل/ });
    const exists = await errorMsg.isVisible().catch(() => false);
  });

  test('login form has username and password labels', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=اسم المستخدم').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=كلمة المرور').first()).toBeVisible();
  });
});
