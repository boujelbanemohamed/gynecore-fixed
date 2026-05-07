import React, { useEffect, useState } from 'react';
import { patientAPI } from '../../services/api';

const typeLabels: Record<string,string> = {FIRST_VISIT:'Première visite',FOLLOW_UP:'Suivi',EMERGENCY:'Urgence',ANNUAL_CHECKUP:'Bilan annuel',PRENATAL:'Prénatal',POSTNATAL:'Postnatal'};

const PatientRendezVous: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { patientAPI.getAppointments().then(r=>setAppointments(r.data.data)).finally(()=>setLoading(false)); }, []);

  if(loading)return <div className="loading-screen"><div className="spinner"/></div>;
  const now=new Date();
  const upcoming=appointments.filter(a=>new Date(a.startTime)>=now);
  const past=appointments.filter(a=>new Date(a.startTime)<now);

  return (
    <div>
      <div className="portal-header"><h2>Mes rendez-vous</h2><p>{upcoming.length} rendez-vous à venir</p></div>
      {!appointments.length?<div className="card"><div className="empty-state"><div className="empty-icon">📅</div><p>Aucun rendez-vous</p></div></div>:(
        <div>
          {upcoming.length>0&&<><h3 className="section-title">À venir</h3><div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>{upcoming.map((a:any)=><AptCard key={a.id} apt={a} upcoming/>)}</div></>}
          {past.length>0&&<><h3 className="section-title" style={{color:'var(--text-muted)'}}>Passés</h3><div style={{display:'flex',flexDirection:'column',gap:12,opacity:0.65}}>{past.map((a:any)=><AptCard key={a.id} apt={a} upcoming={false}/>)}</div></>}
        </div>
      )}
    </div>
  );
};

const AptCard:React.FC<{apt:any,upcoming:boolean}>=({apt,upcoming})=>{
  const d=new Date(apt.startTime);
  const doc=apt.doctor;
  return (
    <div className="card" style={{display:'flex',alignItems:'center',gap:16,borderLeft:`3px solid ${apt.status==='CONFIRMED'?'var(--success)':upcoming?'#2c5f8a':'var(--border)'}`}}>
      <div style={{width:56,height:56,borderRadius:10,background:upcoming?'#e8f2fb':'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <div style={{fontSize:18,fontWeight:600,color:upcoming?'#2c5f8a':'var(--text-muted)'}}>{d.getDate()}</div>
        <div style={{fontSize:11,color:upcoming?'#2c5f8a':'var(--text-muted)'}}>{d.toLocaleString('fr-FR',{month:'short'}).toUpperCase()}</div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:500,fontSize:15}}>{typeLabels[apt.type]||apt.type}</div>
        <div className="text-sm text-muted">Dr {doc.firstName} {doc.lastName} · {d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})} · {d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
        {apt.reason&&<div className="text-sm" style={{marginTop:4}}>Motif : {apt.reason}</div>}
      </div>
      <span className={`badge ${apt.status==='CONFIRMED'?'badge-success':apt.status==='CANCELLED'?'badge-danger':apt.status==='COMPLETED'?'badge-muted':'badge-info'}`}>
        {apt.status==='SCHEDULED'?'Planifié':apt.status==='CONFIRMED'?'Confirmé':apt.status==='CANCELLED'?'Annulé':'Effectué'}
      </span>
    </div>
  );
};

export default PatientRendezVous;
