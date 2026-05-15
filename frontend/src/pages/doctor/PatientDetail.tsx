import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import ClinicalExamTab from './ClinicalExamTab';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Alert from '../../components/shared/Alert';
import PatientInfoTab from './patient/PatientInfoTab';
import PatientConsultationsTab from './patient/PatientConsultationsTab';
import PatientPrescriptionsTab from './patient/PatientPrescriptionsTab';
import PatientCertificatesTab from './patient/PatientCertificatesTab';
import PatientLettersTab from './patient/PatientLettersTab';
import PatientAppointmentsTab from './patient/PatientAppointmentsTab';
import PatientDocumentsTab from './patient/PatientDocumentsTab';
import { typeLabels, emptyLab } from './patient/constants';
import type { Tab } from './patient/constants';

type ConsultTab = 'accueil'|'examen'|'bilan'|'contexte';
type ClinicalCtx = 'obstetrique'|'infertilite'|null;

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
  const [showPatientEdit, setShowPatientEdit] = useState(false);
  const [patientSaving, setPatientSaving] = useState(false);
  const [patientForm, setPatientForm] = useState<any>({});
  const [letters, setLetters] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [alertMsg, setAlertMsg] = useState<{type:'success'|'error'|'warning'|'info';text:string}|null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message:string;onConfirm:()=>void;danger?:boolean}|null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

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
    doctorAPI.getPatientDocuments(id).then(r => setDocuments(r.data.data || [])).catch(() => setAlertMsg({type:'error', text:'Erreur chargement documents'}));
  };

  const loadLetters = () => {
    if (!id) return;
    doctorAPI.getMedicalLetters({ patientId: id }).then((r: any) => setLetters(Array.isArray(r.data.data) ? r.data.data : r.data.data?.letters || [])).catch(() => {});
  };

  const loadCertificates = () => {
    if (!id) return;
    (doctorAPI as any).getCertificates({ patientId: id }).then((r: any) => {
      setCertificates(r.data.data?.certificates || r.data.data || []);
    }).catch(() => setAlertMsg({type:'error', text:'Erreur chargement certificats'}));
  };

  useEffect(() => {
    if (!id) return;
    loadLetters();
    loadCertificates();
    (doctorAPI as any).getClinicalExams({ patientId: id }).then((r: any) => {
      if (r?.data?.data) setExamCount(r.data.data.length);
    }).catch(() => {});
    doctorAPI.getProfile().then(r => setDoctorProfile(r.data.data)).catch(() => {});
  }, [id]);

  const openConsultModal = () => {
    setForm(emptyForm(patient));
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const f = form as any;
      const examDetails: Record<string, any> = {};
      for (const key of ['conjonctives','cardiacAuscultation','pulmonaryAuscultation',
        'abdomen','uterusState','uterineHeight','presentation','bcf','adnexa',
        'cervixAspect','vaginalDischarge','dilatation','effacement','consistency',
        'presentationHeight','breastExam','oedemes','clinicalConclusion','echographie',
        'medicalHistory','surgicalHistory','familyHistory']) {
        if (f[key]) examDetails[key] = f[key];
      }
      const labKeys = ['hemoglobin','vgm','whiteBloodCells','platelets','ferritin','crp',
        'fsh','lh','estradiol','amh','progesterone','prolactine','tsh','testosterone','dheas',
        'glycemie','hba1c','hdl','creatinine','uricAcid','asat','alat','tp','tca',
        'fibrinogen','dDimers','bloodGroup','rai','bhcg','ca125','rubella','toxoplasmosis','hiv',
        'proteinuria','ecbu'];
      for (const key of labKeys) {
        if (f[key]) examDetails[key] = f[key];
      }
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
        height: form.height ? parseFloat(form.height) : undefined,
        bloodPressure: form.bloodPressure,
        temperature: form.temperature ? parseFloat(form.temperature) : undefined,
        heartRate: form.heartRate ? parseInt(form.heartRate) : undefined,
        generalState: form.generalState || undefined,
        ddr: form.ddr || undefined,
        examDetails: Object.keys(examDetails).length > 0 ? examDetails : undefined,
        nextVisit: form.nextVisit || undefined,
      });
      load();
      setShowModal(false);
    } catch (err: any) {
      setAlertMsg({type:'error', text: err.response?.data?.error || 'Erreur lors de la sauvegarde'});
    } finally { setSaving(false); }
  };

  const openPatientEdit = () => {
    const u = patient.user;
    setPatientForm({
      firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '',
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().slice(0, 10) : '',
      address: patient.address || '', city: patient.city || '', postalCode: patient.postalCode || '', country: patient.country || '',
      bloodType: patient.bloodType || '', allergies: patient.allergies || '', chronicDiseases: patient.chronicDiseases || '',
      familyHistory: patient.familyHistory || '', currentMedications: patient.currentMedications || '',
      lastMenstrualPeriod: patient.lastMenstrualPeriod ? new Date(patient.lastMenstrualPeriod).toISOString().slice(0, 10) : '',
      contraceptionMethod: patient.contraceptionMethod || '',
      numberOfPregnancies: patient.numberOfPregnancies || '', numberOfDeliveries: patient.numberOfDeliveries || '',
      emergencyContact: patient.emergencyContact || '', emergencyPhone: patient.emergencyPhone || '',
    });
    setShowPatientEdit(true);
  };

  const savePatient = async () => {
    setPatientSaving(true);
    try {
      const data: any = { ...patientForm };
      if (!data.dateOfBirth) delete data.dateOfBirth;
      if (!data.lastMenstrualPeriod) data.lastMenstrualPeriod = null;
      await doctorAPI.updatePatient(id!, data);
      const r = await doctorAPI.getPatient(id!);
      setPatient(r.data.data || r.data);
      setShowPatientEdit(false);
    } catch (e: any) { setAlertMsg({type:'error', text: e.response?.data?.error || 'Erreur'}); }
    finally { setPatientSaving(false); }
  };

  const upd = (patch: any) => setForm((prev: any) => ({ ...prev, ...patch }));

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
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} {t.count !== undefined && <span style={{ marginLeft: 4, opacity: 0.6 }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {showPatientEdit && (
        <div className="modal-overlay" onClick={() => setShowPatientEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <span className="modal-title">Modifier la fiche patiente</span>
              <button className="btn-close" onClick={() => setShowPatientEdit(false)}>x</button>
            </div>
            <div className="modal-body">
              <h4 className="section-title mb-12">Informations personnelles</h4>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Prenom</label><input className="form-control" value={patientForm.firstName || ''} onChange={e => setPatientForm({...patientForm, firstName: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Nom</label><input className="form-control" value={patientForm.lastName || ''} onChange={e => setPatientForm({...patientForm, lastName: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={patientForm.email || ''} onChange={e => setPatientForm({...patientForm, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Telephone</label><input className="form-control" value={patientForm.phone || ''} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Date de naissance</label><input className="form-control" type="date" value={patientForm.dateOfBirth || ''} onChange={e => setPatientForm({...patientForm, dateOfBirth: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Groupe sanguin</label><input className="form-control" value={patientForm.bloodType || ''} onChange={e => setPatientForm({...patientForm, bloodType: e.target.value})} /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Adresse</label><input className="form-control" value={patientForm.address || ''} onChange={e => setPatientForm({...patientForm, address: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Ville</label><input className="form-control" value={patientForm.city || ''} onChange={e => setPatientForm({...patientForm, city: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Code postal</label><input className="form-control" value={patientForm.postalCode || ''} onChange={e => setPatientForm({...patientForm, postalCode: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Pays</label><input className="form-control" value={patientForm.country || ''} onChange={e => setPatientForm({...patientForm, country: e.target.value})} /></div>
              </div>
              <h4 className="section-title mb-12" style={{ marginTop: 20 }}>Antecedents medicaux</h4>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Allergies</label><input className="form-control" value={patientForm.allergies || ''} onChange={e => setPatientForm({...patientForm, allergies: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Maladies chroniques</label><input className="form-control" value={patientForm.chronicDiseases || ''} onChange={e => setPatientForm({...patientForm, chronicDiseases: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Antecedents familiaux</label><input className="form-control" value={patientForm.familyHistory || ''} onChange={e => setPatientForm({...patientForm, familyHistory: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Medicaments actuels</label><input className="form-control" value={patientForm.currentMedications || ''} onChange={e => setPatientForm({...patientForm, currentMedications: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Dernieres regles</label><input className="form-control" type="date" value={patientForm.lastMenstrualPeriod || ''} onChange={e => setPatientForm({...patientForm, lastMenstrualPeriod: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Contraception</label><input className="form-control" value={patientForm.contraceptionMethod || ''} onChange={e => setPatientForm({...patientForm, contraceptionMethod: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Grossesses</label><input className="form-control" type="number" value={patientForm.numberOfPregnancies || ''} onChange={e => setPatientForm({...patientForm, numberOfPregnancies: parseInt(e.target.value) || 0})} /></div>
                <div className="form-group"><label className="form-label">Accouchements</label><input className="form-control" type="number" value={patientForm.numberOfDeliveries || ''} onChange={e => setPatientForm({...patientForm, numberOfDeliveries: parseInt(e.target.value) || 0})} /></div>
              </div>
              <h4 className="section-title mb-12" style={{ marginTop: 20 }}>Contact urgence</h4>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Contact urgence</label><input className="form-control" value={patientForm.emergencyContact || ''} onChange={e => setPatientForm({...patientForm, emergencyContact: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Tel. urgence</label><input className="form-control" value={patientForm.emergencyPhone || ''} onChange={e => setPatientForm({...patientForm, emergencyPhone: e.target.value})} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPatientEdit(false)}>Annuler</button>
              <button className="btn btn-primary" disabled={patientSaving} onClick={savePatient}>{patientSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'info' && <PatientInfoTab patient={patient} onEdit={openPatientEdit} />}
      {tab === 'consultations' && <PatientConsultationsTab consultations={patient.consultations} />}
      {tab === 'exams' && <ClinicalExamTab patientId={id!} patientName={`${u.firstName} ${u.lastName}`} doctorProfile={doctorProfile} API_BASE={process.env.REACT_APP_API_URL || "http://localhost:4000/api"} />}
      {tab === 'prescriptions' && <PatientPrescriptionsTab patient={patient} prescriptions={patient.prescriptions} doctorProfile={doctorProfile} onRefresh={load} onAlert={setAlertMsg} onConfirm={setConfirmDialog} />}
      {tab === 'certificates' && <PatientCertificatesTab patient={patient} certificates={certificates} doctorProfile={doctorProfile} onRefreshCertificates={loadCertificates} onAlert={setAlertMsg} />}
      {tab === 'letters' && <PatientLettersTab patient={patient} letters={letters} doctorProfile={doctorProfile} onRefreshLetters={loadLetters} onAlert={setAlertMsg} onConfirm={setConfirmDialog} />}
      {tab === 'appointments' && <PatientAppointmentsTab appointments={patient.appointments} patientId={id!} onRefresh={load} onAlert={setAlertMsg} />}
      {tab === 'documents' && <PatientDocumentsTab patientId={id!} documents={documents} onRefresh={loadDocuments} onAlert={setAlertMsg} onConfirm={setConfirmDialog} />}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span className="modal-title">Nouvelle consultation — {u.firstName} {u.lastName}</span>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
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

      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          message={confirmDialog.message}
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
          confirmDanger={confirmDialog.danger}
        />
      )}
      {alertMsg && (
        <Alert type={alertMsg.type} message={alertMsg.text} onClose={() => setAlertMsg(null)} autoClose={4000} />
      )}
    </div>
  );
};

export default PatientDetail;
