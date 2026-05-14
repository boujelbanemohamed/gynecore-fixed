import { By } from 'selenium-webdriver';
import { BASE, T, loginAs, isVisible, hasText, urlHas, exists, runTests } from '../helpers.mjs';

export async function run(driver) {
  await loginAs(driver, 'doctor');
  const tests = [
    { name: 'TC01 - Sidebar a 7 liens', fn: async (d) => { const l=await d.findElements(By.css('.sidebar-nav .nav-link')); return l.length>=7?{pass:true}:{pass:false,error:`${l.length} liens`}; }},
    { name: 'TC02 - Lien "Tableau de bord"', fn: async (d) => hasText(d, By.css('.sidebar-nav'), 'Tableau de bord') },
    { name: 'TC03 - Lien "Patientes"', fn: async (d) => hasText(d, By.css('.sidebar-nav'), 'Patientes') },
    { name: 'TC04 - Nav vers /patients', fn: async (d) => { await d.findElement(By.css('.sidebar-nav .nav-link:nth-child(2)')).click(); return urlHas(d,'/patients'); }},
    { name: 'TC05 - Nav vers /consultations', fn: async (d) => { await d.findElement(By.css('.sidebar-nav .nav-link:nth-child(3)')).click(); return urlHas(d,'/consultations'); }},
    { name: 'TC06 - Nav vers /calendar', fn: async (d) => { await d.findElement(By.css('.sidebar-nav .nav-link:nth-child(4)')).click(); return urlHas(d,'/calendar'); }},
    { name: 'TC07 - Nav vers /secretaries', fn: async (d) => { await d.findElement(By.css('.sidebar-nav .nav-link:nth-child(5)')).click(); return urlHas(d,'/secretaries'); }},
    { name: 'TC08 - Nav vers /unavailable-slots', fn: async (d) => { await d.findElement(By.css('.sidebar-nav .nav-link:nth-child(6)')).click(); return urlHas(d,'/unavailable-slots'); }},
    { name: 'TC09 - Nav vers /settings', fn: async (d) => { await d.findElement(By.css('.sidebar-nav .nav-link:nth-child(7)')).click(); return urlHas(d,'/settings'); }},
    { name: 'TC10 - Lien actif surligne', fn: async (d) => { await d.get(BASE+'/patients'); await d.sleep(T.short); return await exists(d,By.css('.sidebar-nav .nav-link.active'))?{pass:true}:{pass:false,error:'Pas de lien actif'}; }},
    { name: 'TC11 - Branding GyneCare', fn: async (d) => { await d.get(BASE+'/dashboard'); await d.sleep(T.short); return hasText(d, By.css('.sidebar-logo'), 'Gyne'); }},
    { name: 'TC12 - Bouton deconnexion', fn: async (d) => isVisible(d, By.css('.btn-logout')) },
    { name: 'TC13 - Avatar utilisateur', fn: async (d) => isVisible(d, By.css('.user-avatar')) },
    { name: 'TC14 - Topbar visible', fn: async (d) => { const t=await exists(d,By.css('.topbar')); const h=await exists(d,By.css('.topbar-title')); return (t&&h)?{pass:true}:{pass:false,error:`topbar=${t} title=${h}`}; }},
  ];
  return await runTests(driver, 'Doctor Navigation', tests);
}
