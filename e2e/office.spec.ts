import { test, expect } from '@playwright/test';

test.describe('Office Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to Office Suite', async ({ page }) => {
    await page.goto('/office');
    await expect(page.locator('h1')).toContainText('Office Suite');
  });

  test('should create a new Writer document', async ({ page }) => {
    await page.goto('/office/new?kind=writer');
    await expect(page.locator('input[aria-label="Document title"]')).toBeVisible();
    
    await page.fill('input[aria-label="Document title"]', 'Test Document');
    await page.fill('textarea[data-block="0"]', 'This is a test document created by E2E test.');
    await page.keyboard.press('Control+s');
    
    await expect(page.locator('.toast')).toContainText('Saved');
  });

  test('should create a new Spreadsheet', async ({ page }) => {
    await page.goto('/office/new?kind=spreadsheet');
    await expect(page.locator('input[aria-label="Spreadsheet title"]')).toBeVisible();
    
    await page.fill('input[aria-label="Spreadsheet title"]', 'Test Spreadsheet');
    await page.fill('input[aria-label="Formula bar"]', '100');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('.toast')).toContainText('Saved');
  });

  test('should create a new Presentation', async ({ page }) => {
    await page.goto('/office/new?kind=presentation');
    await expect(page.locator('input[aria-label="Presentation title"]')).toBeVisible();
    
    await page.fill('input[aria-label="Presentation title"]', 'Test Presentation');
    await page.keyboard.press('Control+s');
    
    await expect(page.locator('.toast')).toContainText('Saved');
  });

  test('should export document as markdown', async ({ page }) => {
    await page.goto('/office');
    const firstDoc = page.locator('a[href*="/office/writer/"]').first();
    if (await firstDoc.count() > 0) {
      await firstDoc.click();
      await page.click('button:has-text("Export")');
      await page.click('text=Markdown');
      
      // Check download starts
      const downloadPromise = page.waitForEvent('download');
      await downloadPromise;
    }
  });
});
