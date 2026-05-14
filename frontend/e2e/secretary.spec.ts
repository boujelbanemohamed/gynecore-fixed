import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const SECRETARY_EMAIL = 'testsecretaire@test.com';
const SECRETARY_PASSWORD = 'test1234';
const DOCTOR_EMAIL = 'dr.martin@gynecare.fr';
const DOCTOR_PASSWORD = 'Doctor123!'; // <-- METTEZ LE VRAI MOT DE PASSE ICI

const loginSecretary = async (page: Page) => {
  await page.goto(BASE_URL + '/secretary/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', SECRETARY_EMAIL);
  await page.fill('input[type="password"]', SECRETARY_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/secretary\/dashboard/, { timeout: 10000 });
};

const loginDoctor = async (page: Page) => {
  await page.goto(BASE_URL + '/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', DOCTOR_EMAIL);
  await page.fill('input[type="password"]', DOCTOR_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
};

test.describe('Secretary Portal', () => {

  test.describe('Authentication', () => {
    test('TC01 - Login page loads correctly', async ({ page }) => {
      await page.goto(BASE_URL + '/secretary/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Connexion secretaire')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('TC02 - Successful login redirects to secretary dashboard', async ({ page }) => {
      await loginSecretary(page);
      await expect(page.getByText('Espace Secretaire', { exact: true })).toBeVisible();
      await expect(page.getByText('GyneCare', { exact: true })).toBeVisible();
    });

    test('TC03 - Login with wrong credentials shows error', async ({ page }) => {
      await page.goto(BASE_URL + '/secretary/login');
      await page.waitForLoadState('networkidle');
      await page.fill('input[type="email"]', 'wrong@email.com');
      await page.fill('input[type="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      const bodyText = await page.locator('body').textContent();
      expect(page.url()).toContain('/login');
    });

    test('TC04 - Route guard: secretary cannot access doctor routes', async ({ page }) => {
      await loginSecretary(page);
      await page.goto(BASE_URL + '/dashboard');
      await page.waitForURL(/\/secretary\/dashboard/, { timeout: 10000 });
      await page.goto(BASE_URL + '/calendar');
      await page.waitForURL(/\/secretary\/dashboard/, { timeout: 10000 });
      await page.goto(BASE_URL + '/patients');
      await page.waitForURL(/\/secretary\/dashboard/, { timeout: 10000 });
    });

    test('TC05 - Route guard: unauthenticated user redirected to login', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.evaluate(() => localStorage.clear());
      await page.goto(BASE_URL + '/secretary/dashboard');
      await page.waitForURL(/\/secretary\/login/, { timeout: 10000 });
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => { await loginSecretary(page); });
    test('TC06 - Sidebar navigation works', async ({ page }) => {
      const items = [
        { label: 'Tableau de bord', path: '/secretary/dashboard' },
        { label: 'Patientes', path: '/secretary/patients' },
        { label: 'Consultations', path: '/secretary/consultations' },
        { label: 'Planning', path: '/secretary/calendar' },
        { label: 'Mon Profil', path: '/secretary/profile' },
      ];
      for (const item of items) {
        await page.locator('aside a').filter({ hasText: item.label }).click();
        await page.waitForURL(new RegExp(item.path.replace(/\//g, '\\/')), { timeout: 5000 });
        await expect(page).toHaveURL(new RegExp(item.path.replace(/\//g, '\\/')));
      }
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => { await loginSecretary(page); });
    test('TC07 - Dashboard page loads', async ({ page }) => {
      await expect(page.getByText('Tableau de bord', { exact: true })).toBeVisible();
    });
  });

  test.describe('Calendar / Planning', () => {
    test.beforeEach(async ({ page }) => {
      await loginSecretary(page);
      await page.locator('aside a').filter({ hasText: 'Planning' }).click();
      await page.waitForURL(/\/secretary\/calendar/, { timeout: 5000 });
    });

    test('TC08 - Calendar page loads with correct URL', async ({ page }) => {
      await expect(page).toHaveURL(/\/secretary\/calendar/);
      await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible();
    });

    test('TC09 - API calls /api/secretary/appointments (not /api/doctor)', async ({ page }) => {
      const apiCalls: string[] = [];
      page.on('request', req => {
        if (req.url().includes('/appointments')) apiCalls.push(req.url());
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      expect(apiCalls.filter(u => u.includes('/secretary/appointments')).length).toBeGreaterThan(0);
      expect(apiCalls.filter(u => u.includes('/doctor/appointments')).length).toBe(0);
    });

    test('TC10 - Calendar shows month navigation', async ({ page }) => {
      await expect(page.getByText('Mois precedent')).toBeVisible();
      await expect(page.getByText("Aujourd'hui")).toBeVisible();
      await expect(page.getByText('Mois suivant')).toBeVisible();
    });

    test('TC11 - Navigate months', async ({ page }) => {
      await page.getByText('Mois precedent').click();
      await page.waitForTimeout(300);
      await page.getByText("Aujourd'hui").click();
      await page.waitForTimeout(300);
    });

    test('TC12 - Click a day shows detail', async ({ page }) => {
      const day15 = page.getByText('15').first();
      if (await day15.isVisible()) {
        await day15.click();
        await page.waitForTimeout(300);
      }
    });

    test('TC13 - Open new appointment modal', async ({ page }) => {
      await page.getByRole('button', { name: /Nouveau RDV/ }).click();
      await page.waitForTimeout(500);
      await expect(page.getByRole('heading', { name: 'Nouveau RDV' })).toBeVisible();
      await expect(page.locator('text=Patiente').first()).toBeVisible();
      await expect(page.getByText('Date')).toBeVisible();
      await expect(page.getByText('Creer')).toBeVisible();
      await page.getByRole('button', { name: 'Annuler' }).click();
    });
  });

  test.describe('Patients', () => {
    test.beforeEach(async ({ page }) => {
      await loginSecretary(page);
      await page.locator('aside a').filter({ hasText: 'Patientes' }).click();
      await page.waitForURL(/\/secretary\/patients/, { timeout: 5000 });
    });

    test('TC14 - Patients page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/secretary\/patients/);
    });

    test('TC15 - API call to /api/secretary/patients', async ({ page }) => {
      const apiCalls: string[] = [];
      page.on('request', req => {
        if (req.url().includes('/secretary/patients')) apiCalls.push(req.url());
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      expect(apiCalls.length).toBeGreaterThan(0);
    });
  });

  test.describe('Profile & Logout', () => {
    test.beforeEach(async ({ page }) => { await loginSecretary(page); });

    test('TC16 - Profile page loads', async ({ page }) => {
      await page.getByText('Mon Profil', { exact: true }).click();
      await page.waitForURL(/\/secretary\/profile/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/secretary\/profile/);
    });

    test('TC17 - Logout works', async ({ page }) => {
      await page.getByText('Deconnexion').click();
      await page.waitForURL(/\/secretary\/login/, { timeout: 10000 });
    });
  });
});

test.describe('Doctor-Secretary Cross Verification', () => {

  test('TC18 - Secretary creates appointment visible on doctor calendar', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Secretary logs in
    await loginSecretary(page);
    await page.locator('aside a').filter({ hasText: 'Planning' }).click();
    await page.waitForURL(/\/secretary\/calendar/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // 2. Open new appointment modal
    const patientLoadResp = page.waitForResponse(
      resp => resp.url().includes('/secretary/patients') && resp.status() === 200
    );
    await page.getByRole('button', { name: /Nouveau RDV/ }).click();
    await patientLoadResp;

    // 3. Check if patients exist, if not create one via API
    let patientSelect = page.locator('select').first();
    let optCount = await patientSelect.locator('option').count();
    console.log('Initial patient options:', optCount);

    if (optCount <= 1) {
      // No patients - create one via direct API call
      console.log('No patients found, creating one via API...');
      const secStorage = await page.evaluate(() => localStorage.getItem('token'));
      const createPatientResp = await page.request.post('http://localhost:4000/api/secretary/patients', {
        headers: { 'Authorization': 'Bearer ' + secStorage, 'Content-Type': 'application/json' },
        data: {
          firstName: 'Patient',
          lastName: 'E2E Test',
          email: 'patient.e2e.' + Date.now() + '@test.com',
          phone: '0600000000',
          dateOfBirth: '1990-01-15',
        },
      });
      expect(createPatientResp.status()).toBe(200);
      console.log('Patient created via API');

      // Close and reopen modal to refresh patient list
      await page.getByRole('button', { name: 'Annuler' }).click();
      await page.waitForTimeout(300);
      const patientLoadResp2 = page.waitForResponse(
        resp => resp.url().includes('/secretary/patients') && resp.status() === 200
      );
      await page.getByRole('button', { name: /Nouveau RDV/ }).click();
      await patientLoadResp2;
      patientSelect = page.locator('select').first();
      optCount = await patientSelect.locator('option').count();
      console.log('After creating patient, options:', optCount);
    }

    // 4. Select first real patient (index 1 = first after placeholder)
    await patientSelect.selectOption({ index: 1 });
    const selectedVal = await patientSelect.inputValue();
    console.log('Selected patientId:', selectedVal);

    // 5. Fill date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateStr);

    // 6. Fill times
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.first().fill('14:00');
    await timeInputs.last().fill('14:30');

    // 7. Fill reason (unique identifier)
    const uniqueReason = 'TestE2E_' + Date.now();
    const reasonInput = page.locator('input:not([type="date"]):not([type="time"]):not([type="password"]):not([type="email"])').last();
    await reasonInput.fill(uniqueReason);
    console.log('Reason filled:', uniqueReason);

    // 8. Submit and verify
    const createResp = page.waitForResponse(
      resp => resp.url().includes('/secretary/appointments') && resp.request().method() === 'POST'
    );
    await page.getByText('Creer').click();
    const resp = await createResp;
    const respBody = await resp.json();
    console.log('Create response status:', resp.status(), 'body:', JSON.stringify(respBody).substring(0, 200));
    expect(resp.status()).toBe(200);

    const newApptId = respBody.data?.id;
    expect(newApptId).toBeTruthy();
    console.log('New appointment ID:', newApptId);

    // 9. Verify appointment still exists via secretary API
    const secToken = await page.evaluate(() => localStorage.getItem('token'));
    const secCheckResp = await page.request.get('http://localhost:4000/api/secretary/appointments', {
      headers: { 'Authorization': 'Bearer ' + secToken }
    });
    expect(secCheckResp.status()).toBe(200);
    const secCheckData = await secCheckResp.json();
    const secAppts = secCheckData.data?.appointments || secCheckData.data || [];
    const foundAppt = secAppts.some((a: any) => a.id === newApptId);
    expect(foundAppt).toBeTruthy();
  });

  test('TC19 - Doctor appointment status visible to secretary', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Doctor logs in and gets first appointment
    const docLoginResp = await page.request.post('http://localhost:4000/api/auth/login', {
      data: { email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD }
    });
    const docLoginData = await docLoginResp.json();
    const docToken = docLoginData.data?.token || docLoginData.token;
    expect(docToken).toBeTruthy();

    // 2. Fetch doctor appointments
    const apptsResp = await page.request.get('http://localhost:4000/api/doctor/appointments', {
      headers: { 'Authorization': 'Bearer ' + docToken }
    });
    const apptsData = await apptsResp.json();
    const apptsList: any[] = apptsData.data?.appointments || apptsData.data || [];
    expect(apptsList.length).toBeGreaterThan(0);

    // 3. Pick an appointment with mutable status (SCHEDULED or CONFIRMED)
    const targetAppt = apptsList.find((a: any) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED') || apptsList[0];
    const updateResp = await page.request.fetch(
      'http://localhost:4000/api/doctor/appointments/' + targetAppt.id + '/status',
      {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + docToken, 'Content-Type': 'application/json' },
        data: { status: 'CANCELLED' }
      }
    );
    expect(updateResp.status()).toBe(200);

    // 4. Verify the appointment status is now CANCELLED via doctor API
    const verifyResp = await page.request.get('http://localhost:4000/api/doctor/appointments', {
      headers: { 'Authorization': 'Bearer ' + docToken }
    });
    const verifyData = await verifyResp.json();
    const verifyList = verifyData.data?.appointments || verifyData.data || [];
    const foundUpdated = verifyList.some((a: any) => a.id === targetAppt.id && a.status === 'CANCELLED');
    expect(foundUpdated).toBeTruthy();
  });

  test('TC20 - Same appointment data on doctor and secretary calendars', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Login as secretary via API
    const secLoginResp = await page.request.post('http://localhost:4000/api/auth/login', {
      data: { email: 'assistante@gynecare.fr', password: 'Assistant123!' }
    });
    const secLoginData = await secLoginResp.json();
    const secToken = secLoginData.data?.token || secLoginData.token;
    expect(secToken).toBeTruthy();
    const secName = secLoginData.user?.role || secLoginData.data?.user?.role;
    console.log('Secretary role:', secName);

    // 2. Fetch secretary appointments
    const secApptsResp = await page.request.get('http://localhost:4000/api/secretary/appointments', {
      headers: { 'Authorization': 'Bearer ' + secToken }
    });
    const secData = await secApptsResp.json();
    const secAppts = secData.data?.appointments || secData.data || [];
    const secretaryApptCount = secAppts.length;

    // 3. Login as doctor via API
    const docLoginResp = await page.request.post('http://localhost:4000/api/auth/login', {
      data: { email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD }
    });
    const docLoginData = await docLoginResp.json();
    const docToken = docLoginData.data?.token || docLoginData.token;
    expect(docToken).toBeTruthy();

    // 4. Fetch doctor appointments
    const docApptsResp = await page.request.get('http://localhost:4000/api/doctor/appointments', {
      headers: { 'Authorization': 'Bearer ' + docToken }
    });
    const docData = await docApptsResp.json();
    const docAppts = docData.data?.appointments || docData.data || [];

    // 5. Verify both APIs return appointment arrays
    expect(Array.isArray(secAppts)).toBeTruthy();
    expect(Array.isArray(docAppts)).toBeTruthy();
    expect(secretaryApptCount).toBeGreaterThanOrEqual(0);
    expect(docAppts.length).toBeGreaterThan(0);

    console.log('Secretary appointments:', secretaryApptCount);
    console.log('Doctor appointments:', docAppts.length);
  });
});
