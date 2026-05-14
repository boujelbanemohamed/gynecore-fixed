import { By } from 'selenium-webdriver';
import { BASE, T, loginAs, isVisible, hasText, urlHas, exists, runTests } from '../helpers.mjs';

export async function run(driver) {
  await loginAs(driver, 'patient');
  const tests = [
    { name: 'TC01 - Layout patient', fn: async (d) => isVisible(d, By.css('.app-layout')) },
    { name: 'TC02 - Sidebar a 4+ liens', fn: async (d) => { const l=await d.findElements(By.css('.sidebar-nav .nav-link')); return l.length>=4?{pass:true}:{pass:false,error:`${l.length} liens`}; }},
    { name: 'TC03 - Lien "Mon espace"', fn: async (d) => hasText(d, By.css('.sidebar-nav'), 'Mon espace') },
    { name: 'TC04 - Role "Patient"', fn: async (d) => hasText(d, By.css('.sidebar-footer'), 'Patient') },
    { name: 'TC05 - Topbar "Portail Patient"', fn: async (d) => hasText(d, By.css('.topbar-title'), 'Portail Patient') },
    { name: 'TC06 - Nav "Mon dossier"', fn: async (d) => { await d.findElement(By.xpath('//a[contains(text(),"Mon dossier")]')).click(); return urlHas(d,'/patient/dossier'); }},
    { name: 'TC07 - Nav "Mes ordonnances"', fn: async (d) => { await d.findElement(By.xpath('//a[contains(translate(text(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"ordonnances")]')).click(); return urlHas(d,'/patient/prescriptions'); }},
    { name: 'TC08 - Nav "Mes rendez-vous"', fn: async (d) => { await d.findElement(By.xpath('//a[contains(translate(text(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"rendez-vous")]')).click(); return urlHas(d,'/patient/rendez-vous'); }},
    { name: 'TC09 - Stats dashboard', fn: async (d) => { await d.get(BASE+'/patient/dashboard'); await d.sleep(T.short); const s=await d.findElements(By.css('.stat-card')); return s.length>0?{pass:true}:{pass:false,error:'Pas de stat-card'}; }},
    { name: 'TC10 - Branding GyneCare', fn: async (d) => hasText(d, By.css('.sidebar-logo'), 'Gyne') },
    { name: 'TC11 - Bouton deconnexion', fn: async (d) => isVisible(d, By.css('.btn-logout')) },
    { name: 'TC12 - Logout patient', fn: async (d) => { await d.findElement(By.css('.btn-logout')).click(); return urlHas(d,'/patient/login'); }},
  ];
  return await runTests(driver, 'Patient Portal', tests);
}
