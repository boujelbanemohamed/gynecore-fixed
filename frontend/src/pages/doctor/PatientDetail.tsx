import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
type Tab = 'info'|'consultations'|'prescriptions'|'appointments';
type ConsultTab = 'accueil'|'examen'|'bilan'|'contexte';
type ClinicalCtx = 'obstetrique'|'infertilite'|null;

const typeLabels: Record<string,string> = {
  FIRST_VISIT:'Premiere visite', FOLLOW_UP:'Suivi', EMERGENCY:'Urgence',
  ANNUAL_CHECKUP:'Bilan annuel', PRENATAL:'Prenatal', POSTNATAL:'Postnatal'
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
  generalState: 'Bon etat general', conjonctives: 'Rosees', oedemes: 'Absents',
  cardiacAuscultation: 'Rythme', pulmonaryAuscultation: 'Murmure vesiculaire normal',
  abdomen: 'Souple', uterusState: 'Non gravide', uterineHeight: '',
  presentation: 'Cephalique', bcf: 'POSITIFS', adnexa: 'Libres et indolores',
  cervixAspect: 'Aspect normal', vaginalDischarge: 'Leucorrhees physiologiques',
  dilatation: 'Col ferme', effacement: 'Non efface', consistency: 'Ferme', presentationHeight: '-3 (mobile)',
  breastExam: 'Seins symetriques', clinicalConclusion: '', echographie: '',
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
  const [consultations, setConsultations] = useState<any[]>([]);

  const handleEditPresc = async (p: any) => {
    const meds = (p.medications || []).map((m: any) => ({
      name: m.name || '', dosage: m.dosage || '', frequency: m.frequency || '',
      duration: m.duration || '', instructions: m.instructions || '',
    }));
    setPrescMeds(meds.length > 0 ? meds : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setPrescNotes(p.notes || '');
    setPrescDate(p.date ? p.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditingPrescId(p.id);
    setShowPrescModal(true);
  };

  const handleUpdatePresc = async () => {
    if (!editingPrescId) return;
    const validMeds = prescMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) { alert('Ajoutez au moins un medicament'); return; }
    setPrescSaving(true);
    try {
      await (doctorAPI as any).updatePrescription(editingPrescId, {
        medications: validMeds,
        notes: prescNotes || undefined,
        date: prescDate || undefined,
      });
      load(); setShowPrescModal(false); setEditingPrescId(null);
    } catch (err: any) { alert(err.response?.data?.error || 'Erreur lors de la modification'); }
    finally { setPrescSaving(false); }
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
    loadConsultations();
  };

  const loadConsultations = () => {
    if (!id) return;
    (doctorAPI as any).getPatientConsultations(id).then((r: any) => setConsultations(r.data.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, [id]);

  const loadDocuments = () => {
    if (!id) return;
    doctorAPI.getPatientDocuments(id).then(r => setDocuments(r.data.data || [])).catch(() => {});
  };

  const uploadFile = async (file: File) => {
    if (!id) return; setUploading(true);
    try { await doctorAPI.uploadDocument(file, id); loadDocuments(); }
    catch (err: any) { alert(err.response?.data?.error || "Erreur upload"); }
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
    catch { alert('Erreur suppression'); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return '\uD83D\uDDBC\uFE0F';
    if (mimeType === 'application/pdf') return '\uD83D\uDCC4';
    return '\uD83D\uDCE7';
  };

  const loadDoctorProfile = () => {
    doctorAPI.getProfile().then(r => setDoctorProfile(r.data.data)).catch(() => {});
  };
  useEffect(() => { loadDoctorProfile(); }, []);

  const openPrescModal = () => {
    setPrescMeds([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setEditingPrescId(null);
    setPrescDate(new Date().toISOString().slice(0, 10));
    setPrescNotes(''); setShowPrescModal(true);
  };

  const addMedRow = () => setPrescMeds([...prescMeds, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeMedRow = (i: number) => setPrescMeds(prescMeds.filter((_, idx) => idx !== i));
  const updateMed = (i: number, patch: any) => setPrescMeds(prescMeds.map((m, idx) => idx === i ? { ...m, ...patch } : m));

  const handleCreatePresc = async () => {
    const validMeds = prescMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) { alert('Ajoutez au moins un medicament'); return; }
    setPrescSaving(true);
    try {
      await doctorAPI.createPrescription({ patientId: id, medications: validMeds, notes: prescNotes || undefined, date: prescDate || undefined });
      load(); setShowPrescModal(false);
    } catch (err: any) { alert(err.response?.data?.error || 'Erreur creation'); }
    finally { setPrescSaving(false); }
  };

  const handlePrintPresc = async (prescId: string) => {
    try { const res = await doctorAPI.getPrescriptionById(prescId); setPrintPresc(res.data.data); setTimeout(() => window.print(), 300); }
    catch { alert('Erreur chargement'); }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

  const updateForm = (patch: any) => setForm(prev => ({ ...prev, ...patch }));

  const saveConsultation = async () => {
    if (!id) return; setSaving(true);
    try {
      await doctorAPI.createConsultation({ patientId: id, ...form });
      setShowModal(false); setForm(emptyForm(patient)); load();
    } catch (err: any) { alert(err.response?.data?.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const city = useMemo(() => {
    if (!doctorProfile) return 'Tunis';
    if (doctorProfile.city) return doctorProfile.city;
    const addr = doctorProfile.address || '';
    const parts = addr.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : 'Tunis';
  }, [doctorProfile]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div className="screen-only" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}><div style={{ fontSize: '24px', color: '#666' }}>Chargement...</div></div>
        ) : !patient ? null : (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <button onClick={() => navigate('/patients')} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>&larr; Retour</button>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{patient.firstName} {patient.lastName}</h1>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                  {patient.dateOfBirth ? 'Nee le ' + formatDate(patient.dateOfBirth) : ''}
                  {patient.phone ? ' | ' + patient.phone : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
              {([['info','Informations'],['consultations','Consultations'],['prescriptions','Ordonnances'],['appointments','Rendez-vous']] as [Tab,string][]).map(([k,l]) => (
                <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 20px', border: 'none', borderBottom: tab===k?'2px solid #7c3aed':'2px solid transparent', background: 'none', cursor: 'pointer', fontWeight: tab===k?'bold':'normal', color: tab===k?'#7c3aed':'#666', marginBottom: '-2px' }}>{l}</button>
              ))}
            </div>

            {tab === 'info' && (
              <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {([['Nom',patient.lastName],['Prenom',patient.firstName],['Date de naissance',formatDate(patient.dateOfBirth)],['Telephone',patient.phone],['Email',patient.email],['Adresse',patient.address],['Groupe sanguin',patient.bloodGroup],['Antecedents medicaux',patient.medicalHistory],['Antecedents chirurgicaux',patient.surgicalHistory],['Antecedents familiaux',patient.familyHistory]] as [string,string][]).map(([label,value]) => (
                    <div key={label}><label style={{ display:'block', fontSize:'12px', color:'#888', marginBottom:'4px' }}>{label}</label><div style={{ padding:'8px 12px', background:'#f9fafb', borderRadius:'6px', fontSize:'14px', minHeight:'36px' }}>{value || '-'}</div></div>
                  ))}
                </div>
                <div style={{ marginTop: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Documents</h3>
                    <div>
                      <input ref={fileInputRef} type="file" multiple onChange={handleFileInput} style={{ display: 'none' }} />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ background:'#7c3aed', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', cursor: uploading?'not-allowed':'pointer' }}>{uploading ? 'Upload...' : '+ Ajouter'}</button>
                    </div>
                  </div>
                  <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop} style={{ border: '2px dashed '+(dragOver?'#7c3aed':'#d1d5db'), borderRadius:'8px', padding:'24px', textAlign:'center', marginBottom:'16px', background: dragOver?'#f5f3ff':'#fafafa' }}>Glissez-deposez vos fichiers ici</div>
                  {documents.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {documents.map((doc:any)=>(
                        <div key={doc.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', background:'#f9fafb', borderRadius:'8px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}><span>{getFileIcon(doc.mimeType)}</span><span style={{ fontSize:'14px' }}>{doc.originalName||doc.name}</span><span style={{ fontSize:'12px', color:'#888' }}>({formatFileSize(doc.size||0)})</span></div>
                          <button onClick={()=>deleteDoc(doc.id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}>Supprimer</button>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ textAlign:'center', color:'#888', padding:'16px' }}>Aucun document</p>}
                </div>
              </div>
            )}

            {tab === 'consultations' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <h2 style={{ fontSize:'20px', fontWeight:'bold' }}>Consultations</h2>
                  <button onClick={()=>{setForm(emptyForm(patient));setShowModal(true);}} style={{ background:'#7c3aed', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', cursor:'pointer' }}>+ Nouvelle consultation</button>
                </div>
                {consultations.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                    {consultations.map((c:any)=>(
                      <div key={c.id} style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', padding:'16px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div><span style={{ fontWeight:'bold' }}>{formatDate(c.date)}</span><span style={{ marginLeft:'12px', color:'#666' }}>{typeLabels[c.type]||c.type}</span></div>
                        </div>
                        {c.chiefComplaint && <p style={{ margin:'8px 0 0', color:'#555' }}>{c.chiefComplaint}</p>}
                        {c.diagnosis && <p style={{ margin:'4px 0 0', color:'#555' }}>Diagnostic: {c.diagnosis}</p>}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center', color:'#888' }}>Aucune consultation</div>}
              </div>
            )}

            {tab === 'prescriptions' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <h2 style={{ fontSize:'20px', fontWeight:'bold' }}>Ordonnances</h2>
                  <button onClick={openPrescModal} style={{ background:'#7c3aed', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', cursor:'pointer' }}>+ Nouvelle ordonnance</button>
                </div>
                {patient.prescriptions && patient.prescriptions.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                    {patient.prescriptions.map((p:any)=>(
                      <div key={p.id} style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', padding:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <p style={{ fontWeight:'bold', margin:0 }}>{formatDate(p.date||p.createdAt)}</p>
                          <p style={{ color:'#666', fontSize:'14px', margin:'4px 0 0' }}>{(p.medications||[]).length} medicament(s){p.notes?' - '+p.notes.slice(0,60):''}</p>
                        </div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button onClick={()=>handlePrintPresc(p.id)} style={{ background:'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'13px' }}>Imprimer</button>
                          <button onClick={()=>handleEditPresc(p)} style={{ background:'#f59e0b', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'13px' }}>Modifier</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center', color:'#888' }}>Aucune ordonnance</div>}
              </div>
            )}

            {tab === 'appointments' && (
              <div>
                <h2 style={{ fontSize:'20px', fontWeight:'bold', marginBottom:'16px' }}>Rendez-vous</h2>
                <div style={{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center', color:'#888' }}>Fonctionnalite a venir</div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>

      {showPrescModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', width:'100%', maxWidth:'720px', maxHeight:'90vh', overflowY:'auto', padding:'24px' }}>
            <h2 style={{ fontSize:'20px', fontWeight:'bold', marginBottom:'20px' }}>{editingPrescId ? 'Modifier l\u2019ordonnance' : 'Nouvelle ordonnance'}</h2>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'14px', fontWeight:'600', marginBottom:'6px' }}>Date de l\u2019ordonnance</label>
              <input type="date" value={prescDate} onChange={e=>setPrescDate(e.target.value)} style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'14px', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'14px', fontWeight:'600', marginBottom:'6px' }}>Medicaments</label>
              {prescMeds.map((med,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr auto', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                  <input placeholder="Medicament" value={med.name} onChange={e=>updateMed(i,{name:e.target.value})} style={{ padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px' }} />
                  <input placeholder="Posologie" value={med.dosage} onChange={e=>updateMed(i,{dosage:e.target.value})} style={{ padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px' }} />
                  <input placeholder="Frequence" value={med.frequency} onChange={e=>updateMed(i,{frequency:e.target.value})} style={{ padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px' }} />
                  <input placeholder="Duree" value={med.duration} onChange={e=>updateMed(i,{duration:e.target.value})} style={{ padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px' }} />
                  <input placeholder="Instructions" value={med.instructions} onChange={e=>updateMed(i,{instructions:e.target.value})} style={{ padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px' }} />
                  {prescMeds.length > 1 && <button onClick={()=>removeMedRow(i)} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:'6px', padding:'8px', cursor:'pointer', fontWeight:'bold' }}>&times;</button>}
                </div>
              ))}
              <button onClick={addMedRow} style={{ background:'none', border:'1px dashed #7c3aed', color:'#7c3aed', borderRadius:'6px', padding:'8px 16px', cursor:'pointer', fontSize:'14px' }}>+ Ajouter un medicament</button>
            </div>
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'14px', fontWeight:'600', marginBottom:'6px' }}>Notes</label>
              <textarea value={prescNotes} onChange={e=>setPrescNotes(e.target.value)} rows={3} placeholder="Notes complementaires..." style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'14px', boxSizing:'border-box', resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'12px' }}>
              <button onClick={()=>setShowPrescModal(false)} style={{ background:'#f3f4f6', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:'pointer' }}>Annuler</button>
              <button onClick={editingPrescId?handleUpdatePresc:handleCreatePresc} disabled={prescSaving} style={{ background:'#7c3aed', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:prescSaving?'not-allowed':'pointer' }}>{prescSaving ? 'Enregistrement...' : editingPrescId ? 'Modifier' : 'Creer'}</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', width:'100%', maxWidth:'800px', maxHeight:'90vh', overflowY:'auto', padding:'24px' }}>
            <h2 style={{ fontSize:'20px', fontWeight:'bold', marginBottom:'20px' }}>Nouvelle consultation</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div><label style={{ display:'block', fontSize:'13px', marginBottom:'4px' }}>Date</label><input type="datetime-local" value={form.date} onChange={e=>updateForm({date:e.target.value})} style={{ width:'100%', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} /></div>
              <div><label style={{ display:'block', fontSize:'13px', marginBottom:'4px' }}>Type</label><select value={form.type} onChange={e=>updateForm({type:e.target.value})} style={{ width:'100%', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} >{Object.entries(typeLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div style={{ gridColumn:'1/-1' }}><label style={{ display:'block', fontSize:'13px', marginBottom:'4px' }}>Motif de consultation</label><textarea value={form.chiefComplaint} onChange={e=>updateForm({chiefComplaint:e.target.value})} rows={2} style={{ width:'100%', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={{ display:'block', fontSize:'13px', marginBottom:'4px' }}>Symptomes</label><textarea value={form.symptoms} onChange={e=>updateForm({symptoms:e.target.value})} rows={2} style={{ width:'100%', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={{ display:'block', fontSize:'13px', marginBottom:'4px' }}>Examen clinique</label><textarea value={form.clinicalExam} onChange={e=>updateForm({clinicalExam:e.target.value})} rows={2} style={{ width:'100%', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={{ display:'block', fontSize:'13px', marginBottom:'4px' }}>Diagnostic</label><textarea value={form.diagnosis} onChange={e=>updateForm({diagnosis:e.target.value})} rows={2} style={{ width:'100%', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={{ display:'block', fontSize:'13px', marginBottom:'4px' }}>Traitement</label><textarea value={form.treatment} onChange={e=>updateForm({treatment:e.target.value})} rows={2} style={{ width:'100%', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={{ display:'block', fontSize:'13px', marginBottom:'4px' }}>Notes</label><textarea value={form.notes} onChange={e=>updateForm({notes:e.target.value})} rows={2} style={{ width:'100%', padding:'8px', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} /></div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'12px', marginTop:'20px' }}>
              <button onClick={()=>setShowModal(false)} style={{ background:'#f3f4f6', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:'pointer' }}>Annuler</button>
              <button onClick={saveConsultation} disabled={saving} style={{ background:'#7c3aed', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:saving?'not-allowed':'pointer' }}>{saving?'Enregistrement...':'Creer'}</button>
            </div>
          </div>
        </div>
      )}

      {printPresc && (
        <div className="print-area" style={{ display:'none' }}>
          <div style={{ fontFamily:'Arial, sans-serif', padding:'40px', maxWidth:'800px', margin:'0 auto' }}>
            {doctorProfile && (
              <div style={{ textAlign:'center', marginBottom:'20px' }}>
                <h2 style={{ margin:'0 0 4px', fontSize:'20px' }}>Dr. {doctorProfile.firstName} {doctorProfile.lastName}</h2>
                {doctorProfile.specialty && <p style={{ margin:'0 0 2px', fontSize:'14px', color:'#555' }}>{doctorProfile.specialty}</p>}
                {doctorProfile.address && <p style={{ margin:'0 0 2px', fontSize:'13px', color:'#666' }}>{doctorProfile.address}</p>}
                {doctorProfile.phone && <p style={{ margin:'0', fontSize:'13px', color:'#666' }}>{doctorProfile.phone}</p>}
              </div>
            )}
            <hr style={{ border:'none', borderTop:'1px solid #333', margin:'20px 0' }} />
            <h3 style={{ textAlign:'center', margin:'20px 0', fontSize:'18px', textTransform:'uppercase' }}>Ordonnance</h3>
            <p style={{ fontSize:'14px' }}><strong>Patiente :</strong> {patient?.firstName} {patient?.lastName}</p>
            <p style={{ fontSize:'14px' }}><strong>Date :</strong> {formatDate(printPresc.date||printPresc.createdAt)}</p>
            <div style={{ margin:'24px 0' }}>
              {(printPresc.medications||[]).map((m:any,i:number)=>(
                <div key={i} style={{ marginBottom:'12px', fontSize:'14px' }}>
                  <strong>{i+1}. {m.name}</strong>{m.dosage?' - '+m.dosage:''}{m.frequency?' - '+m.frequency:''}{m.duration?' - '+m.duration:''}
                  {m.instructions && <div style={{ marginLeft:'20px', fontStyle:'italic', color:'#555' }}>{m.instructions}</div>}
                </div>
              ))}
            </div>
            {printPresc.notes && <p style={{ fontSize:'14px', fontStyle:'italic', marginTop:'16px' }}>Notes : {printPresc.notes}</p>}
            <div style={{ marginTop:'80px', textAlign:'right', fontSize:'14px' }}>
              <p style={{ margin:0 }}>Fait a {city}, le {formatDate(printPresc.date||printPresc.createdAt)}</p>
            </div>
            <div style={{ marginTop:'60px', textAlign:'right' }}>
              <p style={{ margin:0, fontStyle:'italic', color:'#888' }}>Signature du medecin</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default PatientDetail;
