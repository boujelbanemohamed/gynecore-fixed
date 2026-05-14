import { By } from 'selenium-webdriver';
import { BASE, T, loginAs, hasText, urlHas, exists, runTests } from '../helpers.mjs';

export async function run(driver) {
  await loginAs(driver, 'doctor');
  await driver.get(BASE + '/dashboard');
  await driver.sleep(T.med);
  const tests = [
    { name: 'TC01 - Salutation "Bonjour"', fn: async (d) => hasText(d, By.css('h2'), 'Bonjour') },
    { name: 'TC02 - 4 cartes stats', fn: async (d) => { const c=await d.findElements(By.css('.stat-card')); return c.length===4?{pass:true}:{pass:false,error:`${c.length} cartes`}; }},
    { name: 'TC03 - "Total patientes"', fn: async (d) => hasText(d, By.css('.stats-grid'), 'Total patientes') },
    { name: 'TC04 - "RDV" visible', fn: async (d) => hasText(d, By.css('.stats-grid'), 'RDV') },
    { name: 'TC05 - "Consultations" visible', fn: async (d) => hasText(d, By.css('.stats-grid'), 'Consultations') },
    { name: 'TC06 - Stats numeriques', fn: async (d) => { const v=await d.findElements(By.css('.stat-value')); for(const e of v){const t=await e.getText();if(!t.trim().match(/\d+/))return{pass:false,error:`"${t}" non numerique`};} return{pass:true}; }},
    { name: 'TC07 - "Prochains rendez-vous"', fn: async (d) => hasText(d, By.css('.card-title'), 'Prochains rendez-vous') },
    { name: 'TC08 - "Actions rapides"', fn: async (d) => hasText(d, By.css('.card-title'), 'Actions rapides') },
    { name: 'TC09 - "Nouvelle patiente" -> /patients', fn: async (d) => { await d.findElement(By.xpath('//button[contains(text(),"Nouvelle patiente")]')).click(); return urlHas(d,'/patients'); }},
    { name: 'TC10 - "Nouvelle consultation" -> /consultations', fn: async (d) => { await d.get(BASE+'/dashboard'); await d.sleep(T.short); await d.findElement(By.xpath('//button[contains(text(),"Nouvelle consultation")]')).click(); return urlHas(d,'/consultations'); }},
    { name: 'TC11 - "Nouveau rendez-vous" -> /calendar', fn: async (d) => { await d.get(BASE+'/dashboard'); await d.sleep(T.short); await d.findElement(By.xpath('//button[contains(text(),"Nouveau rendez-vous")]')).click(); return urlHas(d,'/calendar'); }},
    { name: 'TC12 - Icones stats', fn: async (d) => { await d.get(BASE+'/dashboard'); await d.sleep(T.short); const i=await d.findElements(By.css('.stat-icon')); return i.length===4?{pass:true}:{pass:false,error:`${i.length} icones`}; }},
  ];
  return await runTests(driver, 'Doctor Dashboard', tests);
}
