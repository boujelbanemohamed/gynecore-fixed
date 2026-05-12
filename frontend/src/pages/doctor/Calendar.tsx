import React, { useEffect, useState, useCallback } from 'react';
import { doctorAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const typeLabels: Record<string,string> = {
  FIRST_VISIT:'Premi\u00e8re visite', FOLLOW_UP:'Suivi', EMERGENCY:'Urgence',
  ANNUAL_CHECKUP:'Bilan annuel', PRENATAL:'Pr\u00e9natal', POSTNATAL:'Postnatal'
};
const typeOptions = [
  {value:'',label:'-- Type de consultation --'},
  {value:'FIRST_VISIT',label:'Premi\u00e8re visite'},
  {value:'FOLLOW_UP',label:'Suivi'},
  {value:'EMERGENCY',label:'Urgence'},
  {value:'ANNUAL_CHECKUP',label:'Bilan annuel'},
  {value:'PRENATAL',label:'Pr\u00e9natal'},
  {value:'POSTNATAL',label:'Postnatal'},
];

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selected, setSelected] = useState<Date|null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchTimeout, setSearchTimeout] = useState<any>(null);

  // New patient form
  const [newPatient, setNewPatient] = useState({
    firstName:'', lastName:'', email:'', phone:'', dateOfBirth:'', bloodType:'',
    city:'', allergies:'', contraceptionMethod:''
  });

  // Appointment form
  // Unavailable slots
  const [unavailSlots, setUnavailSlots] = useState<any[]>([]);
  const [showUnavailModal, setShowUnavailModal] = useState(false);
  const [unavailForm, setUnavailForm] = useState({ startTime: '', endTime: '', reason: '' });
  const [unavailSubmitting, setUnavailSubmitting] = useState(false);
  const [unavailError, setUnavailError] = useState('');

  // Appointment form
  const [aptForm, setAptForm] = useState({
    startTime:'', endTime:'', type:'', reason:'', notes:''
  });

  useEffect(() => {
    const y=currentDate.getFullYear(), m=currentDate.getMonth();
    const start=new Date(y,m,1), end=new Date(y,m+1,0,23,59,59);
    doctorAPI.getAppointments({start:start.toISOString(),end:end.toISOString()})
      .then(r=>setAppointments(r.data.data)).catch(()=>{});
    doctorAPI.getUnavailableSlots({startDate:start.toISOString(),end:end.toISOString()})
      .then(r=>setUnavailSlots(r.data.data.slots||[])).catch(()=>{});
  }, [currentDate]);

  const y=currentDate.getFullYear(), m=currentDate.getMonth();
  const firstDay=new Date(y,m,1).getDay()||7;
  const daysInMonth=new Date(y,m+1,0).getDate();
  const today=new Date();

  const getApts=(day:number)=>appointments.filter(a=>{
    const d=new Date(a.startTime);
    return d.getFullYear()===y&&d.getMonth()===m&&d.getDate()===day;
  });
  const selectedApts=selected?getApts(selected.getDate()):[];
  const getUnavailForDay=(day:number)=>unavailSlots.filter(s=>{
    const d=new Date(s.startTime);
    return d.getFullYear()===y&&d.getMonth()===m&&d.getDate()===day;
  });
  const selectedUnavail=selected?getUnavailForDay(selected.getDate()):[];
  const months=['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin','Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'];

  // Search patients
  const handlePatientSearch = useCallback((query: string) => {
    setPatientSearch(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!query || query.length < 2) { setPatients([]); return; }
    setSearchTimeout(setTimeout(() => {
      doctorAPI.getPatients({ search: query }).then(r => {
        setPatients(r.data.data?.patients || r.data.data || r.data || []);
      }).catch(() => setPatients([]));
    }, 300));
  }, [searchTimeout]);

  // Open modal with selected date pre-filled
  const openNewAptModal = () => {
    if (!selected) return;
    const day = selected.getDate().toString().padStart(2,'0');
    const month = (selected.getMonth()+1).toString().padStart(2,'0');
    const dateStr = `${selected.getFullYear()}-${month}-${day}`;
    setAptForm({
      startTime: `${dateStr}T09:00`,
      endTime: `${dateStr}T09:30`,
      type: '', reason: '', notes: ''
    });
    setSelectedPatient(null);
    setPatientSearch('');
    setPatients([]);
    setShowNewPatient(false);
    setNewPatient({ firstName:'', lastName:'', email:'', phone:'', dateOfBirth:'', bloodType:'', city:'', allergies:'', contraceptionMethod:'' });
    setError('');
    setShowModal(true);
  };

  const openUnavailModal = () => {
    if (!selected) return;
    const day = selected.getDate().toString().padStart(2,'0');
    const month = (selected.getMonth()+1).toString().padStart(2,'0');
    const dateStr = `${selected.getFullYear()}-${month}-${day}`;
    setUnavailForm({ startTime: `${dateStr}T08:00`, endTime: `${dateStr}T12:00`, reason: '' });
    setUnavailError('');
    setShowUnavailModal(true);
  };

  const handleCreateUnavail = async () => {
    if (!unavailForm.startTime || !unavailForm.endTime) {
      setUnavailError('Veuillez remplir les heures de debut et fin.');
      return;
    }
    setUnavailSubmitting(true);
    setUnavailError('');
    try {
      await doctorAPI.createUnavailableSlot({
        startTime: new Date(unavailForm.startTime).toISOString(),
        endTime: new Date(unavailForm.endTime).toISOString(),
        reason: unavailForm.reason || null,
      });
      setShowUnavailModal(false);
      const startY=currentDate.getFullYear(), startM=currentDate.getMonth();
      const start=new Date(startY,startM,1), end=new Date(startY,startM+1,0,23,59,59);
      const [aptRes, slotRes] = await Promise.all([
        doctorAPI.getAppointments({start:start.toISOString(),end:end.toISOString()}),
        doctorAPI.getUnavailableSlots({startDate:start.toISOString(),end:end.toISOString()}),
      ]);
      setAppointments(aptRes.data.data);
      setUnavailSlots(slotRes.data.data.slots||[]);
    } catch (err: any) {
      setUnavailError(err.response?.data?.message || 'Erreur lors de la creation du creneau.');
    } finally {
      setUnavailSubmitting(false);
    }
  };

  const handleDeleteUnavail = async (slotId: string) => {
    if (!confirm('Supprimer ce creneau d\'indisponibilite ?')) return;
    try {
      await doctorAPI.deleteUnavailableSlot(slotId);
      setUnavailSlots(prev=>prev.filter(s=>s.id!==slotId));
    } catch {}
  };

  // Create patient then set as selected
  const handleCreatePatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.email || !newPatient.dateOfBirth) {
      setError('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await doctorAPI.createPatient({
        ...newPatient,
        numberOfPregnancies: 0,
        numberOfDeliveries: 0,
      });
      const createdPatient = res.data.data?.patient || res.data.data || res.data;
      setSelectedPatient(createdPatient);
      setShowNewPatient(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la cr\u00e9ation de la patiente.');
    } finally {
      setLoading(false);
    }
  };

  // Create appointment
  const handleCreateAppointment = async () => {
    if (!selectedPatient) {
      setError('Veuillez s\u00e9lectionner une patiente.');
      return;
    }
    if (!aptForm.startTime || !aptForm.endTime) {
      setError('Veuillez remplir l\'heure de d\u00e9but et de fin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await doctorAPI.createAppointment({
        patientId: selectedPatient.id,
        doctorId: user?.id || '',
        startTime: new Date(aptForm.startTime).toISOString(),
        endTime: new Date(aptForm.endTime).toISOString(),
        type: aptForm.type || 'FIRST_VISIT',
        reason: aptForm.reason,
        notes: aptForm.notes,
      });
      setShowModal(false);
      // Refresh appointments
      const startY=currentDate.getFullYear(), startM=currentDate.getMonth();
      const start=new Date(startY,startM,1), end=new Date(startY,startM+1,0,23,59,59);
      doctorAPI.getAppointments({start:start.toISOString(),end:end.toISOString()})
        .then(r=>setAppointments(r.data.data)).catch(()=>{});
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la cr\u00e9ation du rendez-vous.');
    } finally {
      setLoading(false);
    }
  };

  // Update appointment status
  const handleUpdateStatus = async (aptId: string, newStatus: string) => {
    try {
      await doctorAPI.updateAppointmentStatus(aptId, newStatus);
      const startY=currentDate.getFullYear(), startM=currentDate.getMonth();
      const start=new Date(startY,startM,1), end=new Date(startY,startM+1,0,23,59,59);
      doctorAPI.getAppointments({start:start.toISOString(),end:end.toISOString()})
        .then(r=>setAppointments(r.data.data)).catch(()=>{});
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la mise \u00e0 jour du statut.');
    }
  };

  // Get allowed transitions for status buttons
  const getStatusButtons = (status: string, aptId: string) => {
    const buttons: {label: string, action: () => void, className: string}[] = [];
    if (status === 'SCHEDULED') {
      buttons.push({label:'Confirmer', action:()=>handleUpdateStatus(aptId,'CONFIRMED'), className:'btn btn-sm'});
      buttons.push({label:'Annuler', action:()=>handleUpdateStatus(aptId,'CANCELLED'), className:'btn btn-outline btn-sm'});
      buttons.push({label:'Non pr\u00e9sent', action:()=>handleUpdateStatus(aptId,'NO_SHOW'), className:'btn btn-outline btn-sm'});
    } else if (status === 'CONFIRMED') {
      buttons.push({label:'Effectu\u00e9', action:()=>handleUpdateStatus(aptId,'COMPLETED'), className:'btn btn-sm'});
      buttons.push({label:'Annuler', action:()=>handleUpdateStatus(aptId,'CANCELLED'), className:'btn btn-outline btn-sm'});
      buttons.push({label:'Non pr\u00e9sent', action:()=>handleUpdateStatus(aptId,'NO_SHOW'), className:'btn btn-outline btn-sm'});
    }
    return buttons;
  };

  return (
    <div className="grid-2" style={{alignItems:'start'}}>
      {/* CALENDAR GRID */}
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <button className="btn btn-outline btn-sm" onClick={()=>setCurrentDate(new Date(y,m-1))}>←</button>
          <span style={{fontWeight:500,fontSize:16}}>{months[m]} {y}</span>
          <button className="btn btn-outline btn-sm" onClick={()=>setCurrentDate(new Date(y,m+1))}>→</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>
            <div key={d} style={{textAlign:'center',fontSize:11,color:'var(--text-muted)',padding:'4px 0',fontWeight:500}}>{d}</div>
          )}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
          {Array.from({length:firstDay-1}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day=i+1;
            const apts=getApts(day);
            const isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===day;
            const isSel=selected&&selected.getFullYear()===y&&selected.getMonth()===m&&selected.getDate()===day;
            return (
              <div key={day} onClick={()=>setSelected(new Date(y,m,day))}
                style={{padding:'6px 4px',minHeight:48,borderRadius:6,cursor:'pointer',
                  background:isSel?'var(--primary)':isToday?'var(--primary-light)':'transparent',
                  border:isToday&&!isSel?'1px solid var(--primary)':'1px solid transparent'}}>
                <div style={{fontSize:13,fontWeight:isToday?600:400,
                  color:isSel?'white':isToday?'var(--primary)':'var(--text-primary)',
                  textAlign:'center',marginBottom:2}}>{day}</div>
                <div style={{display:'flex',flexDirection:'column',gap:1}}>
                  {apts.slice(0,2).map(a=>
                    <div key={a.id} style={{height:4,borderRadius:2,background:isSel?'rgba(255,255,255,0.7)':'var(--primary)'}}/>
                  )}
                  {getUnavailForDay(day).length>0&&
                    <div style={{height:4,borderRadius:2,background:isSel?'rgba(255,200,200,0.8)':'#fc8181'}}/>
                  }
                  {apts.length>2&&<div style={{fontSize:9,color:isSel?'rgba(255,255,255,0.8)':'var(--text-muted)',textAlign:'center'}}>+{apts.length-2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="card">
        <div className="card-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span className="card-title">{selected?selected.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):'S\u00e9lectionnez un jour'}</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {selected&&<span className="badge badge-info">{selectedApts.length} RDV</span>}{selected&&selectedUnavail.length>0&&<span className="badge" style={{background:"#fff5f5",color:"#c53030",border:"1px solid #fed7d7",fontSize:11,marginLeft:4}}>{selectedUnavail.length} Indisp.</span>}
            
            {selected&&<button className="btn btn-outline btn-sm" onClick={openUnavailModal} style={{borderColor:'#fed7d7',color:'#c53030'}}>+ Indisponibilite</button>}
            {selected&&<button className="btn btn-primary btn-sm" onClick={openNewAptModal}>+ Nouveau RDV</button>}
          </div>
        </div>

        {!selected
          ?<p className="text-muted text-sm">Cliquez sur un jour pour voir les rendez-vous</p>
          :!selectedApts.length
            ?<div className="empty-state" style={{padding:'24px 0'}}>
                <div className="empty-icon">📅</div>
                <p>Aucun rendez-vous</p>
                <button className="btn btn-primary" style={{marginTop:12}} onClick={openNewAptModal}>+ Planifier un rendez-vous</button>
                {selectedUnavail.length > 0 && <button className="btn btn-outline" style={{marginTop:8,borderColor:'#fed7d7',color:'#c53030'}} onClick={openUnavailModal}>+ Ajouter une indisponibilite</button>}
              </div>
            :<div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {[...selectedApts,...selectedUnavail].sort((a:any,b:any)=>new Date(a.startTime).getTime()-new Date(b.startTime).getTime()).map(item=>(
                    item.patient
                    ? <div key={item.id} style={{padding:'12px 14px',border:'1px solid var(--border)',borderLeft:'3px solid var(--primary)',borderRadius:'var(--radius-sm)'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div>
                            <div style={{fontWeight:500,fontSize:14}}>{item.patient.user.firstName} {item.patient.user.lastName}</div>
                            <div className="text-sm text-muted" style={{marginTop:3}}>
                              {new Date(item.startTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} · {typeLabels[item.type]||item.type}
                            </div>
                            {item.reason&&<div className="text-sm" style={{marginTop:4,color:'var(--text-secondary)'}}>Motif : {item.reason}</div>}
                          </div>
                          <span className={`badge ${item.status==='CONFIRMED'?'badge-success':item.status==='CANCELLED'?'badge-danger':item.status==='COMPLETED'?'badge-muted':'badge-info'}`}
                            style={{fontSize:10,whiteSpace:'nowrap'}}>
                            {item.status==='SCHEDULED'?'Planifi\u00e9':item.status==='CONFIRMED'?'Confirm\u00e9':item.status==='CANCELLED'?'Annul\u00e9':item.status==='COMPLETED'?'Effectu\u00e9':'Non pr\u00e9sent'}
                          </span>
                        </div>
                        {getStatusButtons(item.status, item.id).length > 0 && (
                          <div style={{display:'flex',gap:6,marginTop:10,paddingTop:10,borderTop:'1px solid var(--border)'}}>
                            {getStatusButtons(item.status, item.id).map((btn: any, i: number) => (
                              <button key={i} className={btn.className} onClick={btn.action} style={{fontSize:11}}>
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    : <div key={item.id} style={{padding:'12px 14px',border:'1px solid #fed7d7',borderLeft:'3px solid #c53030',borderRadius:'var(--radius-sm)',backgroundColor:'#fff5f5'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div>
                            <div style={{fontWeight:500,fontSize:14,color:'#c53030'}}>Indisponible</div>
                            <div className="text-sm" style={{marginTop:3,color:'#c53030'}}>
                              {new Date(item.startTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} - {new Date(item.endTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                            </div>
                            {item.reason&&<div className="text-sm" style={{marginTop:4,color:'var(--text-secondary)'}}>Motif : {item.reason}</div>}
                          </div>
                          <button className="btn btn-outline btn-sm" onClick={()=>handleDeleteUnavail(item.id)} style={{borderColor:'#fc8181',color:'#c53030',fontSize:11}}>Supprimer</button>
                        </div>
                      </div>
                  ))}
                </div>
                <button className="btn btn-primary" style={{marginTop:16,width:'100%'}} onClick={openNewAptModal}>+ Ajouter un rendez-vous</button>
              </div>
        }
      </div>

      {/* ===== MODAL NOUVEAU RENDEZ-VOUS ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={()=>!loading&&setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:580}}>
            <div className="modal-header">
              <h3>Nouveau rendez-vous</h3>
              <button className="btn-close" onClick={()=>!loading&&setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{marginBottom:16}}>{error}</div>}

              {/* PATIENT SELECTION */}
              {!showNewPatient ? (
                <div style={{marginBottom:20}}>
                  <label className="form-label">Patiente *</label>
                  {selectedPatient ? (
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg-secondary)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'var(--primary)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:14}}>
                        {selectedPatient.user?.firstName?.[0]||''}{selectedPatient.firstName?.[0]||''}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:500}}>{selectedPatient.user?.firstName || selectedPatient.firstName} {selectedPatient.user?.lastName || selectedPatient.lastName}</div>
                        <div className="text-sm text-muted">{selectedPatient.user?.email || selectedPatient.email}</div>
                      </div>
                      <button className="btn btn-outline btn-sm" onClick={()=>{setSelectedPatient(null);setPatientSearch('');}}>Changer</button>
                    </div>
                  ) : (
                    <>
                      <div style={{position:'relative',marginBottom:8}}>
                        <input className="form-control" placeholder="Rechercher par nom, pr\u00e9nom ou date de naissance..."
                          value={patientSearch} onChange={e=>handlePatientSearch(e.target.value)} />
                      </div>
                      {patients.length > 0 && !selectedPatient && (
                        <div style={{maxHeight:180,overflowY:'auto',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)'}}>
                          {patients.map((p: any) => (
                            <div key={p.id} onClick={()=>{setSelectedPatient(p);setPatients([]);setPatientSearch('');}}
                              style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,
                                background:'var(--bg-white)',transition:'background 0.15s'}}>
                              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--primary-light)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:12}}>
                                {(p.user?.firstName?.[0]||p.firstName?.[0]||'')}{(p.user?.lastName?.[0]||p.lastName?.[0]||'')}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:500,fontSize:13}}>{p.user?.firstName || p.firstName} {p.user?.lastName || p.lastName}</div>
                                <div className="text-sm text-muted" style={{fontSize:11}}>
                                  {p.user?.email || p.email}
                                  {p.dateOfBirth && <span> · Née le {new Date(p.dateOfBirth).toLocaleDateString('fr-FR')}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button className="btn btn-outline btn-sm" style={{marginTop:8}} onClick={()=>{setShowNewPatient(true);setError('');}}>
                        + Créer une nouvelle patiente
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* INLINE NEW PATIENT FORM */
                <div style={{marginBottom:20,padding:16,background:'var(--bg-secondary)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                    <label className="form-label" style={{marginBottom:0}}>Nouvelle patiente</label>
                    <button className="btn btn-outline btn-sm" onClick={()=>{setShowNewPatient(false);setError('');}}>Annuler</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div>
                      <label className="form-label" style={{fontSize:12}}>Prénom *</label>
                      <input className="form-control" value={newPatient.firstName}
                        onChange={e=>setNewPatient({...newPatient,firstName:e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label" style={{fontSize:12}}>Nom *</label>
                      <input className="form-control" value={newPatient.lastName}
                        onChange={e=>setNewPatient({...newPatient,lastName:e.target.value})} />
                    </div>
                    <div style={{gridColumn:'1/-1'}}>
                      <label className="form-label" style={{fontSize:12}}>Email *</label>
                      <input className="form-control" type="email" value={newPatient.email}
                        onChange={e=>setNewPatient({...newPatient,email:e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label" style={{fontSize:12}}>Téléphone</label>
                      <input className="form-control" value={newPatient.phone}
                        onChange={e=>setNewPatient({...newPatient,phone:e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label" style={{fontSize:12}}>Date de naissance *</label>
                      <input className="form-control" type="date" value={newPatient.dateOfBirth}
                        onChange={e=>setNewPatient({...newPatient,dateOfBirth:e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label" style={{fontSize:12}}>Groupe sanguin</label>
                      <select className="form-control" value={newPatient.bloodType}
                        onChange={e=>setNewPatient({...newPatient,bloodType:e.target.value})}>
                        <option value="">--</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{fontSize:12}}>Ville</label>
                      <input className="form-control" value={newPatient.city}
                        onChange={e=>setNewPatient({...newPatient,city:e.target.value})} />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{marginTop:12}} onClick={handleCreatePatient} disabled={loading}>
                    {loading?'Cr\u00e9ation...':'Cr\u00e9er la patiente'}
                  </button>
                </div>
              )}

              {/* APPOINTMENT DETAILS */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label className="form-label">Heure de début *</label>
                  <input className="form-control" type="datetime-local" value={aptForm.startTime}
                    onChange={e=>setAptForm({...aptForm,startTime:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Heure de fin *</label>
                  <input className="form-control" type="datetime-local" value={aptForm.endTime}
                    onChange={e=>setAptForm({...aptForm,endTime:e.target.value})} />
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Type de consultation</label>
                  <select className="form-control" value={aptForm.type}
                    onChange={e=>setAptForm({...aptForm,type:e.target.value})}>
                    {typeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Motif</label>
                  <input className="form-control" placeholder="Ex: Contr\u00f4le de grossesse, consultation de suivi..."
                    value={aptForm.reason} onChange={e=>setAptForm({...aptForm,reason:e.target.value})} />
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} placeholder="Notes compl\u00e9mentaires (optionnel)..."
                    value={aptForm.notes} onChange={e=>setAptForm({...aptForm,notes:e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>!loading&&setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCreateAppointment} disabled={loading}>
                {loading?'Enregistrement...':'Enregistrer le rendez-vous'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== MODAL INDISPONIBILITE ===== */}
      {showUnavailModal && (
        <div className="modal-overlay" onClick={()=>!unavailSubmitting&&setShowUnavailModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
            <div className="modal-header">
              <h3>Creneau indisponible</h3>
              <button className="btn-close" onClick={()=>!unavailSubmitting&&setShowUnavailModal(false)}>x</button>
            </div>
            <div className="modal-body">
              {unavailError && <div className="alert alert-error" style={{marginBottom:16}}>{unavailError}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div>
                  <label className="form-label">Debut *</label>
                  <input className="form-control" type="datetime-local" value={unavailForm.startTime}
                    onChange={e=>setUnavailForm({...unavailForm,startTime:e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Fin *</label>
                  <input className="form-control" type="datetime-local" value={unavailForm.endTime}
                    onChange={e=>setUnavailForm({...unavailForm,endTime:e.target.value})} />
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <label className="form-label">Motif (optionnel)</label>
                <input className="form-control" type="text" placeholder="Ex: Conge, formation..."
                  value={unavailForm.reason} onChange={e=>setUnavailForm({...unavailForm,reason:e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>!unavailSubmitting&&setShowUnavailModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCreateUnavail} disabled={unavailSubmitting} style={{backgroundColor:'#c53030'}}>
                {unavailSubmitting?'Ajout...':'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Calendar;
