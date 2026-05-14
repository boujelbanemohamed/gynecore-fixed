import { By } from 'selenium-webdriver';
import { BASE, T, loginAs, hasText, urlHas, exists, runTests } from '../helpers.mjs';

export async function run(driver) {
  await loginAs(driver, 'secretary');
  const tests = [
    { name: 'TC01 - Dashboard secretaire', fn: async (d) => { const t=await d.findElement(By.tagName('body')).getText(); return(t.includes('Secretaire')||t.includes('secretariat'))?{pass:true}:{pass:false,error:'Dashboard non charge'}; }},
    { name: 'TC02 - Nav vers Planning', fn: async (d) => { const links=await d.findElements(By.css('aside a')); for(const l of links){const t=await l.getText();if(t.includes('Planning')){await l.click();return urlHas(d,'/secretary/calendar');}} await d.get(BASE+'/secretary/calendar'); return urlHas(d,'/secretary/calendar'); }},
    { name: 'TC03 - Planning affiche', fn: async (d) => { await d.get(BASE+'/secretary/calendar'); await d.sleep(T.med); const t=await d.findElement(By.tagName('body')).getText(); return t.includes('Planning')?{pass:true}:{pass:false,error:'Planning non affiche'}; }},
    { name: 'TC04 - Boutons nav planning', fn: async (d) => { await d.get(BASE+'/secretary/calendar'); await d.sleep(T.med); const t=await d.findElement(By.tagName('body')).getText(); const p=t.includes('Mois precedent'); const a=t.includes("Aujourd'hui"); const n=t.includes('Mois suivant'); return(p&&a&&n)?{pass:true}:{pass:false,error:`prev=${p} today=${a} next=${n}`}; }},
    { name: 'TC05 - Navigation mois', fn: async (d) => { await d.get(BASE+'/secretary/calendar'); await d.sleep(T.med); await d.findElement(By.xpath('//button[contains(text(),"Mois precedent")]')).click(); await d.sleep(T.short); await d.findElement(By.xpath(`//button[contains(text(),"Aujourd'hui")]`)).click(); await d.sleep(T.short); return{pass:true}; }},
    { name: 'TC06 - Modal nouveau RDV', fn: async (d) => { await d.get(BASE+'/secretary/calendar'); await d.sleep(T.med); const btn=await d.findElement(By.xpath('//button[contains(text(),"Nouveau RDV")]')); await btn.click(); await d.sleep(T.short); const m=await exists(d,By.css('.modal-overlay')); try{if(m)await d.findElement(By.xpath('//button[contains(text(),"Annuler")]')).click();}catch(e){} return m?{pass:true}:{pass:false,error:'Modal non ouvert'}; }},
    { name: 'TC07 - Nav vers Patientes', fn: async (d) => { const links=await d.findElements(By.css('aside a')); for(const l of links){const t=await l.getText();if(t.includes('Patiente')){await l.click();return urlHas(d,'/secretary/patients');}} await d.get(BASE+'/secretary/patients'); return urlHas(d,'/secretary/patients'); }},
    { name: 'TC08 - Page patientes charge', fn: async (d) => { await d.get(BASE+'/secretary/patients'); await d.sleep(T.med); const u=await d.getCurrentUrl(); return u.includes('/secretary/patients')?{pass:true}:{pass:false,error:u}; }},
    { name: 'TC09 - Logout secretaire', fn: async (d) => { await d.get(BASE+'/secretary/dashboard'); await d.sleep(T.short); await d.findElement(By.xpath('//button[contains(text(),"Deconnexion") or contains(text(),"deconnexion")]')).click(); return urlHas(d,'/secretary/login'); }},
    { name: 'TC10 - Route guard secretaire', fn: async (d) => { await loginAs(d,'secretary'); await d.get(BASE+'/dashboard'); await d.sleep(T.short); return urlHas(d,'/secretary/dashboard'); }},
  ];
  return await runTests(driver, 'Secretary Portal', tests);
}
