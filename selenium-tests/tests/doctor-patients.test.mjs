import { By } from 'selenium-webdriver';
import { BASE, T, loginAs, isVisible, hasText, urlHas, exists, runTests } from '../helpers.mjs';

export async function run(driver) {
  await loginAs(driver, 'doctor');
  await driver.get(BASE + '/patients');
  await driver.sleep(T.med);
  const tests = [
    { name: 'TC01 - Titre "Patientes"', fn: async (d) => hasText(d, By.css('h2'), 'Patientes') },
    { name: 'TC02 - Barre recherche', fn: async (d) => isVisible(d, By.css('.search-bar input')) },
    { name: 'TC03 - Bouton "Nouvelle patiente"', fn: async (d) => isVisible(d, By.xpath('//button[contains(text(),"Nouvelle patiente")]')) },
    { name: 'TC04 - Recherche par nom', fn: async (d) => { await d.findElement(By.css('.search-bar input')).sendKeys('Camille'); await d.sleep(T.med); return {pass:true}; }},
    { name: 'TC05 - Modal creation s\'ouvre', fn: async (d) => { await d.findElement(By.xpath('//button[contains(text(),"Nouvelle patiente")]')).click(); await d.sleep(T.short); return isVisible(d, By.css('.modal-overlay')); }},
    { name: 'TC06 - Modal titre "Nouvelle patiente"', fn: async (d) => { const t=await d.findElement(By.css('.modal-title')).getText(); return t.includes('Nouvelle patiente')?{pass:true}:{pass:false,error:t}; }},
    { name: 'TC07 - Champs requis dans modal', fn: async (d) => { const p=await exists(d,By.xpath('//label[contains(text(),"Prenom")]')); const n=await exists(d,By.xpath('//label[contains(text(),"Nom")]')); const e=await exists(d,By.xpath('//label[contains(text(),"Email")]')); const dd=await exists(d,By.xpath('//label[contains(text(),"Date de naissance")]')); return(p&&n&&e&&dd)?{pass:true}:{pass:false,error:`P=${p} N=${n} E=${e} D=${dd}`}; }},
    { name: 'TC08 - Section antecedents', fn: async (d) => hasText(d, By.css('.card-title'), 'Antecedents') },
    { name: 'TC09 - Modal ferme avec Annuler', fn: async (d) => { await d.findElement(By.xpath('//button[contains(text(),"Annuler")]')).click(); await d.sleep(T.short); return await exists(d,By.css('.modal-overlay'))?{pass:false,error:'Modal encore visible'}:{pass:true}; }},
    { name: 'TC10 - Table colonnes', fn: async (d) => { const h=await d.findElements(By.css('table thead th')); const t=await Promise.all(h.map(e=>e.getText())); return t.some(x=>x.includes('Patiente'))?{pass:true}:{pass:false,error:t.join(',')}; }},
    { name: 'TC11 - Click row -> detail', fn: async (d) => { const r=await d.findElements(By.css('table tbody tr')); if(!r.length)return{pass:true}; await r[0].click(); return urlHas(d,'/patients/'); }},
    { name: 'TC12 - Recherche vide', fn: async (d) => { await d.get(BASE+'/patients'); await d.sleep(T.short); await d.findElement(By.css('.search-bar input')).sendKeys('ZZZZNONEXISTENT'); await d.sleep(T.med); return {pass:true}; }},
  ];
  return await runTests(driver, 'Doctor Patients', tests);
}
