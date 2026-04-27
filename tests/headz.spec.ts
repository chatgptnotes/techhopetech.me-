import { test, expect } from '@playwright/test';

// ─── Landing Page ─────────────────────────────────────────────────────────────

test.describe('Landing Page', () => {
  test('loads and shows hero headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Try Any Hairstyle')).toBeVisible();
  });

  test('logo is visible in nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav img[alt="HEADZ"]')).toBeVisible();
  });

  test('"Try It Free" CTA navigates to /app', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Try It Free');
    await expect(page).toHaveURL(/\/app/);
  });

  test('"Get Started Free" CTA navigates to /app', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Get Started Free');
    await expect(page).toHaveURL(/\/app/);
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('Sign In button opens auth modal', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign In');
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
  });

  test('/privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).not.toHaveURL(/error/);
  });

  test('/terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).not.toHaveURL(/error/);
  });
});

// ─── App Page ─────────────────────────────────────────────────────────────────

test.describe('App Page (/app)', () => {
  test('loads without crashing', async ({ page }) => {
    await page.goto('/app');
    // Page should render something — not a blank screen
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('has no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

// ─── Mobile Layout ────────────────────────────────────────────────────────────

test.describe('Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('landing page fits mobile viewport without overflow', async ({ page }) => {
    await page.goto('/');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('logo visible on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav img[alt="HEADZ"]')).toBeVisible();
  });
});
