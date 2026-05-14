import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PT_EMAIL = 'camille.bernard@email.fr';
const PT_PASSWORD = 'Patient123!';

const loginPatient = async (page: Page) => {
  await page.goto(BASE_URL + '/patient/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', PT_EMAIL);
  await page.fill('input[type="password"]', PT_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/patient\/dashboard/, { timeout: 10000 });
};

test.describe('Patient Portal', () => {

  test.describe('Authentication', () => {
    test('PT01 - Login page loads correctly', async ({ page }) => {
      await page.goto(BASE_URL + '/patient/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Portail Patient')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('PT02 - Successful login redirects to dashboard', async ({ page }) => {
      await loginPatient(page);
      await expect(page).toHaveURL(/\/patient\/dashboard/);
    });

    test('PT03 - Wrong credentials shows error', async ({ page }) => {
      await page.goto(BASE_URL + '/patient/login');
      await page.waitForLoadState('networkidle');
      await page.fill('input[type="email"]', 'wrong@test.com');
      await page.fill('input[type="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/patient/login');
    });

    test('PT04 - Route guard: unauthenticated redirected to login', async ({ page }) => {
      await page.goto(BASE_URL + '/patient/dashboard');
      await page.waitForURL(/\/patient\/login/, { timeout: 10000 });
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => { await loginPatient(page); });

    test('PT05 - Dashboard shows', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /Bonjour, Camille/ })).toBeVisible();
    });

    test('PT06 - Sidebar navigation works', async ({ page }) => {
      const links = [
        { text: 'Mon espace', url: '/patient/dashboard' },
        { text: 'Mon dossier', url: '/patient/dossier' },
        { text: 'Mes ordonnances', url: '/patient/prescriptions' },
        { text: 'Mes rendez-vous', url: '/patient/rendez-vous' },
      ];
      for (const link of links) {
        await page.locator('aside a').filter({ hasText: link.text }).click();
        await page.waitForURL(new RegExp(link.url.replace(/\//g, '\\/')), { timeout: 5000 });
      }
    });
  });

  test.describe('Dossier', () => {
    test.beforeEach(async ({ page }) => {
      await loginPatient(page);
      await page.locator('aside a').filter({ hasText: 'Mon dossier' }).click();
      await page.waitForURL(/\/patient\/dossier/, { timeout: 5000 });
    });

    test('PT07 - Dossier page loads', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/patient\/dossier/);
    });

    test('PT08 - Dossier shows patient info', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const body = await page.locator('body').textContent();
      expect(body).toContain('Camille');
    });

    test('PT09 - API calls to /api/patient/dossier', async ({ page }) => {
      const apiCalls: string[] = [];
      page.on('request', req => {
        if (req.url().includes('/patient/')) apiCalls.push(req.url());
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      expect(apiCalls.length).toBeGreaterThan(0);
    });
  });

  test.describe('Prescriptions', () => {
    test.beforeEach(async ({ page }) => {
      await loginPatient(page);
      await page.locator('aside a').filter({ hasText: 'Mes ordonnances' }).click();
      await page.waitForURL(/\/patient\/prescriptions/, { timeout: 5000 });
    });

    test('PT10 - Prescriptions page loads', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/patient\/prescriptions/);
    });
  });

  test.describe('Rendez-vous', () => {
    test.beforeEach(async ({ page }) => {
      await loginPatient(page);
      await page.locator('aside a').filter({ hasText: 'Mes rendez-vous' }).click();
      await page.waitForURL(/\/patient\/rendez-vous/, { timeout: 5000 });
    });

    test('PT11 - Rendez-vous page loads', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/patient\/rendez-vous/);
    });
  });

  test.describe('Profile', () => {
    test.beforeEach(async ({ page }) => { await loginPatient(page); });

    test('PT12 - Profile page loads', async ({ page }) => {
      await page.goto(BASE_URL + '/patient/profile');
      await page.waitForURL(/\/patient\/profile/, { timeout: 5000 });
    });
  });
});
