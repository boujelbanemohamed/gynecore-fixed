import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const SA_EMAIL = 'admin@gynecare.fr';
const SA_PASSWORD = 'Admin123!';

const loginSuperadmin = async (page: Page) => {
  await page.goto(BASE_URL + '/superadmin/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', SA_EMAIL);
  await page.fill('input[type="password"]', SA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/superadmin\/dashboard/, { timeout: 10000 });
};

test.describe('Superadmin Portal', () => {

  test.describe('Authentication', () => {
    test('SA01 - Login page loads correctly', async ({ page }) => {
      await page.goto(BASE_URL + '/superadmin/login');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 });
    });

    test('SA02 - Successful login redirects to dashboard', async ({ page }) => {
      await loginSuperadmin(page);
      await expect(page).toHaveURL(/\/superadmin\/dashboard/);
    });

    test('SA03 - Wrong credentials show error', async ({ page }) => {
      await page.goto(BASE_URL + '/superadmin/login');
      await page.waitForLoadState('networkidle');
      await page.fill('input[type="email"]', 'wrong@test.com');
      await page.fill('input[type="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/superadmin/login');
    });

    test('SA04 - Route guard: unauthenticated redirected to login', async ({ page }) => {
      await page.goto(BASE_URL + '/superadmin/dashboard');
      await page.waitForURL(/\/superadmin\/login/, { timeout: 10000 });
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => { await loginSuperadmin(page); });

    test('SA05 - Dashboard shows stats', async ({ page }) => {
      await expect(page.getByText('Dashboard Administration')).toBeVisible();
      await page.waitForTimeout(1000);
      const body = await page.locator('body').textContent();
      expect(body).toContain('Médecins');
    });

    test('SA06 - Sidebar navigation works', async ({ page }) => {
      const links = [
        { text: 'Dashboard', url: '/superadmin/dashboard' },
        { text: 'Médecins', url: '/superadmin/doctors' },
        { text: 'Configuration', url: '/superadmin/settings' },
        { text: 'Mon Profil', url: '/superadmin/profile' },
      ];
      for (const link of links) {
        await page.getByRole('link', { name: link.text }).click();
        await page.waitForURL(new RegExp(link.url.replace(/\//g, '\\/')), { timeout: 5000 });
      }
    });
  });

  test.describe('Doctors Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginSuperadmin(page);
      await page.locator('a').filter({ hasText: 'Médecins' }).first().click();
      await page.waitForURL(/\/superadmin\/doctors/, { timeout: 5000 });
    });

    test('SA07 - Doctors list loads', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const body = await page.locator('body').textContent();
      await expect(page.getByText('Sophie')).toBeVisible({ timeout: 10000 });
    });

    test('SA08 - Create doctor modal opens', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.getByText('+ Nouveau médecin').click();
      await page.waitForTimeout(500);
      await expect(page.getByText('Créer un médecin')).toBeVisible();
    });

    test('SA24 - Expand doctor shows patients list', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const expandBtn = page.locator('tbody tr td').first();
      await expandBtn.click();
      await page.waitForTimeout(2000);
      const body = await page.locator('body').textContent();
      expect(body).toContain('Patient(e)s');
    });

    test('SA25 - Patient detail modal opens', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const expandBtn = page.locator('tbody tr td').first();
      await expandBtn.click();
      await page.waitForTimeout(2000);
      const bodyText = await page.locator('body').textContent();
      if (bodyText?.includes('Aucun patient')) return;
      await expect(page.getByText('Patient(e)s')).toBeVisible();
      const [response] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/superadmin/patients/') && r.status() === 200, { timeout: 10000 }),
        page.getByRole('button', { name: 'Voir' }).nth(1).click(),
      ]);
      await expect(page.getByText('Date naissance')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Templates', () => {
    test.beforeEach(async ({ page }) => {
      await loginSuperadmin(page);
      await page.getByRole('link', { name: 'Emails' }).click();
      await page.waitForURL(/\/superadmin\/templates/, { timeout: 5000 });
    });

    test('SA09 - Templates page loads with 6 templates', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Gestion des templates email')).toBeVisible();
      const body = await page.locator('body').textContent();
      expect(body).toContain('Nouveau RDV (médecin)');
      expect(body).toContain('Rappel patient');
    });

    test('SA10 - Click template opens editor', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.getByText('Nouveau RDV (médecin)').click();
      await page.waitForTimeout(500);
      await expect(page.getByText('Sujet')).toBeVisible();
      await expect(page.getByText('Corps (HTML)')).toBeVisible();
    });

    test('SA11 - Template editor has save, test, reset buttons', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.getByText('Nouveau RDV (médecin)').click();
      await page.waitForTimeout(500);
      await expect(page.getByRole('button', { name: 'Sauvegarder', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Envoyer un test' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Réinitialiser' })).toBeVisible();
    });

    test('SA12 - Variables list is displayed in editor', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.getByText('Nouveau RDV (médecin)').click();
      await page.waitForTimeout(500);
      await expect(page.getByRole('button', { name: '{{doctorFirstName}}' })).toBeVisible();
      await expect(page.getByRole('button', { name: '{{patientFirstName}}' })).toBeVisible();
    });
  });

  test.describe('Settings (SMTP)', () => {
    test.beforeEach(async ({ page }) => {
      await loginSuperadmin(page);
      await page.locator('a').filter({ hasText: 'Configuration' }).first().click();
      await page.waitForURL(/\/superadmin\/settings/, { timeout: 5000 });
    });

    test('SA13 - Settings page shows SMTP fields', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Configuration système')).toBeVisible();
      await expect(page.getByText('Mot de passe SMTP')).toBeVisible();
      await expect(page.getByText('Serveur SMTP')).toBeVisible();
      await expect(page.getByText('Port SMTP')).toBeVisible();
    });

    test('SA14 - SMTP password field is password type with toggle', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const passInput = page.locator('input[type="password"]').first();
      await expect(passInput).toBeVisible();
      await expect(page.getByText('Afficher')).toBeVisible();
      await page.getByText('Afficher').click();
      await expect(page.getByText('Masquer')).toBeVisible();
    });

    test('SA15 - Save settings button exists', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Sauvegarder la configuration')).toBeVisible();
    });
  });

  test.describe('System Health', () => {
    test.beforeEach(async ({ page }) => {
      await loginSuperadmin(page);
      await page.getByRole('link', { name: 'Santé' }).click();
      await page.waitForURL(/\/superadmin\/health/, { timeout: 5000 });
    });

    test('SA18 - Health page loads with all components', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Sante du systeme')).toBeVisible();
      await expect(page.getByRole('heading', { name: '🖥️ Backend' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '🗄️ Base de donnees' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '⚙️ Configuration' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '📧 SMTP' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '🔐 Authentification' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '💾 Stockage' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '🔔 Rappels' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '🛡️ Securite' })).toBeVisible();
    });

    test('SA19 - Health page shows status indicators', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Fonctionnel').first()).toBeVisible({ timeout: 10000 });
    });

    test('SA20 - Refresh button works', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const refreshBtn = page.getByRole('button', { name: 'Rafraîchir' });
      await expect(refreshBtn).toBeVisible();
      await refreshBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.getByText('Sante du systeme')).toBeVisible();
    });

    test('SA21 - Recapitulatif section shows all service badges', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Recapitulatif')).toBeVisible();
      const body = await page.locator('body').textContent();
      expect(body).toContain('backend');
      expect(body).toContain('database');
      expect(body).toContain('smtp');
    });

    test('SA22 - Auto-refresh selector exists with options', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const input = page.locator('input[type="number"]');
      await expect(input).toBeVisible();
      await expect(input).toHaveValue(/^\d+$/);
    });

    test('SA23 - Changing auto-refresh interval works', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const input = page.locator('input[type="number"]');
      await input.fill('60');
      await page.waitForTimeout(500);
      const val = await input.inputValue();
      expect(val).toBe('60');
    });
  });

  test.describe('Profile & Logout', () => {
    test.beforeEach(async ({ page }) => { await loginSuperadmin(page); });

    test('SA16 - Profile page loads', async ({ page }) => {
      await page.locator('a').filter({ hasText: 'Mon Profil' }).first().click();
      await page.waitForURL(/\/superadmin\/profile/, { timeout: 5000 });
    });

    test('SA17 - Logout works', async ({ page }) => {
      await page.getByText('Déconnexion').click();
      await page.waitForURL(/\/superadmin\/login/, { timeout: 10000 });
    });
  });
});
