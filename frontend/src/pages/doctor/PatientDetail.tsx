import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
type Tab = 'info'|'consultations'|'prescriptions'|'appointments'|'documents';
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
  const [printLogoUrl, setPrintLogoUrl] = useState('');
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
    try {
      const res = await doctorAPI.getPrescriptionById(prescId);
      const profRes = await doctorAPI.getProfile();
      const logo = profRes.data.data?.logo;
      setDoctorProfile(profRes.data.data);
      setPrintPresc(res.data.data);
      if (logo) {
        try {
          const r = await fetch(API_BASE.replace("/api", "") + logo);
          const blob = await r.blob();
          const url: string = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          setPrintLogoUrl(url);
        } catch { setPrintLogoUrl(''); }
      } else { setPrintLogoUrl(''); }
      await new Promise(r => setTimeout(r, 300));
      window.print();
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
    { key: 'prescriptions', label: 'Ordonnances', count: patient.prescriptions?.length },
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
                <span style={{ fontWeight: 500 }}>{new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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

      {/* ── TAB: Ordonnances ── */}
      {tab === 'prescriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!patient.prescriptions?.length ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">💊</div><p>Aucune ordonnance</p></div></div>
          ) : patient.prescriptions.map((p: any) => (
            <div className="card" key={p.id} style={{ borderLeft: `3px solid ${p.isValid ? 'var(--success)' : 'var(--border)'}` }}>
              <div className="card-header">
                <span style={{ fontWeight: 500 }}>Ordonnance du {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${p.isValid ? 'badge-success' : 'badge-muted'}`}>{p.isValid ? 'Valide' : 'Expirée'}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => handlePrintPresc(p.id)}>🖨 Imprimer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleEditPresc(p)}>✏ Modifier</button>
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
                  <a href={`${API_BASE}${doc.url}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Voir</a>
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

      {/* ── IMPRESSION ORDONNANCE ── */}
      {printPresc && (
        <div className="print-prescription">
          <div className="rx-header">
            <div className="rx-doctor">
              {printLogoUrl && <img className="rx-doctor-logo" src={printLogoUrl} alt="Logo" />}
              <div className="rx-doctor-info">
                {doctorProfile?.clinicName && <div className="rx-clinic-name">{doctorProfile.clinicName}</div>}
                <h2>Dr {doctorProfile?.firstName || ''} {doctorProfile?.lastName || ''}</h2>
                <div className="rx-specialty">{doctorProfile?.specialization || ''}</div>
                {doctorProfile?.services && <div className="rx-services">{doctorProfile.services}</div>}
                <div className="rx-contact">
                  {doctorProfile?.email && <span>{doctorProfile.email}</span>}
                  {doctorProfile?.phone && <span> · {doctorProfile.phone}</span>}
                </div>
                <div className="rx-contact">
                  {doctorProfile?.address}{doctorProfile?.city ? `, ${doctorProfile.city}` : ''}{doctorProfile?.postalCode ? ` ${doctorProfile.postalCode}` : ''}
                </div>
                {doctorProfile?.licenseNumber && <div className="rx-contact">N° Licence : {doctorProfile.licenseNumber}{doctorProfile?.rppsNumber ? ` · RPPS : ${doctorProfile.rppsNumber}` : ''}</div>}
              </div>
            </div>
          </div>
          <div className="rx-title">Ordonnance Médicale</div>
          <div className="rx-patient">
            <div><strong>Patiente :</strong> {printPresc.patient?.user?.firstName} {printPresc.patient?.user?.lastName}</div>
            <div><strong>Âge :</strong> {printPresc.patient?.dateOfBirth ? calcAge(printPresc.patient.dateOfBirth) + ' ans' : '—'}</div>
          </div>
          <div className="rx-date-place">
          <div className="rx-date-place">
            <span>Fait à {doctorProfile?.city || 'Tunis'}, le {new Date(printPresc.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>          </div>
          <table className="rx-meds-table">
            <thead><tr><th>Médicament</th><th>Dosage</th><th>Fréquence</th><th>Durée</th><th>Instructions</th></tr></thead>
            <tbody>
              {(printPresc.medications || []).map((m: any, i: number) => (
                <tr key={i}><td style={{ fontWeight: 500 }}>{m.name}</td><td>{m.dosage}</td><td>{m.frequency}</td><td>{m.duration}</td><td>{m.instructions}</td></tr>
              ))}
            </tbody>
          </table>
          {printPresc.notes && (
            <div className="rx-notes"><strong>Notes :</strong> {printPresc.notes}</div>
          )}
          <div className="rx-footer">
            <div className="rx-signature"><div className="rx-sig-line">Signature et cachet du médecin</div></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
