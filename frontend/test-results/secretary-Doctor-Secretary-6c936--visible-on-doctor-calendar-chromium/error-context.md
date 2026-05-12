# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: secretary.spec.ts >> Doctor-Secretary Cross Verification >> TC18 - Secretary creates appointment visible on doctor calendar
- Location: e2e/secretary.spec.ts:193:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 400
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: GyneCare
      - generic [ref=e7]: Espace Secretaire
    - navigation [ref=e8]:
      - link "Tableau de bord" [ref=e9] [cursor=pointer]:
        - /url: /secretary/dashboard
      - link "Patientes" [ref=e10] [cursor=pointer]:
        - /url: /secretary/patients
      - link "Consultations" [ref=e11] [cursor=pointer]:
        - /url: /secretary/consultations
      - link "Planning" [ref=e12] [cursor=pointer]:
        - /url: /secretary/calendar
      - link "Mon Profil" [ref=e13] [cursor=pointer]:
        - /url: /secretary/profile
    - generic [ref=e14]:
      - generic [ref=e15]: test prenom test nom
      - button "Deconnexion" [ref=e16] [cursor=pointer]
  - main [ref=e17]:
    - generic [ref=e18]:
      - heading "GyneCare - Secretariat" [level=2] [ref=e19]
      - generic [ref=e20]: mardi 12 mai 2026
    - generic [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]:
          - heading "Planning" [level=2] [ref=e25]
          - paragraph [ref=e26]: mai 2026
        - generic [ref=e27]:
          - button "Mois precedent" [ref=e28] [cursor=pointer]
          - button "Aujourd'hui" [ref=e29] [cursor=pointer]
          - button "Mois suivant" [ref=e30] [cursor=pointer]
          - button "+ Nouveau RDV" [ref=e31] [cursor=pointer]
      - generic [ref=e32]:
        - generic [ref=e34]:
          - generic [ref=e35]: Lun
          - generic [ref=e36]: Mar
          - generic [ref=e37]: Mer
          - generic [ref=e38]: Jeu
          - generic [ref=e39]: Ven
          - generic [ref=e40]: Sam
          - generic [ref=e41]: Dim
          - generic [ref=e43] [cursor=pointer]: "27"
          - generic [ref=e45] [cursor=pointer]: "28"
          - generic [ref=e47] [cursor=pointer]: "29"
          - generic [ref=e49] [cursor=pointer]: "30"
          - generic [ref=e51] [cursor=pointer]: "1"
          - generic [ref=e53] [cursor=pointer]: "2"
          - generic [ref=e55] [cursor=pointer]: "3"
          - generic [ref=e57] [cursor=pointer]: "4"
          - generic [ref=e59] [cursor=pointer]: "5"
          - generic [ref=e61] [cursor=pointer]: "6"
          - generic [ref=e63] [cursor=pointer]: "7"
          - generic [ref=e64] [cursor=pointer]:
            - generic [ref=e65]: "8"
            - generic [ref=e66]: 09:00 Camille
            - generic [ref=e67]: 09:00 Camille
            - generic [ref=e68]: 13:00 Camille
            - generic [ref=e69]: "+1"
          - generic [ref=e70] [cursor=pointer]:
            - generic [ref=e71]: "9"
            - generic [ref=e72]: 11:20 Camille
            - generic [ref=e73]: 18:51 Camille
          - generic [ref=e75] [cursor=pointer]: "10"
          - generic [ref=e76] [cursor=pointer]:
            - generic [ref=e77]: "11"
            - generic [ref=e78]: 21:13 Léa
          - generic [ref=e79] [cursor=pointer]:
            - generic [ref=e80]: "12"
            - generic [ref=e81]: 11:20 Léa
            - generic [ref=e82]: 18:51 Léa
          - generic [ref=e84] [cursor=pointer]: "13"
          - generic [ref=e86] [cursor=pointer]: "14"
          - generic [ref=e88] [cursor=pointer]: "15"
          - generic [ref=e90] [cursor=pointer]: "16"
          - generic [ref=e92] [cursor=pointer]: "17"
          - generic [ref=e94] [cursor=pointer]: "18"
          - generic [ref=e96] [cursor=pointer]: "19"
          - generic [ref=e98] [cursor=pointer]: "20"
          - generic [ref=e100] [cursor=pointer]: "21"
          - generic [ref=e102] [cursor=pointer]: "22"
          - generic [ref=e104] [cursor=pointer]: "23"
          - generic [ref=e106] [cursor=pointer]: "24"
          - generic [ref=e108] [cursor=pointer]: "25"
          - generic [ref=e110] [cursor=pointer]: "26"
          - generic [ref=e112] [cursor=pointer]: "27"
          - generic [ref=e114] [cursor=pointer]: "28"
          - generic [ref=e116] [cursor=pointer]: "29"
          - generic [ref=e118] [cursor=pointer]: "30"
          - generic [ref=e120] [cursor=pointer]: "31"
        - generic [ref=e121]:
          - heading "mardi 12 mai" [level=4] [ref=e122]
          - generic [ref=e123] [cursor=pointer]:
            - generic [ref=e124]: 11:20 - 12:05
            - generic [ref=e125]: Léa Moreau
            - generic [ref=e126]: Suivi
            - combobox [ref=e127]:
              - option "Planifie"
              - option "Confirme" [selected]
              - option "En attente"
              - option "Arrive"
              - option "En consultation"
              - option "Termine"
              - option "Annule"
              - option "Reporte"
              - option "Absent"
          - generic [ref=e128] [cursor=pointer]:
            - generic [ref=e129]: 18:51 - 19:36
            - generic [ref=e130]: Léa Moreau
            - generic [ref=e131]: Suivi
            - combobox [ref=e132]:
              - option "Planifie" [selected]
              - option "Confirme"
              - option "En attente"
              - option "Arrive"
              - option "En consultation"
              - option "Termine"
              - option "Annule"
              - option "Reporte"
              - option "Absent"
      - generic [ref=e134]:
        - heading "Nouveau RDV" [level=3] [ref=e135]
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]: Patiente
            - combobox [ref=e139]:
              - option "-- Choisir --" [selected]
              - option "Test Prénom Test Nom"
              - option "test test"
              - option "test prénom test Nom"
              - option "Léa Moreau"
              - option "Camille Bernard"
          - generic [ref=e140]:
            - generic [ref=e141]:
              - generic [ref=e142]: Date
              - textbox [ref=e143]: 2026-05-13
            - generic [ref=e144]:
              - generic [ref=e145]: Debut
              - textbox [ref=e146]: 14:00
            - generic [ref=e147]:
              - generic [ref=e148]: Fin
              - textbox [ref=e149]: 14:30
          - generic [ref=e150]:
            - generic [ref=e151]:
              - generic [ref=e152]: Type
              - combobox [ref=e153]:
                - option "Premiere visite" [selected]
                - option "Suivi"
                - option "Urgence"
                - option "Bilan annuel"
                - option "Prenatal"
                - option "Postnatal"
            - generic [ref=e154]:
              - generic [ref=e155]: Statut
              - combobox [ref=e156]:
                - option "Planifie" [selected]
                - option "Confirme"
                - option "En attente"
                - option "Arrive"
                - option "En consultation"
                - option "Termine"
                - option "Annule"
                - option "Reporte"
                - option "Absent"
          - generic [ref=e157]:
            - generic [ref=e158]: Motif
            - textbox [ref=e159]: TestE2E_1778581768179
          - generic [ref=e160]:
            - generic [ref=e161]: Notes
            - textbox [ref=e162]
        - generic [ref=e164]:
          - button "Annuler" [ref=e165] [cursor=pointer]
          - button "Creer" [active] [ref=e166] [cursor=pointer]
