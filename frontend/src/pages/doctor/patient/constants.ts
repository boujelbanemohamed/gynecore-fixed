export type Tab = 'info'|'consultations'|'exams'|'prescriptions'|'certificates'|'letters'|'appointments'|'documents';

export const typeLabels: Record<string,string> = {
  FIRST_VISIT:'Première visite', FOLLOW_UP:'Suivi', EMERGENCY:'Urgence',
  ANNUAL_CHECKUP:'Bilan annuel', PRENATAL:'Prénatal', POSTNATAL:'Postnatal'
};

export const certTypeLabels: Record<string,string> = {
  APTITUDE:'Aptitude / Inaptitude', MEDICAL_REST:'Repos medical', PREGNANCY_WORK:'Grossesse et Travail',
  MATERNITY_LEAVE:'Conge maternite', RETURN_TO_WORK:'Reprise du travail', POST_OPERATIVE:'Post-operatoire'
};

export const certTypeIcons: Record<string,string> = {
  APTITUDE:'✅', MEDICAL_REST:'🏥', PREGNANCY_WORK:'🤰', MATERNITY_LEAVE:'👶', RETURN_TO_WORK:'💼', POST_OPERATIVE:'⚕️'
};

export const letterTypeLabels: Record<string, string> = {
  SPECIALIST_REFERRAL: 'Courrier vers specialiste', EMPLOYER: 'Courrier employeur',
  MEDICAL_REPORT: 'Rapport medical', DISCHARGE_SUMMARY: 'Synthese de sortie', OTHER: 'Autre'
};

export const PRINT_CSS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; height: auto; overflow: hidden; }
  body {
    font-family: Arial, Helvetica, sans-serif; color: #1a1a2e;
    padding: 12mm 15mm;
    background: white;
  }
  @media print {
    html, body { width: 100%; height: auto; overflow: hidden; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
  .rx-header { display: flex; align-items: flex-start; gap: 16px; padding-bottom: 12px; border-bottom: 3px solid #1a5c4a; margin-bottom: 12px; }
  .rx-doctor-logo { width: 64px; height: 64px; border-radius: 50%; object-fit: contain; border: 2px solid #1a5c4a; flex-shrink: 0; }
  .rx-info { flex: 1; }
  .rx-info h2 { font-size: 16px; font-weight: 700; color: #1a5c4a; margin: 0; }
  .rx-clinic-name { font-size: 11px; color: #1a5c4a; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 1px; }
  .rx-specialty { font-size: 12px; color: #333; margin: 1px 0; }
  .rx-services { font-size: 11px; color: #888; font-style: italic; margin: 1px 0; }
  .rx-address { font-size: 11px; color: #555; margin: 1px 0; }
  .rx-contact { font-size: 11px; color: #777; margin-top: 2px; }
  .rx-title { text-align: center; font-size: 18px; font-weight: 700; color: #1a5c4a; text-transform: uppercase; letter-spacing: 2px; margin: 14px 0 12px 0; padding: 8px 0; border: 2px solid #1a5c4a; border-radius: 6px; background: #f0faf6; }
  .rx-patient { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8f9fa; border-radius: 6px; margin-bottom: 14px; font-size: 13px; }
  .rx-patient strong { color: #1a5c4a; }
  .rx-date-place { margin-bottom: 12px; font-size: 12px; color: #555; }
  .rx-meds-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .rx-meds-table thead th { background: #1a5c4a; color: white; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
  .rx-meds-table thead th:first-child { border-radius: 6px 0 0 0; }
  .rx-meds-table thead th:last-child { border-radius: 0 6px 0 0; }
  .rx-meds-table tbody td { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #e8eaed; }
  .rx-meds-table tbody tr:nth-child(even) { background: #f8faf9; }
  .rx-notes { padding: 10px 14px; background: #fef9ef; border-left: 4px solid #e67e22; border-radius: 0 6px 6px 0; font-size: 12px; margin-bottom: 14px; color: #555; }
  .rx-notes strong { color: #333; }
  .rx-footer { margin-top: 24px; padding-top: 12px; border-top: 3px solid #1a5c4a; }
  .rx-signature { text-align: center; }
  .rx-sig-line { width: 200px; border-top: 1px solid #999; margin-top: 50px; padding-top: 6px; font-size: 11px; color: #555; }
  .cert-body { margin: 14px 0; line-height: 1.9; }
  .cert-body p { margin: 8px 0; font-size: 13px; text-align: justify; }
  .cert-details { margin: 10px 0; padding: 12px 16px; background: #f8f9fa; border-radius: 6px; }
  .cert-details p { margin: 5px 0; font-size: 13px; }
  .cert-details strong { color: #1a5c4a; }
  .cert-observations { margin: 10px 0; padding: 10px 14px; background: #fef9ef; border-left: 4px solid #e67e22; border-radius: 0 6px 6px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  .page-break { page-break-after: always; }
`;

export function printInIframe(htmlContent: string) {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;border:none;opacity:0;pointer-events:none;z-index:-1;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || (iframe.contentWindow as any)?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open();
    doc.write('<!DOCTYPE html><html><head><style>' + PRINT_CSS + '</style></head><body style="background:white;">' + htmlContent + '</body></html>');
    doc.close();
    setTimeout(() => {
      try {
        (iframe.contentWindow as any)?.focus();
        (iframe.contentWindow as any)?.print();
      } catch(e) { console.error('Print error:', e); }
    }, 800);
    const cleanup = () => {
      try { document.body.removeChild(iframe); } catch {}
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 60000);
  } catch(e) { console.error('printInIframe error:', e); }
}

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
export const fileUrl = (path: string) => API_BASE.replace(/\/api$/, '') + path;

export const emptyLab = () => ({
  hemoglobin:'', vgm:'', whiteBloodCells:'', platelets:'', ferritin:'', crp:'',
  fsh:'', lh:'', estradiol:'', amh:'', progesterone:'', prolactine:'', tsh:'', testosterone:'', dheas:'',
  glycemie:'', hba1c:'', hdl:'', hdl2:'', creatinine:'', uricAcid:'', asat:'', alat:'',
  tp:'', tca:'', fibrinogen:'', dDimers:'',
  bloodGroup:'', rai:'', bhcg:'', ca125:'', rubella:'', toxoplasmosis:'', hiv:'', proteinuria:'', ecbu:''
});

export function escapeHtml(str: any) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
