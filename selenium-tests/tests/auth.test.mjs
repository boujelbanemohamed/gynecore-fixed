import { By } from 'selenium-webdriver';
import { BASE, CREDS, T, loginAs, isVisible, hasText, urlHas, exists, runTests } from '../helpers.mjs';

export async function run(driver) {
  const tests = [
    { name: 'TC01 - Page login medecin', fn: async (d) => { await d.get(BASE+'/login'); return await hasText(d, By.css('h2'), 'Connexion'); }},
    { name: 'TC02 - Login medecin OK', fn: async (d) => { await d.get(BASE+'/login'); await d.findElement(By.css('input[type="email"]')).sendKeys(CREDS.doctor.email); await d.findElement(By.css('input[type="password"]')).sendKeys(CREDS.doctor.password); await d.findElement(By.css('button[type="submit"]')).click(); const r = await urlHas(d,'/dashboard'); if(!r.pass) return r; return await isVisible(d, By.css('.sidebar-footer')); }},
    { name: 'TC03 - Sidebar medecin affiche "Medecin"', fn: async (d) => { await loginAs(d,'doctor'); return await hasText(d, By.css('.sidebar-footer'), 'Medecin'); }},
    { name: 'TC04 - Login invalide -> erreur', fn: async (d) => { await d.get(BASE+'/login'); await d.findElement(By.css('input[type="email"]')).sendKeys('wrong@email.fr'); await d.findElement(By.css('input[type="password"]')).sendKeys('wrong'); await d.findElement(By.css('button[type="submit"]')).click(); await d.sleep(T.short); const url=await d.getCurrentUrl(); const err=await exists(d,By.css('.alert-error')); return (url.includes('/login')||err) ? {pass:true} : {pass:false,error:`URL: ${url}`}; }},
    { name: 'TC05 - Page login secretaire', fn: async (d) => { await d.get(BASE+'/secretary/login'); return await hasText(d, By.css('h2'), 'Connexion secretaire'); }},
    { name: 'TC06 - Login secretaire OK', fn: async (d) => { await loginAs(d,'secretary'); return await urlHas(d,'/secretary/dashboard'); }},
    { name: 'TC07 - Page login patient', fn: async (d) => { await d.get(BASE+'/patient/login'); return await hasText(d, By.css('h2'), 'Portail Patient'); }},
    { name: 'TC08 - Login patient OK', fn: async (d) => { await loginAs(d,'patient'); return await urlHas(d,'/patient/dashboard'); }},
    { name: 'TC09 - Route guard non-auth -> /login', fn: async (d) => { await d.get(BASE+'/login'); await d.executeScript('localStorage.clear()'); await d.get(BASE+'/dashboard'); return await urlHas(d,'/login'); }},
    { name: 'TC10 - Route guard non-auth -> /secretary/login', fn: async (d) => { await d.get(BASE+'/login'); await d.executeScript('localStorage.clear()'); await d.get(BASE+'/secretary/dashboard'); return await urlHas(d,'/secretary/login'); }},
    { name: 'TC11 - Route guard non-auth -> /patient/login', fn: async (d) => { await d.get(BASE+'/login'); await d.executeScript('localStorage.clear()'); await d.get(BASE+'/patient/dashboard'); return await urlHas(d,'/patient/login'); }},
    { name: 'TC12 - Secretaire ne peut pas acceder a /dashboard', fn: async (d) => { await loginAs(d,'secretary'); await d.get(BASE+'/dashboard'); await d.sleep(T.short); return await urlHas(d,'/secretary/dashboard'); }},
    { name: 'TC13 - Links patient/secretary sur login', fn: async (d) => { await d.get(BASE+'/login'); await d.sleep(T.short); const p=await exists(d,By.css('a[href="/patient/login"]')); const s=await exists(d,By.css('a[href="/secretary/login"]')); return (p&&s)?{pass:true}:{pass:false,error:`patient=${p} sec=${s}`}; }},
    { name: 'TC14 - Logout medecin', fn: async (d) => { await loginAs(d,'doctor'); await d.findElement(By.css('.btn-logout')).click(); return await urlHas(d,'/login'); }},
    { name: 'TC15 - Logout patient', fn: async (d) => { await loginAs(d,'patient'); await d.findElement(By.css('.btn-logout')).click(); return await urlHas(d,'/patient/login'); }},
  ];
  return await runTests(driver, 'Authentication', tests);
}