```

# Test source

```ts
  174 | 
  175 |   test.describe('Profile & Logout', () => {
  176 |     test.beforeEach(async ({ page }) => { await loginSecretary(page); });
  177 | 
  178 |     test('TC16 - Profile page loads', async ({ page }) => {
  179 |       await page.getByText('Mon Profil', { exact: true }).click();
  180 |       await page.waitForURL(/\/secretary\/profile/, { timeout: 5000 });
  181 |       await expect(page).toHaveURL(/\/secretary\/profile/);
  182 |     });
  183 | 
  184 |     test('TC17 - Logout works', async ({ page }) => {
  185 |       await page.getByText('Deconnexion').click();
  186 |       await page.waitForURL(/\/secretary\/login/, { timeout: 10000 });
  187 |     });
  188 |   });
  189 | });
  190 | 
  191 | test.describe('Doctor-Secretary Cross Verification', () => {
  192 | 
  193 |   test('TC18 - Secretary creates appointment visible on doctor calendar', async ({ page }) => {
  194 |     test.setTimeout(90000);
  195 | 
  196 |     // 1. Secretary logs in
  197 |     await loginSecretary(page);
  198 |     await page.locator('aside a').filter({ hasText: 'Planning' }).click();
  199 |     await page.waitForURL(/\/secretary\/calendar/, { timeout: 5000 });
  200 |     await page.waitForLoadState('networkidle');
  201 | 
  202 |     // 2. Open new appointment modal
  203 |     const patientLoadResp = page.waitForResponse(
  204 |       resp => resp.url().includes('/secretary/patients') && resp.status() === 200
  205 |     );
  206 |     await page.getByRole('button', { name: /Nouveau RDV/ }).click();
  207 |     await patientLoadResp;
  208 | 
  209 |     // 3. Check if patients exist, if not create one via API
  210 |     let patientSelect = page.locator('select').first();
  211 |     let optCount = await patientSelect.locator('option').count();
  212 |     console.log('Initial patient options:', optCount);
  213 | 
  214 |     if (optCount <= 1) {
  215 |       // No patients - create one via direct API call
  216 |       console.log('No patients found, creating one via API...');
  217 |       const secStorage = await page.evaluate(() => localStorage.getItem('token'));
  218 |       const createPatientResp = await page.request.post('http://localhost:4000/api/secretary/patients', {
  219 |         headers: { 'Authorization': 'Bearer ' + secStorage, 'Content-Type': 'application/json' },
  220 |         data: {
  221 |           firstName: 'Patient',
  222 |           lastName: 'E2E Test',
  223 |           email: 'patient.e2e.' + Date.now() + '@test.com',
  224 |           phone: '0600000000',
  225 |           dateOfBirth: '1990-01-15',
  226 |         },
  227 |       });
  228 |       expect(createPatientResp.status()).toBe(200);
  229 |       console.log('Patient created via API');
  230 | 
  231 |       // Close and reopen modal to refresh patient list
  232 |       await page.getByRole('button', { name: 'Annuler' }).click();
  233 |       await page.waitForTimeout(300);
  234 |       const patientLoadResp2 = page.waitForResponse(
  235 |         resp => resp.url().includes('/secretary/patients') && resp.status() === 200
  236 |       );
  237 |       await page.getByRole('button', { name: /Nouveau RDV/ }).click();
  238 |       await patientLoadResp2;
  239 |       patientSelect = page.locator('select').first();
  240 |       optCount = await patientSelect.locator('option').count();
  241 |       console.log('After creating patient, options:', optCount);
  242 |     }
  243 | 
  244 |     // 4. Select first real patient (index 1 = first after placeholder)
  245 |     await patientSelect.selectOption({ index: 1 });
  246 |     const selectedVal = await patientSelect.inputValue();
  247 |     console.log('Selected patientId:', selectedVal);
  248 | 
  249 |     // 5. Fill date (tomorrow)
  250 |     const tomorrow = new Date();
  251 |     tomorrow.setDate(tomorrow.getDate() + 1);
  252 |     const dateStr = tomorrow.toISOString().split('T')[0];
  253 |     await page.locator('input[type="date"]').fill(dateStr);
  254 | 
  255 |     // 6. Fill times
  256 |     const timeInputs = page.locator('input[type="time"]');
  257 |     await timeInputs.first().fill('14:00');
  258 |     await timeInputs.last().fill('14:30');
  259 | 
  260 |     // 7. Fill reason (unique identifier)
  261 |     const uniqueReason = 'TestE2E_' + Date.now();
  262 |     const reasonInput = page.locator('input:not([type="date"]):not([type="time"]):not([type="password"]):not([type="email"])').last();
  263 |     await reasonInput.fill(uniqueReason);
  264 |     console.log('Reason filled:', uniqueReason);
  265 | 
  266 |     // 8. Submit and verify
  267 |     const createResp = page.waitForResponse(
  268 |       resp => resp.url().includes('/secretary/appointments') && resp.request().method() === 'POST'
  269 |     );
  270 |     await page.getByText('Creer').click();
  271 |     const resp = await createResp;
  272 |     const respBody = await resp.json();
  273 |     console.log('Create response status:', resp.status(), 'body:', JSON.stringify(respBody).substring(0, 200));
> 274 |     expect(resp.status()).toBe(200);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  275 | 
  276 |     const newApptId = respBody.data?.id;
  277 |     expect(newApptId).toBeTruthy();
  278 |     console.log('New appointment ID:', newApptId);
  279 | 
  280 |     // 9. Logout secretary
  281 |     await page.getByText('Deconnexion').click();
  282 |     await page.waitForURL(/\/secretary\/login/, { timeout: 10000 });
  283 | 
  284 |     // 10. Login as doctor
  285 |     await page.evaluate(() => localStorage.clear());
  286 |     await loginDoctor(page);
  287 | 
  288 |     // 11. Go to doctor calendar
  289 |     await page.locator('aside a').filter({ hasText: 'Planning' }).click();
  290 |     await page.waitForURL(/\/calendar/, { timeout: 5000 });
  291 |     await page.waitForLoadState('networkidle');
  292 |     await page.waitForTimeout(1500);
  293 | 
  294 |     // 12. Verify appointment appears on doctor's calendar
  295 |     const pageText = await page.locator('body').textContent();
  296 |     expect(pageText).toContain('14:00');
  297 |   });
  298 | 
  299 |   test('TC19 - Doctor appointment status visible to secretary', async ({ page }) => {
  300 |     test.setTimeout(60000);
  301 | 
  302 |     // 1. Medecin se connecte et change le statut d'un RDV
  303 |     await loginDoctor(page);
  304 |     await page.locator('aside a').filter({ hasText: 'Planning' }).click();
  305 |     await page.waitForURL(/\/calendar/, { timeout: 5000 });
  306 |     await page.waitForLoadState('networkidle');
  307 |     await page.waitForTimeout(1000);
  308 | 
  309 |     // Cliquer sur un jour avec RDV
  310 |     const dayWithAppt = page.locator('text=8').first();
  311 |     await dayWithAppt.click();
  312 |     await page.waitForTimeout(500);
  313 | 
  314 |     // Chercher un select de statut
  315 |     const statusSelect = page.locator('select').first();
  316 |     if (await statusSelect.isVisible()) {
  317 |       await statusSelect.selectOption('COMPLETED');
  318 |       await page.waitForTimeout(1000);
  319 |     }
  320 | 
  321 |     // 2. Deconnecter le medecin
  322 |     await page.evaluate(() => localStorage.clear());
  323 |     await page.goto(BASE_URL + '/secretary/login');
  324 |     await loginSecretary(page);
  325 | 
  326 |     // 3. Aller au planning secretaire
  327 |     await page.locator('aside a').filter({ hasText: 'Planning' }).click();
  328 |     await page.waitForURL(/\/secretary\/calendar/, { timeout: 5000 });
  329 |     await page.waitForLoadState('networkidle');
  330 |     await page.waitForTimeout(1000);
  331 | 
  332 |     // 4. Verifier le statut est synchronise
  333 |     await dayWithAppt.click();
  334 |     await page.waitForTimeout(500);
  335 |     const pageText = await page.locator('body').textContent();
  336 |     expect(pageText).toContain('Termine');
  337 |   });
  338 | 
  339 |   test('TC20 - Same appointment data on doctor and secretary calendars', async ({ page }) => {
  340 |     test.setTimeout(60000);
  341 | 
  342 |     // 1. Recuperer les RDV via secretaire
  343 |     await loginSecretary(page);
  344 |     await page.locator('aside a').filter({ hasText: 'Planning' }).click();
  345 |     await page.waitForURL(/\/secretary\/calendar/, { timeout: 5000 });
  346 | 
  347 |     let secretaryApptCount = 0;
  348 |     const secResp = page.waitForResponse(
  349 |       resp => resp.url().includes('/secretary/appointments') && resp.request().method() === 'GET'
  350 |     );
  351 |     await page.reload();
  352 |     const secResponse = await secResp;
  353 |     const secData = await secResponse.json();
  354 |     const secAppts = secData.data?.appointments || [];
  355 |     secretaryApptCount = secAppts.length;
  356 | 
  357 |     // 2. Deconnecter, connecter medecin
  358 |     await page.evaluate(() => localStorage.clear());
  359 |     await page.goto(BASE_URL + '/login');
  360 |     await loginDoctor(page);
  361 | 
  362 |     // 3. Recuperer les RDV via medecin
  363 |     await page.locator('aside a').filter({ hasText: 'Planning' }).click();
  364 |     await page.waitForURL(/\/calendar/, { timeout: 5000 });
  365 | 
  366 |     const docResp = page.waitForResponse(
  367 |       resp => resp.url().includes('/appointments') && resp.request().method() === 'GET'
  368 |     );
  369 |     await page.reload();
  370 |     const docResponse = await docResp;
  371 |     const docData = await docResponse.json();
  372 |     const docAppts = docData.data?.appointments || [];
  373 | 
  374 |     // 4. Verifier que le nombre de RDV est le meme
```