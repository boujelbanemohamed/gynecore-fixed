import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import ClinicalExamTab from './ClinicalExamTab';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
type Tab = 'info'|'consultations'|'exams'|'prescriptions'|'certificates'|'letters'|'appointments'|'documents';
type ConsultTab = 'accueil'|'examen'|'bilan'|'contexte';
type ClinicalCtx = 'obstetrique'|'infertilite'|null;

const typeLabels: Record<string,string> = {
  FIRST_VISIT:'Première visite', FOLLOW_UP:'Suivi', EMERGENCY:'Urgence',
  ANNUAL_CHECKUP:'Bilan annuel', PRENATAL:'Prénatal', POSTNATAL:'Postnatal'
};

const certTypeLabels: Record<string,string> = {
  APTITUDE:'Aptitude / Inaptitude', MEDICAL_REST:'Repos medical', PREGNANCY_WORK:'Grossesse et Travail',
  MATERNITY_LEAVE:'Conge maternite', RETURN_TO_WORK:'Reprise du travail', POST_OPERATIVE:'Post-operatoire'
};
const certTypeIcons: Record<string,string> = {
  APTITUDE:'✅', MEDICAL_REST:'🏥', PREGNANCY_WORK:'🤰', MATERNITY_LEAVE:'👶', RETURN_TO_WORK:'💼', POST_OPERATIVE:'⚕️'
};

const emptyLab = () => ({
  hemoglobin:'', vgm:'', whiteBloodCells:'', platelets:'', ferritin:'', crp:'',
  fsh:'', lh:'', estradiol:'', amh:'', progesterone:'', prolactine:'', tsh:'', testosterone:'', dheas:'',
  glycemie:'', hba1c:'', hdl:'', hdl2:'', creatinine:'', uricAcid:'', asat:'', alat:'',
  tp:'', tca:'', fibrinogen:'', dDimers:'',
  bloodGroup:'', rai:'', bhcg:'', ca125:'', rubella:'', toxoplasmosis:'', hiv:'', proteinuria:'', ecbu:''
});

const emptyForm = (p?: any) => ({
  date: new Date().toISOString().slice(0, 16), type: 'FOLLOW_UP',
  chiefComplaint: '', symptoms: '', clinicalExam: '', diagnosis: '', treatment: '', notes: '',
  weight: '', bloodPressure: '', temperature: '', heartRate: '', height: '',
  generalState: 'Bon état général', conjonctives: 'Rosées', oedemes: 'Absents',
  cardiacAuscultation: 'Rythmé', pulmonaryAuscultation: 'Murmure vésiculaire normal',
  abdomen: 'Souple', uterusState: 'Non gravide', uterineHeight: '',
  presentation: 'Céphalique', bcf: 'POSITIFS', adnexa: 'Libres et indolores',
  cervixAspect: 'Aspect normal', vaginalDischarge: 'Leucorrhées physiologiques',
  dilatation: 'Col fermé', effacement: 'Non effacé', consistency: 'Ferme', presentationHeight: '-3 (mobile)',
  breastExam: 'Seins symétriques', clinicalConclusion: '', echographie: '',
  nextVisit: '', ddr: '',
  numberOfPregnancies: p?.numberOfPregnancies?.toString() || '',
  medicalHistory: p?.medicalHistory || '', surgicalHistory: p?.surgicalHistory || '', familyHistory: p?.familyHistory || '',
  ...emptyLab()
});

