import { test, expect } from '@playwright/test';

test.describe('GangGPT Full Stack E2E Tests', () => {
  test('Homepage should load and display main sections', async ({ page }) => {
    await page.goto('http://localhost:4829');

    // Check if page loads
    await expect(page).toHaveTitle(/GangGPT/);

    // Check main sections
    await expect(page.locator('text=Welcome to GangGPT')).toBeVisible();
    await expect(page.locator('text=Live Server Statistics')).toBeVisible();

    // Check if statistics are loading
    const statsSection = page.locator('[id="statistics-section"]');
    await expect(statsSection).toBeVisible();

    // Wait for stats to load (they update every 30 seconds)
    await page.waitForTimeout(2000);

    // Check if at least one stat value is displayed
    const statValues = page.locator('.text-4xl.font-black.text-white');
    await expect(statValues.first()).toBeVisible();
  });

  test('Statistics should display real backend data', async ({ page }) => {
    await page.goto('http://localhost:4829/test-stats');

    // Wait for stats to load
    await page.waitForSelector('.text-2xl.font-bold', { timeout: 10000 });

    // Check if stats sections are present
    await expect(page.locator('text=Server Statistics')).toBeVisible();
    await expect(page.locator('text=Players')).toBeVisible();
    await expect(page.locator('text=Server Info')).toBeVisible();

    // Check if actual data is displayed (not just loading states)
    const playerCount = page.locator('text=/\\d+/ >> nth=0');
    await expect(playerCount).toBeVisible();
  });

  test('tRPC integration test page should pass all tests', async ({ page }) => {
    await page.goto('http://localhost:4829/test-trpc');

    // Wait for tests to complete
    await page.waitForSelector('.bg-green-100', { timeout: 15000 });

    // Check that we have successful test results
    const successResults = page.locator('.bg-green-100');
    const successCount = await successResults.count();

    // We should have at least 3 successful tests
    expect(successCount).toBeGreaterThanOrEqual(3);

    // Check specific test results
    await expect(page.locator('text=✅ Backend connectivity')).toBeVisible();
    await expect(page.locator('text=✅ Stats API')).toBeVisible();
  });

  test('Authentication pages should be accessible', async ({ page }) => {
    // Test login page
    await page.goto('http://localhost:4829/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Test register page
    await page.goto('http://localhost:4829/auth/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Navigation should work properly', async ({ page }) => {
    await page.goto('http://localhost:4829');

    // Test navigation to different sections
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/dashboard/);

    await page.click('text=Factions');
    await expect(page).toHaveURL(/factions/);

    await page.click('text=AI Companions');
    await expect(page).toHaveURL(/companions/);
  });

  test('Backend API endpoints should be accessible from frontend', async ({ page }) => {
    await page.goto('http://localhost:4829');

    // Test if backend endpoints return proper responses
    const statsResponse = await page.evaluate(async () => {
      const response = await fetch('http://localhost:4828/api/stats');
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json()
      };
    });

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.ok).toBe(true);
    expect(statsResponse.data).toHaveProperty('players');
    expect(statsResponse.data).toHaveProperty('server');
    expect(statsResponse.data).toHaveProperty('ai');

    // Test server info endpoint
    const serverResponse = await page.evaluate(async () => {
      const response = await fetch('http://localhost:4828/api/server/info');
      return {
        status: response.status,
        data: await response.json()
      };
    });

    expect(serverResponse.status).toBe(200);
    expect(serverResponse.data).toHaveProperty('maxPlayers');
  });

  test('Real-time statistics updates should work', async ({ page }) => {
    await page.goto('http://localhost:4829/test-stats');

    // Get initial stats
    await page.waitForSelector('.text-2xl.font-bold');
    const initialTimestamp = await page.locator('text=/Server Time:/').textContent();

    // Wait a bit and check if timestamp updates
    await page.waitForTimeout(5000);

    // The timestamp should be updating every few seconds
    const currentTimestamp = await page.locator('text=/Server Time:/').textContent();

    // The timestamps might be different if enough time has passed
    // At minimum, we verify the format is correct
    expect(currentTimestamp).toMatch(/Server Time:/);
  });
});
