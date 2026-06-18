import { test as base, Page } from '@playwright/test';

export async function tryLogin(page: Page, username = 'admin', password = 'admin123'): Promise<boolean> {
  try {
    await page.goto('/', { timeout: 15000 });
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => {
      const h2 = document.querySelector('h2');
      return h2 && h2.textContent?.includes('أهلاً');
    }, { timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

interface AuthFixtures {
  login: (username?: string, password?: string) => Promise<boolean>;
}

export const test = base.extend<AuthFixtures>({
  login: async ({ page }, use) => {
    await use((username?: string, password?: string) => tryLogin(page, username, password));
  },
});

export { expect } from '@playwright/test';
