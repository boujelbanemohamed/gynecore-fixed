import { By } from 'selenium-webdriver';
import { BASE, T, loginAs, runTests } from '../helpers.mjs';

export async function run(driver) {
  const tests = [
    { name: 'TC01 - API secretaire vs docteur meme donnees', fn: async (d) => {
      // Secretary side
      await loginAs(d, 'secretary');
      const secToken = await d.executeScript('return localStorage.getItem("token")');
      const secData = await d.executeScript(async (t) => {
        const r = await fetch('http://localhost:4000/api/secretary/appointments', { headers: { 'Authorization': 'Bearer '+t } });
        return await r.json();
      }, secToken);
      const secAppts = secData.data?.appointments || secData.data || [];
      const secCount = Array.isArray(secAppts) ? secAppts.length : 0;

      // Doctor side
      await loginAs(d, 'doctor');
      const docToken = await d.executeScript('return localStorage.getItem("token")');
      const docData = await d.executeScript(async (t) => {
        const r = await fetch('http://localhost:4000/api/doctor/appointments', { headers: { 'Authorization': 'Bearer '+t } });
        return await r.json();
      }, docToken);
      const docAppts = docData.data || [];
      const docCount = Array.isArray(docAppts) ? docAppts.length : 0;

      const secIds = new Set(secAppts.map(a => a.id));
      const docIds = new Set(docAppts.map(a => a.id));
      let match = 0;
      for (const id of secIds) { if (docIds.has(id)) match++; }
      return (secCount > 0 && match === secCount) ? {pass:true} : {pass:false, error:`Sec:${secCount} Doc:${docCount} Match:${match}/${secCount}`};
    }},
    { name: 'TC02 - Secretaire cree RDV via API', fn: async (d) => {
      await loginAs(d, 'secretary');
      const secToken = await d.executeScript('return localStorage.getItem("token")');
      const pData = await d.executeScript(async (t) => {
        const r = await fetch('http://localhost:4000/api/secretary/patients', { headers: { 'Authorization': 'Bearer '+t } });
        return await r.json();
      }, secToken);
      const patients = pData.data?.patients || [];
      if (!patients.length) return { pass: true, error: 'SKIP: pas de patientes' };
      const pid = patients[0].id;
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
      const ds = tomorrow.toISOString().split('T')[0];
      const cr = await d.executeScript(async ({t,pid,ds}) => {
        const r = await fetch('http://localhost:4000/api/secretary/appointments', {
          method:'POST', headers:{'Authorization':'Bearer '+t,'Content-Type':'application/json'},
          body: JSON.stringify({patientId:pid, startTime:ds+'T14:00:00.000Z', endTime:ds+'T14:30:00.000Z', type:'FIRST_VISIT', reason:'Selenium_'+Date.now(), status:'SCHEDULED'})
        });
        return { status: r.status, data: await r.json() };
      }, {t:secToken, pid, ds});
      if (cr.status !== 200) return {pass:false, error:`Status ${cr.status}`};
      const apptId = cr.data?.data?.id;
      if (!apptId) return {pass:false, error:'Pas d\'ID'};
      // Verify on doctor side
      await loginAs(d, 'doctor');
      const docToken = await d.executeScript('return localStorage.getItem("token")');
      const found = await d.executeScript(async ({t,id}) => {
        const r = await fetch('http://localhost:4000/api/doctor/appointments', { headers:{'Authorization':'Bearer '+t} });
        const d2 = await r.json(); return (d2.data||[]).some(a=>a.id===id);
      }, {t:docToken, id:apptId});
      return found ? {pass:true} : {pass:false, error:`RDV ${apptId} non trouve cote medecin`};
    }},
  ];
  return await runTests(driver, 'Cross Verification', tests);
}
