import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
type Tab = 'info'|'consultations'|'prescriptions'|'appointments';
type ConsultTab = 'accueil'|'examen'|'bilan'|'contexte';
type ClinicalCtx = 'obstetrique'|'infertilite'|null;

const typeLabels: Record<string,string> = {
  FIRST_VISIT:'Première visite', FOLLOW_UP:'Suivi', EMERGENCY:'Urgence',
  ANNUAL_CHECKUP:'Bilan annuel', PRENATAL:'Prénatal', POSTNATAL:'Postnatal'
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
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [prescSaving, setPrescSaving] = useState(false);
  const [prescMeds, setPrescMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [prescNotes, setPrescNotes] = useState('');
  const [prescDate, setPrescDate] = useState(new Date().toISOString().slice(0, 10));
    const [printPresc, setPrintPresc] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [editingPrescId, setEditingPrescId] = useState<string | null>(null);

  const handleEditPresc = async (p: any) => {
    const meds = (p.medications || []).map((m: any) => ({
      name: m.name || '', dosage: m.dosage || '', frequency: m.frequency || '',
      duration: m.duration || '', instructions: m.instructions || '',
    }));
    setPrescMeds(meds.length > 0 ? meds : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setPrescNotes(p.notes || '');
    setEditingPrescId(p.id);
    setShowPrescModal(true);
  };

  const handleUpdatePresc = async () => {
    if (!editingPrescId) return;
    const validMeds = prescMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) { alert('Ajoutez au moins un medicament'); return; }
    setPrescSaving(true);
    try {
      await (doctorAPI as any).updatePrescription(editingPrescId, { medications: validMeds, notes: prescNotes || undefined });
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

  const openPrescModal = () => {
    setPrescMeds([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setEditingPrescId(null);
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

  const handlePrintPresc = async (prescId: string) => {
    try { const res = await doctorAPI.getPrescriptionById(prescId); setPrintPresc(res.data.data); setTimeout(() => window.print(), 300); }
    catch { alert('Erreur lors du chargement'); }
  };

  