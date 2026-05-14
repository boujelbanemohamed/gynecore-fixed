import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const DOC_EMAIL = 'dr.martin@gynecare.fr';
const DOC_PASSWORD = 'Doctor123!';
const PATIENT_EMAIL = 'camille.bernard@email.fr';

const loginDoctor = async (page: Page) => {
  await page.goto(BASE_URL + '/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', DOC_EMAIL);
  await page.fill('input[type="password"]', DOC_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
};

test.describe('Doctor Portal', () => {

  test.describe('Authentication', () => {
    test('DR01 - Login page loads correctly', async ({ page }) => {
      await page.goto(BASE_URL + '/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Connexion médecin')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('DR02 - Successful login redirects to dashboard', async ({ page }) => {
      await loginDoctor(page);
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('DR03 - Wrong credentials shows error', async ({ page }) => {
      await page.goto(BASE_URL + '/login');
      await page.waitForLoadState('networkidle');
      await page.fill('input[type="email"]', 'wrong@test.com');
      await page.fill('input[type="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/login');
    });

    test('DR04 - Route guard: unauthenticated redirected to login', async ({ page }) => {
      await page.goto(BASE_URL + '/dashboard');
      await page.waitForURL(/\/login/, { timeout: 10000 });
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => { await loginDoctor(page); });

    test('DR05 - Dashboard shows stats cards', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /Bonjour, Dr/ })).toBeVisible();
      const body = await page.locator('body').textContent();
      expect(body).toContain('Patientes');
      expect(body).toContain('Consultations');
    });

    test('DR06 - Sidebar navigation works', async ({ page }) => {
      const links = [
        { text: 'Tableau de bord', url: '/dashboard' },
        { text: 'Patientes', url: '/patients' },
        { text: 'Consultations', url: '/consultations' },
        { text: 'Planning', url: '/calendar' },
        { text: 'Mon Profil', url: '/profile' },
      ];
      for (const link of links) {
        await page.locator('aside a').filter({ hasText: link.text }).click();
        await page.waitForURL(new RegExp(link.url.replace(/\//g, '\\/')), { timeout: 5000 });
      }
    });
  });

  test.describe('Patients', () => {
    test.beforeEach(async ({ page }) => {
      await loginDoctor(page);
      await page.locator('aside a').filter({ hasText: 'Patientes' }).click();
      await page.waitForURL(/\/patients/, { timeout: 5000 });
    });

    test('DR07 - Patients list loads', async ({ page }) => {
      await page.waitForResponse(resp => resp.url().includes('/doctor/patients') && resp.status() === 200, { timeout: 10000 });
      const body = await page.locator('body').textContent();
      expect(body).toContain('Camille');
      expect(body).toContain('Bernard');
    });

    test('DR08 - Click patient opens detail', async ({ page }) => {
      await page.waitForResponse(resp => resp.url().includes('/doctor/patients') && resp.status() === 200, { timeout: 10000 });
      await page.getByText('Camille Bernard').first().click();
      await page.waitForURL(/\/patients\/[a-zA-Z0-9]/, { timeout: 10000 });
      await page.waitForSelector('text=camille.bernard@email.fr', { timeout: 10000 });
    });

    test('DR09 - Patient detail has all tabs', async ({ page }) => {
      await page.waitForResponse(resp => resp.url().includes('/doctor/patients') && resp.status() === 200, { timeout: 10000 });
      await page.getByText('Camille Bernard').first().click();
      await page.waitForURL(/\/patients\/[a-zA-Z0-9]/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      const body = await page.locator('body').textContent();
      expect(body).toContain('Consultations');
    });
  });

  test.describe('Calendar', () => {
    test.beforeEach(async ({ page }) => {
      await loginDoctor(page);
      await page.locator('aside a').filter({ hasText: 'Planning' }).click();
      await page.waitForURL(/\/calendar/, { timeout: 5000 });
    });

    test('DR10 - Calendar page loads', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Planning', { exact: true })).toBeVisible();
    });

    test('DR11 - API calls use /api/doctor/appointments', async ({ page }) => {
      const apiCalls: string[] = [];
      page.on('request', req => {
        if (req.url().includes('/appointments')) apiCalls.push(req.url());
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      expect(apiCalls.filter(u => u.includes('/doctor/appointments')).length).toBeGreaterThan(0);
    });
  });

  test.describe('Consultations', () => {
    test.beforeEach(async ({ page }) => {
      await loginDoctor(page);
      await page.locator('aside a').filter({ hasText: 'Consultations' }).click();
      await page.waitForURL(/\/consultations/, { timeout: 5000 });
    });

    test('DR12 - Consultations list loads', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const body = await page.locator('body').textContent();
      expect(body).toContain('Consultations');
    });

    test('DR13 - API calls to /api/doctor/consultations', async ({ page }) => {
      const apiCalls: string[] = [];
      page.on('request', req => {
        if (req.url().includes('/consultations')) apiCalls.push(req.url());
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      expect(apiCalls.filter(u => u.includes('/doctor/consultations')).length).toBeGreaterThan(0);
    });
  });

  test.describe('Profile & Logout', () => {
    test.beforeEach(async ({ page }) => { await loginDoctor(page); });

    test('DR14 - Profile page loads', async ({ page }) => {
      await page.locator('aside a').filter({ hasText: 'Mon Profil' }).click();
      await page.waitForURL(/\/profile/, { timeout: 5000 });
    });

    test('DR15 - Logout works', async ({ page }) => {
      await page.getByText('Déconnexion').click();
      await page.waitForURL(/\/login/, { timeout: 10000 });
    });
  });
});