const PatientDetail: React.FC = () => {
  const { id } = useParams<{id:string}>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consultTab, setConsultTab] = useState<ConsultTab>('accueil');
  const [clinicalCtx, setClinicalCtx] = useState<ClinicalCtx>(null);
  const [form, setForm] = useState(emptyForm);
  const [documents, setDocuments] = useState<any[]>([]);
  const [examCount, setExamCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [prescSaving, setPrescSaving] = useState(false);
  const [prescMeds, setPrescMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [prescNotes, setPrescNotes] = useState('');
  const [printLogoUrl, setPrintLogoUrl] = useState('');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [editingPrescId, setEditingPrescId] = useState<string | null>(null);

  // Medical Letter states
  const [letters, setLetters] = useState<any[]>([]);
  const [letterForm, setLetterForm] = useState({ type: 'SPECIALIST_REFERRAL', recipient: '', subject: '', body: '' });
  const [letterModal, setLetterModal] = useState(false);
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);

  // Certificate states
  const [showCertModal, setShowCertModal] = useState(false);
  const [certSaving, setCertSaving] = useState(false);
  const [certType, setCertType] = useState<string>('APTITUDE');
  const [certForm, setCertForm] = useState<Record<string,string>>({});
  const [certificates, setCertificates] = useState<any[]>([]);
  const [confirmAction, setConfirmAction] = useState<{type:string,id:string,label:string}|null>(null);
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptSaving, setApptSaving] = useState(false);
  const [apptForm, setApptForm] = useState({ date: "", startTime: "09:00", endTime: "09:30", type: "FOLLOW_UP", reason: "" });
    const [prescDate, setPrescDate] = useState(new Date().toISOString().slice(0, 10));
    const [printPresc, setPrintPresc] = useState<any>(null);
    const [printCert, setPrintCert] = useState<any>(null);
    const [printCertLogo, setPrintCertLogo] = useState<string>("");

  const handleEditPresc = async (p: any) => {
    const meds = (p.medications || []).map((m: any) => ({
      name: m.name || '', dosage: m.dosage || '', frequency: m.frequency || '',
      duration: m.duration || '', instructions: m.instructions || '',
    }));
    setPrescMeds(meds.length > 0 ? meds : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setPrescNotes(p.notes || '');
    setPrescDate(p.date ? new Date(p.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditingPrescId(p.id);
    setShowPrescModal(true);
  };

  const handleUpdatePresc = async () => {
    if (!editingPrescId) return;
    const validMeds = prescMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) { alert('Ajoutez au moins un médicament'); return; }
    setPrescSaving(true);
    try {
      await (doctorAPI as any).updatePrescription(editingPrescId, { medications: validMeds, notes: prescNotes || undefined, date: prescDate || undefined });
      load();
      setShowPrescModal(false);
      setEditingPrescId(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la modification');
    } finally { setPrescSaving(false); }
  };

  const imc = useMemo(() => {
    const w = parseFloat(form.weight); const h = parseFloat(form.height) / 100;
    if (w > 0 && h > 0) return (w / (h * h)).toFixed(1);
    return '';
  }, [form.weight, form.height]);

  const load = () => {
    if (!id) return;
    doctorAPI.getPatient(id).then(r => setPatient(r.data.data)).catch(() => navigate('/patients')).finally(() => setLoading(false));
    loadDocuments();
  };
  useEffect(() => { load(); }, [id]);

  const loadDocuments = () => {
    if (!id) return;
    doctorAPI.getPatientDocuments(id).then(r => setDocuments(r.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    (doctorAPI as any).getClinicalExams({ patientId: id }).then((r: any) => {
      if (r?.data?.data) setExamCount(r.data.data.length);
    }).catch(() => {});
  }, [id]);

  const uploadFile = async (file: File) => {
    if (!id) return; setUploading(true);
    try { await doctorAPI.uploadDocument(file, id); loadDocuments(); }
    catch (err: any) { alert(err.response?.data?.error || "Erreur lors de l'upload"); }
    finally { setUploading(false); }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) Array.from(files).forEach(f => uploadFile(f));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) Array.from(files).forEach(f => uploadFile(f));
  };

  const deleteDoc = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    try { await doctorAPI.deleteDocument(docId); loadDocuments(); }
    catch { alert('Erreur lors de la suppression'); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  };

  const loadDoctorProfile = () => {
    doctorAPI.getProfile().then(r => setDoctorProfile(r.data.data)).catch(() => {});
  };
  useEffect(() => { loadDoctorProfile(); }, []);

  const openApptModal = () => {
    setApptForm({ date: new Date().toISOString().slice(0, 10), startTime: "09:00", endTime: "09:30", type: "FOLLOW_UP", reason: "" });
    setShowApptModal(true);
  };

  const handleCreateAppt = async () => {
    if (!apptForm.date || !apptForm.startTime || !apptForm.endTime) { alert("Date et heures requises"); return; }
    setApptSaving(true);
    try {
      const start = new Date(apptForm.date + "T" + apptForm.startTime);
      const end = new Date(apptForm.date + "T" + apptForm.endTime);
      if (end <= start) { alert("L\u2019heure de fin doit etre apres l\u2019heure de debut"); setApptSaving(false); return; }
      const profRes = await (doctorAPI as any).getProfile();
      await (doctorAPI as any).createAppointment({
        patientId: id,
        doctorId: profRes.data.data.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: apptForm.type,
        reason: apptForm.reason || undefined,
      });
      load();
      setShowApptModal(false);
    } catch (err: any) { alert(err.response?.data?.error || "Erreur lors de la creation"); }
    finally { setApptSaving(false); }
  };

  const updAppt = (patch: any) => setApptForm(prev => ({ ...prev, ...patch }));

  const openPrescModal = () => {
    setPrescMeds([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setEditingPrescId(null);
    setPrescNotes(''); setShowPrescModal(true);
  };

  const addMedRow = () => setPrescMeds([...prescMeds, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeMedRow = (i: number) => setPrescMeds(prescMeds.filter((_, idx) => idx !== i));
  const updateMed = (i: number, patch: any) => setPrescMeds(prescMeds.map((m, idx) => idx === i ? { ...m, ...patch } : m));

  const handleCreatePresc = async () => {
    const validMeds = prescMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) { alert('Ajoutez au moins un médicament'); return; }
    setPrescSaving(true);
    try {
      await doctorAPI.createPrescription({ patientId: id, medications: validMeds, notes: prescNotes || undefined, date: prescDate || undefined });
      load(); setShowPrescModal(false);
    } catch (err: any) { alert(err.response?.data?.error || 'Erreur lors de la création'); }
    finally { setPrescSaving(false); }
  };


  const PRINT_CSS = `
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

    const printInIframe = (htmlContent: string) => {
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
  };

    const handlePrintPresc = async (prescId: string) => {
    try {
      const res = await doctorAPI.getPrescriptionById(prescId);
      const presc = res.data.data;
      const medsRows = (presc.medications || []).map((m: any) =>
        '<tr><td style="font-weight:500">' + (m.name||'') + '</td><td>' + (m.dosage||'') + '</td><td>' + (m.frequency||'') + '</td><td>' + (m.duration||'') + '</td><td>' + (m.instructions||'') + '</td></tr>'
      ).join('');
      const pName = (presc.patient?.user?.firstName||'') + ' ' + (presc.patient?.user?.lastName||'');
      const pAge = presc.patient?.dateOfBirth ? Math.floor((Date.now() - new Date(presc.patient.dateOfBirth).getTime()) / (365.25*24*60*60*1000)) + ' ans' : '--';
      const logoUrl = doctorProfile?.logo ? (API_BASE.replace('/api','') + doctorProfile.logo) : '';
      let logoHtml = '';
      const fullAddr = [(doctorProfile?.address||''), (doctorProfile?.city||''), (doctorProfile?.postalCode||'')].filter(Boolean).join(', ');
      if (logoUrl) {
        try {
          const imgRes = await fetch(logoUrl);
          const blob = await imgRes.blob();
          logoHtml = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve('<img style="width:64px;height:64px;border-radius:50%;object-fit:contain;border:2px solid #1a5c4a;" src="' + reader.result + '" />');
            reader.readAsDataURL(blob);
          });
        } catch { logoHtml = ''; }
      }
      const clinicHtml = doctorProfile?.clinicName ? '<div class="rx-clinic"><h3>' + doctorProfile.clinicName + '</h3><div class="rx-clinic-addr">' + (doctorProfile.address||'') + (doctorProfile.city?', ':'') + (doctorProfile.city||'') + (doctorProfile.postalCode?' ':'') + (doctorProfile.postalCode||'') + '</div></div>' : '';
      const notesHtml = presc.notes ? '<div class="rx-notes"><strong>Notes :</strong> ' + presc.notes + '</div>' : '';
      const licHtml = doctorProfile?.licenseNumber ? '<div class="rx-contact">N Licence : ' + doctorProfile.licenseNumber + (doctorProfile?.rppsNumber ? ' . RPPS : ' + doctorProfile.rppsNumber : '') + '</div>' : '';
      const html = '<div>' +
        '<div class="rx-header">' + logoHtml +
        '<div class="rx-info">' +
        '<div class="rx-clinic-name">' + (doctorProfile?.clinicName||'') + '</div>' +
        '<h2>Dr ' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</h2>' +
        '<div class="rx-specialty">' + (doctorProfile?.specialization||'Gynecologie-Obstetrique') + '</div>' +
        '<div class="rx-services">' + (doctorProfile?.services||'') + '</div>' +
        '<div class="rx-contact">' + (doctorProfile?.phone||'') + (doctorProfile?.email?' . ':'') + (doctorProfile?.email||'') + '</div>' +
        '</div></div>' +
        '<div class="rx-title">Ordonnance Medicale</div>' +
        '<div class="rx-patient"><div><strong>Patiente :</strong> ' + pName + '</div><div><strong>Age :</strong> ' + pAge + '</div></div>' +
        '<div class="rx-date-place">Fait a ' + (doctorProfile?.city||'') + ', le ' + new Date(presc.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) + '</div>' +
        '<table class="rx-meds-table"><thead><tr><th>Medicament</th><th>Dosage</th><th>Frequence</th><th>Duree</th><th>Instructions</th></tr></thead><tbody>' + medsRows + '</tbody></table>' +
        notesHtml +
        '<div class="rx-footer"><div class="rx-signature"><div class="rx-sig-line">Signature et cachet du medecin</div></div></div>' +
        '</div>';
      printInIframe(html);
    } catch { alert('Erreur lors du chargement'); }
  };

  // -- Medical Letter functions --
  const letterTypeLabels: Record<string, string> = { SPECIALIST_REFERRAL: 'Courrier vers specialiste', EMPLOYER: 'Courrier employeur', MEDICAL_REPORT: 'Rapport medical', DISCHARGE_SUMMARY: 'Synthese de sortie', OTHER: 'Autre' };
  const letterTypeIcons: Record<string, string> = { SPECIALIST_REFERRAL: 'urologie', EMPLOYER: 'hospital', MEDICAL_REPORT: 'clipboard2-pulse', DISCHARGE_SUMMARY: 'file-earmark-medical', OTHER: 'envelope' };

  const openLetterModal = (type: string = 'SPECIALIST_REFERRAL') => {
    setEditingLetterId(null);
    setLetterForm({ type, recipient: '', subject: '', body: '' });
    setLetterModal(true);
  };

  const handleEditLetter = (letter: any) => {
    setEditingLetterId(letter.id);
    const c = letter.content || {};
    setLetterForm({ type: letter.type, recipient: letter.recipient || '', subject: letter.subject || '', body: c.body || '' });
    setLetterModal(true);
  };

  const handleSaveLetter = async () => {
    if (!letterForm.recipient || !letterForm.subject) { alert('Veuillez remplir le destinataire et l\'objet'); return; }
    try {
      const data = { patientId: id, type: letterForm.type, recipient: letterForm.recipient, subject: letterForm.subject, content: { body: letterForm.body } };
      if (editingLetterId) { await doctorAPI.updateMedicalLetter(editingLetterId, data); }
      else { await doctorAPI.createMedicalLetter(data); }
      setLetterModal(false);
      loadLetters();
    } catch (e: any) { alert(e.response?.data?.error || 'Erreur'); }
  };

  const handleDeleteLetter = async (letterId: string) => {
    if (!confirm('Supprimer ce courrier ?')) return;
    try { await doctorAPI.deleteMedicalLetter(letterId); loadLetters(); } catch {}
  };

  const handlePrintLetter = async (letterId: string) => {
    try {
      const res = await doctorAPI.getMedicalLetterById(letterId);
      const letter = res.data.data;
      const c = letter.content || {};
      const pName = (patient.user?.firstName||'') + ' ' + (patient.user?.lastName||'');
      const pAge = patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25*24*60*60*1000)) + ' ans' : '--';
      const fullAddr = [(doctorProfile?.address||''), (doctorProfile?.city||''), (doctorProfile?.postalCode||'')].filter(Boolean).join(', ');
      let logoHtml = '';
      if (doctorProfile?.logo) {
        try {
          const imgUrl = API_BASE.replace('/api','') + doctorProfile.logo;
          const imgRes = await fetch(imgUrl);
          const blob = await imgRes.blob();
          logoHtml = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve('<img class="rx-doctor-logo" src="' + reader.result + '" />');
            reader.readAsDataURL(blob);
          });
        } catch { logoHtml = ''; }
      }
      const letterTitles: Record<string,string> = {
        SPECIALIST_REFERRAL: "COURRIER D\'ORIENTATION SPECIALISTE",
        EMPLOYER: "COURRIER MEDICAL - EMPLOYEUR",
        MEDICAL_REPORT: 'COMPTE RENDU MEDICAL',
        DISCHARGE_SUMMARY: "COMPTE RENDU D\'HOSPITALISATION",
        OTHER: 'COURRIER MEDICAL',
      };
      const title = letterTitles[letter.type] || 'COURRIER MEDICAL';
      const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) : '.......................................';
      const fld = (v: string) => v || '.......................................';
      let bodyHtml = '';
      if (letter.recipient) {
        bodyHtml += '<div class="cert-details"><p><strong>A l\'attention de :</strong> ' + letter.recipient + '</p></div>';
      }
      if (letter.subject) {
        bodyHtml += '<div class="cert-details"><p><strong>Objet :</strong> ' + letter.subject + '</p></div>';
      }
      if (c.body) {
        bodyHtml += '<div class="cert-observations" style="white-space:pre-wrap;line-height:1.8">' + c.body + '</div>';
      }
      const html = '<div>' +
        '<div class="rx-header">' + logoHtml +
        '<div class="rx-info">' +
        '<div class="rx-clinic-name">' + (doctorProfile?.clinicName||'') + '</div>' +
        '<h2>Dr ' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</h2>' +
        '<div class="rx-specialty">' + (doctorProfile?.specialization||'Gynecologie-Obstetrique') + '</div>' +
        '<div class="rx-services">' + (doctorProfile?.services||'') + '</div>' +
        '<div class="rx-address">' + fullAddr + '</div>' +
        '<div class="rx-contact">' + (doctorProfile?.phone||'') + (doctorProfile?.email?' . ':'') + (doctorProfile?.email||'') + '</div>' +
        '</div></div>' +
        '<div class="rx-title">' + title + '</div>' +
        '<div class="rx-patient"><div><strong>Patiente :</strong> ' + pName + '</div><div><strong>Age :</strong> ' + pAge + '</div></div>' +
        '<div class="rx-date-place">Fait a ' + (doctorProfile?.city||'Tunis') + ', le ' + fmt(letter.createdAt) + '</div>' +
        '<div class="cert-body">' + bodyHtml + '</div>' +
        '<div class="rx-footer"><div class="rx-signature"><div class="rx-sig-line">Signature et cachet du medecin</div></div></div>' +
        '</div>';
      printInIframe(html);
    } catch { alert('Erreur lors du chargement'); }
  };

  // -- Certificate functions --
  const certFields: Record<string, {key:string,label:string,type:'text'|'date'|'textarea'|'select',placeholder?:string,options?:string[]}[]> = {
    APTITUDE: [
      {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
      {key:'dateOfBirth',label:'Date de naissance',type:'date'},
      {key:'cin',label:'CIN',type:'text',placeholder:'N CIN'},
      {key:'certDate',label:'Date du certificat',type:'date'},
      {key:'aptitudeType',label:"Type d'aptitude",type:'select',options:["Aptitude a l'effort","Aptitude au travail","Aptitude au sport","Inaptitude temporaire","Inaptitude definitive"]},
      {key:'validityDuration',label:'Duree de validite',type:'text',placeholder:'ex: 6 mois'},
      {key:'observations',label:'Observations',type:'textarea',placeholder:'Observations medicales...'},
    ],
    MEDICAL_REST: [
      {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
      {key:'dateOfBirth',label:'Date de naissance',type:'date'},
      {key:'startDate',label:'Du (debut)',type:'date'},
      {key:'endDate',label:'Au (fin)',type:'date'},
      {key:'durationDays',label:'Duree (jours)',type:'text',placeholder:'ex: 7'},
      {key:'medicalReason',label:'Motif medical',type:'text',placeholder:'ex: suites operatoires'},
      {key:'sorties',label:'Sorties',type:'select',options:['Sorties autorisees','Sorties non autorisees','Sorties sur avis medical']},
      {key:'recommendations',label:'Recommandations',type:'textarea',placeholder:'Recommandations...'},
    ],
    PREGNANCY_WORK: [
      {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
      {key:'dateOfBirth',label:'Date de naissance',type:'date'},
      {key:'currentTerm',label:'Terme actuel (Semaines d\'Amenorrhee)',type:'text',placeholder:'ex: 28 SA'},
      {key:'dpa',label:'DPA (Date Prevue d\'Accouchement)',type:'date'},
      {key:'measure',label:'Mesure demandee',type:'select',options:["Amenagement du poste de travail","Allegement des horaires","Arret de travail","Pas de port de charges > 5kg"]},
      {key:'duration',label:'Duree (texte libre)',type:'text',placeholder:"ex: jusqu'a l'accouchement"},
      {key:'durationDate',label:'Ou choisir une date de fin',type:'date'},
      {key:'medicalContext',label:'Contexte medical',type:'textarea',placeholder:'Elements justifiant...'},
    ],
    MATERNITY_LEAVE: [
      {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
      {key:'dateOfBirth',label:'Date de naissance',type:'date'},
      {key:'dpa',label:'DPA (Date Prevue d\'Accouchement)',type:'date'},
      {key:'startDate',label:'Debut conge prenatal',type:'date'},
      {key:'leaveType',label:'Type de conge',type:'select',options:['Conge prenatal','Conge postnatal','Conge de maternite complet']},
      {key:'totalDuration',label:'Duree totale',type:'text',placeholder:'ex: 14 semaines'},
      {key:'observations',label:'Observations',type:'textarea',placeholder:'Complications eventuelles...'},
    ],
    RETURN_TO_WORK: [
      {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
      {key:'dateOfBirth',label:'Date de naissance',type:'date'},
      {key:'stopReason',label:"Motif de l'arret",type:'text',placeholder:"ex: suites d'accouchement"},
      {key:'returnDate',label:'Date de reprise',type:'date'},
      {key:'returnType',label:'Type de reprise',type:'select',options:['Reprise a temps plein','Reprise a temps partiel','Reprise progressive']},
      {key:'recommendations',label:'Recommandations',type:'textarea',placeholder:'Recommandations pour le retour...'},
    ],
    POST_OPERATIVE: [
      {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
      {key:'dateOfBirth',label:'Date de naissance',type:'date'},
      {key:'surgicalProcedure',label:'Acte chirurgical',type:'text',placeholder:'ex: Coelioscopie pour GEU'},
      {key:'interventionDate',label:"Date d'intervention",type:'date'},
      {key:'restDuration',label:'Repos prescrit',type:'text',placeholder:'ex: 10 jours'},
      {key:'resumptionDate',label:"Reprise activite le",type:'date'},
      {key:'restrictions',label:'Restrictions',type:'select',options:['Pas de port de charges',"Pas d'activite physique intense","Repos strict au domicile","Activites legeres autorisees"]},
      {key:'recommendations',label:'Recommandations',type:'textarea',placeholder:'Soins, surveillance, alarmes...'},
    ],
  };
const getCertFields = (t: string) => {
    if (t === 'MATERNITY_LEAVE') {
      const base = [
        {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
        {key:'dateOfBirth',label:'Date de naissance',type:'date'},
        {key:'leaveType',label:'Type de conge',type:'select',options:['Conge prenatal','Conge postnatal','Conge de maternite complet']},
      ];
      const obs = {key:'observations',label:'Observations',type:'textarea',placeholder:'Complications eventuelles...'};
      const dur = {key:'totalDuration',label:'Duree totale (jours)',type:'text',placeholder:'auto-calcule'};
      const lt = certForm.leaveType;
      if (lt === 'Conge postnatal') {
        return [...base,
          {key:'dpa',label:"DPA ou Date d\'accouchement",type:'date'},
          {key:'endDate',label:'Fin du conge postnatal',type:'date'},
          dur, obs];
      }
      if (lt === 'Conge de maternite complet') {
        return [...base,
          {key:'dpa',label:'DPA (Date Prevue d\'Accouchement)',type:'date'},
          {key:'endDate',label:'Fin du conge de maternite',type:'date'},
          dur, obs];
      }
      return [...base,
        {key:'dpa',label:'DPA (Date Prevue d\'Accouchement)',type:'date'},
        {key:'startDate',label:'Debut conge prenatal',type:'date'},
        dur, obs];
    }
    return certFields[t];
  };


  const openCertModal = (type?: string) => {
    setCertType(type || 'APTITUDE');
    const fields = certFields[type || 'APTITUDE'] || [];
    const defaults: Record<string,string> = { certDate: new Date().toISOString().slice(0,10) };
  const getCertFields = (t: string) => {
    if (t === 'MATERNITY_LEAVE') {
      const base = [
        {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
        {key:'dateOfBirth',label:'Date de naissance',type:'date'},
        {key:'leaveType',label:'Type de conge',type:'select',options:['Conge prenatal','Conge postnatal','Conge de maternite complet']},
      ];
      const obs = {key:'observations',label:'Observations',type:'textarea',placeholder:'Complications eventuelles...'};
      const dur = {key:'totalDuration',label:'Duree totale (jours)',type:'text',placeholder:'auto-calcule'};
      const lt = certForm.leaveType;
      if (lt === 'Conge postnatal') {
        return [...base,
          {key:'dpa',label:"DPA ou Date d\'accouchement",type:'date'},
          {key:'endDate',label:'Fin du conge postnatal',type:'date'},
          dur, obs];
      }
      if (lt === 'Conge de maternite complet') {
        return [...base,
          {key:'dpa',label:'DPA (Date Prevue d\'Accouchement)',type:'date'},
          {key:'endDate',label:'Fin du conge de maternite',type:'date'},
          dur, obs];
      }
      return [...base,
        {key:'dpa',label:'DPA (Date Prevue d\'Accouchement)',type:'date'},
        {key:'startDate',label:'Debut conge prenatal',type:'date'},
        dur, obs];
    }
    return certFields[t];
  };
    fields.forEach(f => { if (f.type === 'date' && f.key === 'certDate') return; defaults[f.key] = ''; });
    if (patient) {
      const p = patient;
      defaults.fullName = (p.user?.firstName || '') + ' ' + (p.user?.lastName || '');
      if (p.dateOfBirth) defaults.dateOfBirth = new Date(p.dateOfBirth).toISOString().slice(0,10);
    }
    setCertForm(defaults);
    setShowCertModal(true);
  };

  const updCert = (patch: Record<string,string>) => setCertForm(prev => {
    const updated = { ...prev, ...patch };
    // Auto-calculate durationDays for MEDICAL_REST when dates change
    if (certType === 'MEDICAL_REST' && ('startDate' in patch || 'endDate' in patch)) {
      if (updated.startDate && updated.endDate) {
        const start = new Date(updated.startDate);
        const end = new Date(updated.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          updated.durationDays = String(diffDays);
        }
      }
    }
    // Auto-calculate totalDuration for MATERNITY_LEAVE
    if (certType === 'MATERNITY_LEAVE') {
      if ('leaveType' in patch) {
        if (patch.leaveType !== 'Conge prenatal') updated.startDate = '';
        if (patch.leaveType !== 'Conge postnatal' && patch.leaveType !== 'Conge de maternite complet') updated.endDate = '';
        updated.totalDuration = '';
      }
      const lt = updated.leaveType;
      if (lt === 'Conge prenatal' && updated.startDate && updated.dpa) {
        const diff = Math.ceil(Math.abs(new Date(updated.dpa).getTime() - new Date(updated.startDate).getTime()) / (1000*60*60*24));
        if (diff >= 0) updated.totalDuration = String(diff) + ' jours';
      } else if ((lt === 'Conge postnatal' || lt === 'Conge de maternite complet') && updated.endDate && updated.dpa) {
        const diff = Math.ceil(Math.abs(new Date(updated.endDate).getTime() - new Date(updated.dpa).getTime()) / (1000*60*60*24));
        if (diff >= 0) updated.totalDuration = String(diff) + ' jours';
      }
    }
    // Auto-calculate restDuration for POST_OPERATIVE
    if (certType === 'POST_OPERATIVE' && (updated.interventionDate && updated.resumptionDate) && ('interventionDate' in patch || 'resumptionDate' in patch)) {
      const diff = Math.ceil(Math.abs(new Date(updated.resumptionDate).getTime() - new Date(updated.interventionDate).getTime()) / (1000*60*60*24));
      if (diff >= 0) updated.restDuration = String(diff) + ' jours';
    }
    return updated;
  });

  const handleSaveCert = async () => {
    setCertSaving(true);
    try {
      await (doctorAPI as any).createCertificate({ patientId: id, type: certType, content: certForm });
      loadCertificates();
      setShowCertModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la creation');
    } finally { setCertSaving(false); }
  };

  
  
    const [editingCertId, setEditingCertId] = useState<string | null>(null);

  const handleUpdateCert = async () => {
    if (!editingCertId) return;
    setCertSaving(true);
    try {
      await (doctorAPI as any).updateCertificate(editingCertId, { type: certType, content: certForm });
      loadCertificates();
      setShowCertModal(false);
      setEditingCertId(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la modification');
    } finally { setCertSaving(false); }
  };
  const handleEditCert = (cert: any) => {
    setCertType(cert.type);
    setEditingCertId(cert.id);
    const fields = certFields[cert.type] || [];
    const data = typeof cert.content === 'string' ? JSON.parse(cert.content || '{}') : (cert.content || {});
    const defaults: Record<string,string> = {};
    fields.forEach((f: any) => { defaults[f.key] = (data[f.key] || '') + ''; });
    setCertForm(defaults);
    setShowCertModal(true);
  };
  const handleDeleteCert = async (certId: string) => {
    try {
      await (doctorAPI as any).deleteCertificate(certId);
      loadCertificates();
    } catch { alert('Erreur lors de la suppression'); }
  };

  const handleDeletePresc = async (prescId: string) => {
    try {
      await (doctorAPI as any).deletePrescription(prescId);
      load();
      setConfirmAction(null);
    } catch { alert('Erreur lors de la suppression'); }
  };

  const loadCertificates = () => {
    if (!id) return;
    (doctorAPI as any).getCertificates({ patientId: id }).then((r: any) => {
      setCertificates(r.data.data?.certificates || r.data.data || []);
    }).catch(() => {});
  };
  const loadLetters = () => {
    doctorAPI.getMedicalLetters({ patientId: id }).then((r: any) => setLetters(r.data.data?.letters || [])).catch(() => {});
  };
  useEffect(() => { loadLetters(); }, [id]);
  useEffect(() => { loadCertificates(); }, [id]);

    const handlePrintCert = async (certId: string) => {
    try {
      const res = await (doctorAPI as any).getCertificateById(certId);
      const cert = res.data.data;
      const c = typeof cert.content === 'string' ? JSON.parse(cert.content || '{}') : (cert.content || {});
      const pName = (cert.patient?.user?.firstName||'') + ' ' + (cert.patient?.user?.lastName||'');
      const pAge = cert.patient?.dateOfBirth ? Math.floor((Date.now() - new Date(cert.patient.dateOfBirth).getTime()) / (365.25*24*60*60*1000)) + ' ans' : '--';
      const fullAddr = [(doctorProfile?.address||''), (doctorProfile?.city||''), (doctorProfile?.postalCode||'')].filter(Boolean).join(', ');
      let logoHtml = '';
      if (doctorProfile?.logo) {
        try {
          const imgUrl = API_BASE.replace('/api','') + doctorProfile.logo;
          const imgRes = await fetch(imgUrl);
          const blob = await imgRes.blob();
          logoHtml = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve('<img class="rx-doctor-logo" src="' + reader.result + '" />');
            reader.readAsDataURL(blob);
          });
        } catch { logoHtml = ''; }
      }
      const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '.......................................';
      const fld = (v: string) => v || '.......................................';
      let bodyHtml = '';
      switch (cert.type) {
        case 'APTITUDE':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</strong>, ' + (doctorProfile?.specialization||'medecin specialiste') + ', certifie que :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p>' +
            (c.cin ? '<p><strong>CIN :</strong> ' + c.cin + '</p>' : '') +
            '<p><strong>Date du certificat :</strong> ' + fmt(c.certDate) + '</p></div>' +
            '<p>Apres examen medical, je certifie que la patiente est :</p>' +
            '<div class="cert-details"><p><strong>' + fld(c.aptitudeType) + '</strong></p></div>' +
            (c.validityDuration ? '<p>Ce certificat est valable pour une duree de <strong>' + c.validityDuration + '</strong>.</p>' : '') +
            (c.observations ? '<div class="cert-observations"><strong>Observations :</strong> ' + c.observations + '</div>' : '');
          break;
        case 'MEDICAL_REST':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</strong>, ' + (doctorProfile?.specialization||'medecin specialiste') + ', certifie que :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p></div>' +
            '<p>La patiente necessite un repos medical pour la duree et les conditions suivantes :</p>' +
            '<div class="cert-details">' +
            '<p><strong>Du :</strong> ' + fmt(c.startDate) + ' <strong>Au :</strong> ' + fmt(c.endDate) + ' (' + fld(c.durationDays) + ' jours)</p>' +
            '<p><strong>Motif medical :</strong> ' + fld(c.medicalReason) + '</p>' +
            (c.sorties ? '<p><strong>Sorties :</strong> ' + c.sorties + '</p>' : '') +
            '</div>' +
            (c.recommendations ? '<div class="cert-observations"><strong>Recommandations :</strong> ' + c.recommendations + '</div>' : '');
          break;
        case 'PREGNANCY_WORK':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</strong>, ' + (doctorProfile?.specialization||'medecin specialiste') + ', certifie la grossesse de :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p>' +
            '<p><strong>Terme actuel (Semaines d\'Amenorrhee) :</strong> ' + fld(c.currentTerm) + ' SA</p>' +
            '<p><strong>DPA (Date Prevue d\'Accouchement) :</strong> ' + fmt(c.dpa) + '</p></div>' +
            '<p>En consequence, je recommande la mesure suivante :</p>' +
            '<div class="cert-details"><p><strong>Mesure :</strong> ' + fld(c.measure) + '</p>' +
            '<p><strong>Duree :</strong> ' + (c.durationDate ? 'jusqu\'au ' + fmt(c.durationDate) : '') + (c.durationDate && c.duration ? ' - ' : '') + fld(c.duration) + '</p></div>' +
            (c.medicalContext ? '<div class="cert-observations"><strong>Contexte medical :</strong> ' + c.medicalContext + '</div>' : '');
          break;
        case 'MATERNITY_LEAVE':
          const matDates = (c.leaveType === 'Conge postnatal')
            ? '<p><strong>DPA ou Date d\'accouchement :</strong> ' + fmt(c.dpa) + '</p><p><strong>Fin du conge :</strong> ' + fmt(c.endDate) + '</p>'
            : (c.leaveType === 'Conge de maternite complet')
            ? '<p><strong>DPA :</strong> ' + fmt(c.dpa) + '</p><p><strong>Fin du conge :</strong> ' + fmt(c.endDate) + '</p>'
            : '<p><strong>DPA (Date Prevue d\'Accouchement) :</strong> ' + fmt(c.dpa) + '</p><p><strong>Debut :</strong> ' + fmt(c.startDate) + '</p>';
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</strong>, ' + (doctorProfile?.specialization||'medecin specialiste') + ', certifie que :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p></div>' +
            '<p>La patiente beneficie d\'un conge de maternite dans les conditions suivantes :</p>' +
            '<div class="cert-details"><p><strong>Type :</strong> ' + fld(c.leaveType) + '</p>' +
            matDates +
            '<p><strong>Duree totale :</strong> ' + fld(c.totalDuration) + '</p></div>' +
            (c.observations ? '<div class="cert-observations"><strong>Observations :</strong> ' + c.observations + '</div>' : '');
          break;
        case 'RETURN_TO_WORK':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</strong>, ' + (doctorProfile?.specialization||'medecin specialiste') + ', autorise la reprise du travail de :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p></div>' +
            '<p>Arret de travail pour le motif suivant :</p>' +
            '<div class="cert-details">' +
            '<p><strong>Motif de l\'arret :</strong> ' + fld(c.stopReason) + '</p>' +
            '<p><strong>Date de reprise :</strong> ' + fmt(c.returnDate) + '</p>' +
            '<p><strong>Type de reprise :</strong> ' + fld(c.returnType) + '</p></div>' +
            '<p>Aucune contre-indication medicale a la reprise du travail.</p>' +
            (c.recommendations ? '<div class="cert-observations"><strong>Recommandations :</strong> ' + c.recommendations + '</div>' : '');
          break;
        case 'POST_OPERATIVE':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</strong>, ' + (doctorProfile?.specialization||'medecin specialiste') + ', certifie que :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p></div>' +
            '<p>La patiente a beneficie d\'une intervention chirurgicale dans les conditions suivantes :</p>' +
            '<div class="cert-details">' +
            '<p><strong>Acte chirurgical :</strong> ' + fld(c.surgicalProcedure) + '</p>' +
            '<p><strong>Date d\'intervention :</strong> ' + fmt(c.interventionDate) + '</p>' +
            '<p><strong>Repos prescrit :</strong> ' + fld(c.restDuration) + '</p>' +
            '<p><strong>Reprise d\'activite le :</strong> ' + fmt(c.resumptionDate) + '</p>' +
            (c.restrictions ? '<p><strong>Restrictions :</strong> ' + c.restrictions + '</p>' : '') +
            '</div>' +
            (c.recommendations ? '<div class="cert-observations"><strong>Recommandations :</strong> ' + c.recommendations + '</div>' : '');
          break;
        default:
          bodyHtml = '<p>Contenu du certificat</p>';
      }
      const certTitles: Record<string,string> = {
        APTITUDE: 'CERTIFICAT MEDICAL', MEDICAL_REST: 'CERTIFICAT DE REPOS MEDICAL',
        PREGNANCY_WORK: 'CERTIFICAT MEDICAL - GROSSESSE ET TRAVAIL',
        MATERNITY_LEAVE: 'CERTIFICAT DE CONGE MATERNITE', RETURN_TO_WORK: 'CERTIFICAT DE REPRISE DU TRAVAIL',
        POST_OPERATIVE: 'CERTIFICAT MEDICAL POST-OPERATOIRE',
      };
      const title = certTitles[cert.type] || 'CERTIFICAT MEDICAL';
      const html = '<div>' +
        '<div class="rx-header">' + logoHtml +
        '<div class="rx-info">' +
        '<div class="rx-clinic-name">' + (doctorProfile?.clinicName||'') + '</div>' +
        '<h2>Dr ' + (doctorProfile?.lastName||'') + ' ' + (doctorProfile?.firstName||'') + '</h2>' +
        '<div class="rx-specialty">' + (doctorProfile?.specialization||'Gynecologie-Obstetrique') + '</div>' +
        '<div class="rx-services">' + (doctorProfile?.services||'') + '</div>' +
        '<div class="rx-address">' + fullAddr + '</div>' +
        '<div class="rx-contact">' + (doctorProfile?.phone||'') + (doctorProfile?.email?' . ':'') + (doctorProfile?.email||'') + '</div>' +
        '</div></div>' +
        '<div class="rx-title">' + title + '</div>' +
        '<div class="rx-patient"><div><strong>Patiente :</strong> ' + pName + '</div><div><strong>Age :</strong> ' + pAge + '</div></div>' +
        '<div class="rx-date-place">Fait a ' + (doctorProfile?.city||'Tunis') + ', le ' + new Date(cert.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) + '</div>' +
        '<div class="cert-body">' + bodyHtml + '</div>' +
        '<div class="rx-footer"><div class="rx-signature"><div class="rx-sig-line">Signature et cachet du medecin</div></div></div>' +
        '</div>';
      printInIframe(html);
    } catch { alert('Erreur lors du chargement'); }
  };
  const openConsultModal = () => {
    setForm(emptyForm(patient));
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await doctorAPI.createConsultation({
        patientId: id,
        date: form.date,
        type: form.type,
        chiefComplaint: form.chiefComplaint,
        symptoms: form.symptoms,
        clinicalExam: form.clinicalExam,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        notes: form.notes,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        bloodPressure: form.bloodPressure,
        temperature: form.temperature ? parseFloat(form.temperature) : undefined,
        nextVisit: form.nextVisit || undefined,
      });
      load();
      setShowModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const upd = (patch: any) => setForm(prev => ({ ...prev, ...patch }));

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!patient) return null;

  const u = patient.user;
  const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'info', label: 'Informations' },
    { key: 'consultations', label: 'Consultations', count: patient.consultations?.length },
    { key: 'exams', label: 'Examens cliniques', count: examCount },
    { key: 'prescriptions', label: 'Ordonnances', count: patient.prescriptions?.length },
    { key: 'certificates', label: 'Certificats', count: certificates?.length },
  { key: 'letters', label: 'Courriers medicaux', count: letters?.length },
    { key: 'appointments', label: 'Rendez-vous', count: patient.appointments?.length },
    { key: 'documents', label: 'Documents', count: documents?.length },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/patients')}>← Retour</button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 500 }}>{u.firstName} {u.lastName}</h2>
            <p className="text-muted text-sm">{u.email} · {calcAge(patient.dateOfBirth)} ans · {patient.city || '—'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={openConsultModal}>+ Consultation</button>
          <button className="btn btn-outline btn-sm" onClick={openPrescModal}>+ Ordonnance</button>
          <button className="btn btn-outline btn-sm" onClick={openApptModal}>+ Rendez-vous</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} {t.count !== undefined && <span style={{ marginLeft: 4, opacity: 0.6 }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* ── TAB: Informations ── */}
      {tab === 'info' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">Informations personnelles</span></div>
            {[
              ['Nom complet', `${u.firstName} ${u.lastName}`],
              ['Email', u.email],
              ['Téléphone', u.phone || '—'],
              ['Âge', `${calcAge(patient.dateOfBirth)} ans`],
              ['Adresse', patient.address || '—'],
              ['Ville', patient.city || '—'],
              ['Code postal', patient.postalCode || '—'],
              ['Pays', patient.country || '—'],
            ].map(([label, value]) => (
              <div className="detail-row" key={label}><span className="detail-label">{label}</span><span>{value}</span></div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Antécédents médicaux</span></div>
            {[
              ['Groupe sanguin', patient.bloodType || '—'],
              ['Allergies', patient.allergies || 'Aucune'],
              ['Maladies chroniques', patient.chronicDiseases || 'Aucune'],
              ['Antécédents familiaux', patient.familyHistory || 'Aucun'],
              ['Médicaments actuels', patient.currentMedications || 'Aucun'],
              ['Dernières règles', patient.lastMenstrualPeriod ? new Date(patient.lastMenstrualPeriod).toLocaleDateString('fr-FR') : '—'],
              ['Contraception', patient.contraceptionMethod || '—'],
              ['Grossesses', patient.numberOfPregnancies],
              ['Accouchements', patient.numberOfDeliveries],
              ['Contact urgence', patient.emergencyContact || '—'],
              ['Tél. urgence', patient.emergencyPhone || '—'],
            ].map(([label, value]) => (
              <div className="detail-row" key={label}><span className="detail-label">{label}</span><span>{value}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Consultations ── */}
      {tab === 'consultations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!patient.consultations?.length ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">📋</div><p>Aucune consultation</p></div></div>
          ) : patient.consultations.map((c: any) => (
            <div className="card" key={c.id}>
              <div className="card-header">
                <span style={{ fontWeight: 500 }}>{new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + new Date(c.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
                <span className="badge badge-info">{typeLabels[c.type] || c.type}</span>
              </div>
              {c.chiefComplaint && <div className="detail-row"><span className="detail-label">Motif de consultation</span><span>{c.chiefComplaint}</span></div>}
              {c.symptoms && <div className="detail-row"><span className="detail-label">Symptômes</span><span>{c.symptoms}</span></div>}
              {c.weight && <div className="detail-row"><span className="detail-label">Poids</span><span>{c.weight} kg</span></div>}
              {c.bloodPressure && <div className="detail-row"><span className="detail-label">Tension artérielle</span><span>{c.bloodPressure}</span></div>}
              {c.diagnosis && <div className="detail-row"><span className="detail-label">Diagnostic</span><span style={{ fontWeight: 500 }}>{c.diagnosis}</span></div>}
              {c.treatment && <div className="detail-row"><span className="detail-label">Traitement</span><span>{c.treatment}</span></div>}
              {c.notes && <div className="detail-row"><span className="detail-label">Notes</span><span>{c.notes}</span></div>}
              {c.nextVisit && <div className="detail-row"><span className="detail-label">Prochain RDV</span><span style={{ color: 'var(--info)' }}>{new Date(c.nextVisit).toLocaleDateString('fr-FR')}</span></div>}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Examens cliniques ── */}
      {tab === 'exams' && <ClinicalExamTab patientId={id!} patientName={`${u.firstName} ${u.lastName}`} doctorProfile={doctorProfile} API_BASE={API_BASE} />}

      {/* ── TAB: Ordonnances ── */}
      {tab === 'prescriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!patient.prescriptions?.length ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">💊</div><p>Aucune ordonnance</p></div></div>
          ) : patient.prescriptions.map((p: any) => (
            <div className="card" key={p.id} style={{ borderLeft: `3px solid ${p.isValid ? 'var(--success)' : 'var(--border)'}` }}>
              <div className="card-header">
                <span style={{ fontWeight: 500 }}>Ordonnance du {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + new Date(p.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${p.isValid ? 'badge-success' : 'badge-muted'}`}>{p.isValid ? 'Valide' : 'Expirée'}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => handlePrintPresc(p.id)}>🖨 Imprimer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleEditPresc(p)}>✏ Modifier</button>
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: '#f5c6c3' }} onClick={() => setConfirmAction({type:'prescription',id:p.id,label:'cette ordonnance'})}>Supprimer</button>
                </div>
              </div>
              <table>
                <thead><tr><th>Médicament</th><th>Dosage</th><th>Fréquence</th><th>Durée</th><th>Instructions</th></tr></thead>
                <tbody>
                  {(p.medications || []).map((m: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{m.name}</td>
                      <td>{m.dosage}</td>
                      <td>{m.frequency}</td>
                      <td>{m.duration}</td>
                      <td>{m.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {p.notes && <p className="text-sm text-muted" style={{ marginTop: 8 }}>Note : {p.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Certificats ── */}
      {tab === 'certificates' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(certTypeLabels).map(([k, v]) => (
              <button key={k} className={`btn btn-sm ${certType === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => openCertModal(k)} style={{ fontSize: 12 }}>
                {certTypeIcons[k]} {v}
              </button>
            ))}
          </div>
          {!certificates?.length ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">📄</div><p>Aucun certificat genere</p><p className="text-muted text-sm">Choisissez un type ci-dessus pour en creer un</p></div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {certificates.map((cert: any) => (
                <div className="card" key={cert.id} style={{ borderLeft: '3px solid var(--primary)' }}>
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{certTypeIcons[cert.type] || '📄'}</span>
                      <span style={{ fontWeight: 500 }}>{certTypeLabels[cert.type] || cert.type}</span>
                      <span className="badge badge-info">{new Date(cert.date).toLocaleDateString('fr-FR') + ' ' + new Date(cert.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) + ' ' + new Date(cert.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handlePrintCert(cert.id)}>🖨 Imprimer</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEditCert(cert)}>✏ Modifier</button>
                      <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: '#f5c6c3' }} onClick={() => setConfirmAction({type:'certificate',id:cert.id,label:'ce certificat'})}>Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Courriers medicaux ── */}
      {tab === 'letters' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(letterTypeLabels).map(([k, v]) => (
              <button key={k} className={'btn btn-sm ' + (letterForm.type === k ? 'btn-primary' : 'btn-outline')} onClick={() => openLetterModal(k)} style={{ fontSize: 12 }}>
                + {v}
              </button>
            ))}
          </div>
          {!letters?.length ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">✉️</div><p>Aucun courrier medical</p><p className="text-muted text-sm">Choisissez un type ci-dessus pour en creer un</p></div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {letters.map((letter: any) => (
                <div className="card" key={letter.id} style={{ borderLeft: '3px solid #6f42c1' }}>
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>✉️</span>
                      <span style={{ fontWeight: 500 }}>{letterTypeLabels[letter.type] || letter.type}</span>
                      <span className="badge badge-info">{new Date(letter.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span className="text-muted text-sm">→ {letter.recipient}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handlePrintLetter(letter.id)}>🖨 Imprimer</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEditLetter(letter)}>✏ Modifier</button>
                      <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: '#f5c6c3' }} onClick={() => handleDeleteLetter(letter.id)}>Supprimer</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}><strong>Objet :</strong> {letter.subject}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Courrier */}
      {letterModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>{editingLetterId ? 'Modifier le courrier' : 'Nouveau courrier medical'}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setLetterModal(false)}>Fermer</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Type</label>
                <select value={letterForm.type} onChange={e => setLetterForm({ ...letterForm, type: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
                  {Object.entries(letterTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Destinataire</label>
                <input value={letterForm.recipient} onChange={e => setLetterForm({ ...letterForm, recipient: e.target.value })} placeholder="Dr Dupont, Hopital Saint-Louis..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Objet</label>
                <input value={letterForm.subject} onChange={e => setLetterForm({ ...letterForm, subject: e.target.value })} placeholder="Objet du courrier" style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Contenu du courrier</label>
                <textarea value={letterForm.body} onChange={e => setLetterForm({ ...letterForm, body: e.target.value })} placeholder="Redigez le contenu du courrier ici..." rows={12} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontFamily: 'inherit', lineHeight: 1.7 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setLetterModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSaveLetter}>{editingLetterId ? 'Modifier' : 'Creer le courrier'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* ── TAB: Rendez-vous ── */}
      {tab === 'appointments' && (
        <div className="card" style={{ padding: 0 }}>
          {!patient.appointments?.length ? (
            <div className="empty-state"><div className="empty-icon">📅</div><p>Aucun rendez-vous</p></div>
          ) : (
            <table>
              <thead><tr><th>Date</th><th>Heure</th><th>Type</th><th>Motif</th><th>Statut</th></tr></thead>
              <tbody>
                {patient.appointments.map((a: any) => (
                  <tr key={a.id}>
                    <td>{new Date(a.startTime).toLocaleDateString('fr-FR')}</td>
                    <td>{new Date(a.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span className="badge badge-info">{typeLabels[a.type] || a.type}</span></td>
                    <td>{a.reason || '—'}</td>
                    <td>
                      <span className={`badge ${a.status === 'CONFIRMED' ? 'badge-success' : a.status === 'CANCELLED' ? 'badge-danger' : a.status === 'COMPLETED' ? 'badge-muted' : 'badge-info'}`}>
                        {a.status === 'SCHEDULED' ? 'Planifié' : a.status === 'CONFIRMED' ? 'Confirmé' : a.status === 'CANCELLED' ? 'Annulé' : a.status === 'COMPLETED' ? 'Effectué' : 'Non présent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: Documents ── */}
      {tab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Documents</span>
            <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
              {uploading ? 'Envoi en cours...' : '+ Ajouter un document'}
            </button>
          </div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileInput}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx" />
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: 30, textAlign: 'center', marginBottom: 16, background: dragOver ? 'var(--primary-light)' : 'transparent', transition: 'all 0.15s' }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
            <p className="text-muted text-sm">Glissez-déposez vos fichiers ici</p>
            <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>PDF, Images, Word — Max 20 Mo</p>
          </div>
          {!documents.length ? (
            <div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-icon">📄</div><p>Aucun document</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc: any) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 22 }}>{getFileIcon(doc.mimeType)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{doc.name}</div>
                    <div className="text-muted text-sm">{doc.type} · {doc.size ? formatFileSize(doc.size) : '—'}</div>
                  </div>
                  <a href={`${API_BASE.replace('/api','')}${doc.url}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Voir</a>
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: '#f5c6c3' }} onClick={() => deleteDoc(doc.id)}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Nouvelle consultation ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header"><span className="modal-title">Nouvelle consultation — {u.firstName} {u.lastName}</span><button className="btn-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                {/* Info de base */}
                <div className="form-grid-3">
                  <div className="form-group"><label className="form-label">Date *</label><input className="form-control" type="datetime-local" value={form.date} onChange={e => upd({ date: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-control" value={form.type} onChange={e => upd({ type: e.target.value })}>
                      {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">DDR</label><input className="form-control" type="date" value={form.ddr} onChange={e => upd({ ddr: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Motif de consultation</label><textarea className="form-control" rows={2} value={form.chiefComplaint} onChange={e => upd({ chiefComplaint: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Symptômes</label><textarea className="form-control" rows={2} value={form.symptoms} onChange={e => upd({ symptoms: e.target.value })} /></div>

                {/* Examens */}
                <div className="card-header" style={{ padding: '12px 0 8px', marginBottom: 10 }}><span className="card-title">Examen clinique</span></div>
                <div className="form-grid-3">
                  <div className="form-group"><label className="form-label">Poids (kg)</label><input className="form-control" type="number" step="0.1" value={form.weight} onChange={e => upd({ weight: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Taille (cm)</label><input className="form-control" type="number" value={form.height} onChange={e => upd({ height: e.target.value })} /></div>
                  {imc && <div className="form-group"><label className="form-label">IMC</label><input className="form-control" value={imc} readOnly style={{ background: 'var(--bg)' }} /></div>}
                  <div className="form-group"><label className="form-label">TA</label><input className="form-control" placeholder="120/80" value={form.bloodPressure} onChange={e => upd({ bloodPressure: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Température (°C)</label><input className="form-control" type="number" step="0.1" value={form.temperature} onChange={e => upd({ temperature: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">FC (bpm)</label><input className="form-control" value={form.heartRate} onChange={e => upd({ heartRate: e.target.value })} /></div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">État général</label><input className="form-control" value={form.generalState} onChange={e => upd({ generalState: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Conjonctives</label><input className="form-control" value={form.conjonctives} onChange={e => upd({ conjonctives: e.target.value })} /></div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Auscultation cardiaque</label><input className="form-control" value={form.cardiacAuscultation} onChange={e => upd({ cardiacAuscultation: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Auscultation pulmonaire</label><input className="form-control" value={form.pulmonaryAuscultation} onChange={e => upd({ pulmonaryAuscultation: e.target.value })} /></div>
                </div>

                {/* Examen gynécologique */}
                <div className="card-header" style={{ padding: '12px 0 8px', marginBottom: 10 }}><span className="card-title">Examen gynécologique</span></div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Abdomen</label><input className="form-control" value={form.abdomen} onChange={e => upd({ abdomen: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">État utérin</label><input className="form-control" value={form.uterusState} onChange={e => upd({ uterusState: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Hauteur utérine</label><input className="form-control" value={form.uterineHeight} onChange={e => upd({ uterineHeight: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Présentation</label><input className="form-control" value={form.presentation} onChange={e => upd({ presentation: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">BCF</label><input className="form-control" value={form.bcf} onChange={e => upd({ bcf: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Annexes</label><input className="form-control" value={form.adnexa} onChange={e => upd({ adnexa: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Aspect du col</label><input className="form-control" value={form.cervixAspect} onChange={e => upd({ cervixAspect: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Pertes vaginales</label><input className="form-control" value={form.vaginalDischarge} onChange={e => upd({ vaginalDischarge: e.target.value })} /></div>
                </div>

                {/* Diagnostic et traitement */}
                <div className="card-header" style={{ padding: '12px 0 8px', marginBottom: 10 }}><span className="card-title">Conclusion</span></div>
                <div className="form-group"><label className="form-label">Diagnostic</label><textarea className="form-control" rows={3} value={form.diagnosis} onChange={e => upd({ diagnosis: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Traitement</label><textarea className="form-control" rows={3} value={form.treatment} onChange={e => upd({ treatment: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e => upd({ notes: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Prochain rendez-vous</label><input className="form-control" type="date" value={form.nextVisit} onChange={e => upd({ nextVisit: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer la consultation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Rendez-vous ── */}
      {showApptModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowApptModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">Nouveau rendez-vous</span>
              <button className="btn-close" onClick={() => setShowApptModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-control" type="date" value={apptForm.date} onChange={e => updAppt({ date: e.target.value })} />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Heure debut *</label>
                  <input className="form-control" type="time" value={apptForm.startTime} onChange={e => updAppt({ startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Heure fin *</label>
                  <input className="form-control" type="time" value={apptForm.endTime} onChange={e => updAppt({ endTime: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={apptForm.type} onChange={e => updAppt({ type: e.target.value })}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Motif</label>
                <textarea className="form-control" rows={2} placeholder="Motif du rendez-vous..." value={apptForm.reason} onChange={e => updAppt({ reason: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowApptModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCreateAppt} disabled={apptSaving}>
                {apptSaving ? 'Enregistrement...' : 'Creer le rendez-vous'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Ordonnance ── */}
      {showPrescModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPrescModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <span className="modal-title">{editingPrescId ? 'Modifier l\'ordonnance' : 'Nouvelle ordonnance'}</span>
              <button className="btn-close" onClick={() => setShowPrescModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 40px', gap: 8, fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                  <span>Médicament *</span><span>Dosage</span><span>Fréquence</span><span>Durée</span><span></span>
                </div>
                {prescMeds.map((med, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 40px', gap: 8, alignItems: 'center' }}>
                    <input className="form-control" placeholder="Nom" value={med.name} onChange={e => updateMed(i, { name: e.target.value })} />
                    <input className="form-control" placeholder="Dosage" value={med.dosage} onChange={e => updateMed(i, { dosage: e.target.value })} />
                    <input className="form-control" placeholder="Fréquence" value={med.frequency} onChange={e => updateMed(i, { frequency: e.target.value })} />
                    <input className="form-control" placeholder="Durée" value={med.duration} onChange={e => updateMed(i, { duration: e.target.value })} />
                    <button className="btn-close" style={{ fontSize: 16 }} onClick={() => removeMedRow(i)} disabled={prescMeds.length <= 1}>×</button>
                  </div>
                ))}
                <button className="btn btn-outline btn-sm" onClick={addMedRow} style={{ alignSelf: 'flex-start' }}>+ Ajouter un médicament</button>
              </div>
              <div className="form-group">
                <label className="form-label">Date de l'ordonnance</label>
                <input className="form-control" type="date" value={prescDate} onChange={e => setPrescDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} placeholder="Notes complémentaires..." value={prescNotes} onChange={e => setPrescNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPrescModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={editingPrescId ? handleUpdatePresc : handleCreatePresc} disabled={prescSaving}>
                {prescSaving ? 'Enregistrement...' : editingPrescId ? 'Modifier' : 'Créer l\'ordonnance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nouveau certificat ── */}
      {showCertModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCertModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">{certTypeIcons[certType]} {certTypeLabels[certType] || 'Certificat'}</span>
              <button className="btn-close" onClick={() => setShowCertModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(getCertFields(certType) || []).map((field: any) => (
                  <div key={field.key} style={field.type === 'textarea' ? { gridColumn: '1/-1' } : {}}>
                    <label className="form-label" style={{ fontSize: 12 }}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select className="form-control" value={certForm[field.key] || ''} onChange={e => updCert({ [field.key]: e.target.value })}>
                        <option value="">-- Choisir --</option>
                        {(field.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea className="form-control" rows={3} placeholder={field.placeholder} value={certForm[field.key] || ''} onChange={e => updCert({ [field.key]: e.target.value })} />
                    ) : (
                      <input className="form-control" type={field.type === 'date' ? 'date' : 'text'} placeholder={field.placeholder} value={certForm[field.key] || ''} onChange={e => updCert({ [field.key]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCertModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveCert} disabled={certSaving}>
                {certSaving ? 'Enregistrement...' : 'Generer le certificat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMPRESSION CERTIFICAT ── */}
      
            {/* ── CONFIRMATION MODAL ── */}
      {confirmAction && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>Souhaitez-vous supprimer {confirmAction.label} ?</p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>Non</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={() => {
                if (confirmAction.type === 'certificate') handleDeleteCert(confirmAction.id);
                else if (confirmAction.type === 'prescription') handleDeletePresc(confirmAction.id);
              }}>Oui, supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMPRESSION ORDONNANCE ── */}
          </div>
  );
};

export default PatientDetail;
