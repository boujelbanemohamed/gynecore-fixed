import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEADLESS = process.env.HEADLESS === '1';
const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', BOLD = '\x1b[1m', RESET = '\x1b[0m';

let driver, totalPassed = 0, totalFailed = 0, failures = [];

async function createDriver() {
  const opts = new chrome.Options();
  if (HEADLESS) opts.addArguments('--headless=new');
  opts.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900', '--disable-notifications');
  driver = await new Builder().forBrowser('chrome').setChromeOptions(opts).build();
  driver.manage().setTimeouts({ implicit: 5000, pageLoad: 15000, script: 30000 });
  return driver;
}

const testFiles = [
  './tests/auth.test.mjs',
  './tests/doctor-nav.test.mjs',
  './tests/doctor-dash.test.mjs',
  './tests/doctor-patients.test.mjs',
  './tests/secretary.test.mjs',
  './tests/patient.test.mjs',
  './tests/cross-verify.test.mjs',
];

async function runSuite() {
  console.log(`\n${BOLD}GyneCare - Tests Selenium${RESET}`);
  console.log(`${YELLOW}Mode: ${HEADLESS ? 'Headless' : 'Navigateur visible'} | URL: http://localhost:3000${RESET}`);
  console.log('-'.repeat(60));
  driver = await createDriver();

  for (const fp of testFiles) {
    try {
      const mod = await import(path.resolve(__dirname, fp));
      if (mod.run) {
        const r = await mod.run(driver);
        totalPassed += r.passed;
        totalFailed += r.failed;
        if (r.failures) failures.push(...r.failures);
      }
    } catch (e) {
      console.log(`${RED}  Erreur ${path.basename(fp)}: ${e.message}${RESET}`);
      totalFailed++;
      failures.push({ file: path.basename(fp), error: e.message });
    }
  }

  try { await driver.quit(); } catch (e) {}
  console.log('\n' + '-'.repeat(60));
  console.log(`${BOLD}Resultats: ${GREEN}${totalPassed} OK${RESET} ${totalFailed > 0 ? RED + totalFailed + ' FAIL' + RESET : ''} (${totalPassed + totalFailed} total)`);
  if (totalFailed > 0) for (const f of failures) console.log(`  ${RED}-> ${f.test || f.file}: ${f.error}${RESET}`);
  console.log('-'.repeat(60));
  process.exit(totalFailed > 0 ? 1 : 0);
}

runSuite().catch(e => { console.error(RED + e.message + RESET); try { driver.quit(); } catch(x) {} process.exit(1); });
