import { By, until } from 'selenium-webdriver';

export const BASE = 'http://localhost:3000'\;
export const CREDS = {
  doctor: { email: 'dr.martin@gynecare.fr', password: 'Doctor123!' },
  secretary: { email: 'testsecretaire@test.com', password: 'test1234' },
  patient: { email: 'camille.bernard@email.fr', password: 'Patient123!' },
};
export const T = { short: 2000, med: 5000, long: 10000 };

export async function loginAs(driver, role) {
  const c = CREDS[role];
  const urls = { doctor: '/login', secretary: '/secretary/login', patient: '/patient/login' };
  const expects = { doctor: '/dashboard', secretary: '/secretary/dashboard', patient: '/patient/dashboard' };
  await driver.get(BASE + urls[role]);
  await driver.findElement(By.css('input[type="email"]')).sendKeys(c.email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(c.password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await driver.wait(until.urlContains(expects[role]), T.long);
}

export async function isVisible(driver, by, t = T.med) {
  try { await driver.wait(until.elementIsVisible(driver.findElement(by)), t); return { pass: true }; }
  catch (e) { return { pass: false, error: `Non visible: ${by} - ${e.message}` }; }
}

export async function hasText(driver, by, text, t = T.med) {
  try {
    const el = await driver.wait(until.elementLocated(by), t);
    const t2 = await el.getText();
    return t2.includes(text) ? { pass: true } : { pass: false, error: `"${text}" non trouve dans "${t2.substring(0,100)}"` };
  } catch (e) { return { pass: false, error: `Element non trouve: ${by}` }; }
}

export async function urlHas(driver, s, t = T.med) {
  try { await driver.wait(until.urlContains(s), t); return { pass: true }; }
  catch (e) { return { pass: false, error: `URL ne contient pas "${s}". Actuelle: ${await driver.getCurrentUrl()}` }; }
}

export async function exists(driver, by) {
  try { return (await driver.findElements(by)).length > 0; } catch { return false; }
}

export async function runTests(driver, name, tests) {
  const G = '\x1b[32m', R = '\x1b[31m', C = '\x1b[36m', B = '\x1b[1m', X = '\x1b[0m';
  console.log(`\n${C}${B}  ${name}${X}`);
  let passed = 0, failed = 0; const fails = [];
  for (const t of tests) {
    try {
      const r = await t.fn(driver);
      if (r.pass) { console.log(`  ${G}v${X} ${t.name}`); passed++; }
      else { console.log(`  ${R}x${X} ${t.name}`); console.log(`    ${R}-> ${r.error}${X}`); failed++; fails.push({ test: t.name, ...r }); }
    } catch (e) { console.log(`  ${R}x${X} ${t.name}`); console.log(`    ${R}-> ${e.message}${X}`); failed++; fails.push({ test: t.name, error: e.message }); }
  }
  console.log(`  ${name}: ${G}${passed} OK${X}${failed > 0 ? ' ' + R + failed + ' FAIL' + X : ''}`);
  return { passed, failed, failures: fails };
}
