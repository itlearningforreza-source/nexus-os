import { test, expect } from '@playwright/test';

test.describe('CRM Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to CRM contacts', async ({ page }) => {
    await page.click('a[href="/crm"]');
    await expect(page).toHaveURL('/crm');
    await expect(page.locator('h1')).toContainText('Contacts');
  });

  test('should create a new contact', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.click('button:has-text("New Contact")');
    await expect(page.locator('input[label="First name"]')).toBeVisible();
    
    await page.fill('input[label="First name"]', 'John');
    await page.fill('input[label="Last name"]', 'Doe');
    await page.fill('input[label="Email"]', 'john.doe@example.com');
    await page.fill('input[label="Phone"]', '+1 555 123 4567');
    await page.fill('input[label="Title"]', 'CEO');
    await page.click('button:has-text("Create contact")');
    
    await expect(page.locator('.toast')).toContainText('Contact created');
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should navigate to CRM companies', async ({ page }) => {
    await page.goto('/crm/companies');
    await expect(page.locator('h1')).toContainText('Companies');
  });

  test('should create a new company', async ({ page }) => {
    await page.goto('/crm/companies');
    await page.click('button:has-text("New Company")');
    
    await page.fill('input[label="Name"]', 'Acme Corp');
    await page.fill('input[label="Website"]', 'https://acme.com');
    await page.selectOption('select[label="Industry"]', 'Technology');
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('.toast')).toContainText('Company created');
  });

  test('should navigate to Sales pipeline', async ({ page }) => {
    await page.goto('/sales');
    await expect(page.locator('h1')).toContainText('Sales Pipeline');
  });
});
