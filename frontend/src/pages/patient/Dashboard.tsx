import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const typeLabels: Record<string,string> = {FIRST_VISIT:'Première visite',FOLLOW_UP:'Suivi',EMERGENCY:'Urgence',ANNUAL_CHECKUP:'Bilan annuel',PRENATAL:'Prénatal',POSTNATAL:'Postnatal'};

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { patientAPI.getDossier().then(r=>setDossier(r.data.data)).catch(console.error).finally(()=>setLoading(false)); }, []);

  if(loading)return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div>
      <div className="portal-header"><h2>Bonjour, {user?.firstName} 👋</h2><p>Bienvenue sur votre espace santé personnel</p></div>
      <div className="stats-grid" style={{marginBottom:24}}>
        {[['📋','Consultations',dossier?.consultations?.length??0,'#2c5f8a'],['💊','Ordonnances actives',dossier?.prescriptions?.filter((p:any)=>p.isValid).length??0,'var(--success)'],['📅','Prochains RDV',dossier?.appointments?.length??0,'var(--warning)'],['🩸','Groupe sanguin',dossier?.bloodType||'—','var(--text-primary)']].map(([icon,label,value,color])=>(
          <div className="stat-card" key={label as string}><div className="stat-icon">{icon}</div><div className="stat-label">{label}</div><div className="stat-value" style={{color:color as string,fontSize:typeof value==='string'?20:28}}>{value as any}</div></div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Prochain rendez-vous</span><button className="btn btn-sm btn-outline" onClick={()=>navigate('/patient/rendez-vous')}>Tout voir</button></div>
          {!dossier?.appointments?.length?<div className="empty-state" style={{padding:'20px 0'}}><div className="empty-icon">📅</div><p>Aucun rendez-vous à venir</p></div>:
          dossier.appointments.slice(0,3).map((apt:any)=>(
            <div key={apt.id} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:46,height:46,borderRadius:8,background:'#e8f2fb',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:12,color:'#2c5f8a',fontWeight:500}}>
                <span>{new Date(apt.startTime).getDate()}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,fontSize:14}}>{typeLabels[apt.type]}</div>
                <div className="text-sm text-muted">Dr {apt.doctor.firstName} {apt.doctor.lastName}</div>
              </div>
              <span className={`badge ${apt.status==='CONFIRMED'?'badge-success':'badge-info'}`}>{apt.status==='CONFIRMED'?'Confirmé':'Planifié'}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Accès rapide</span></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['📁','Mon dossier','/patient/dossier','#2c5f8a'],['💊','Ordonnances','/patient/prescriptions','var(--success)'],['📅','Rendez-vous','/patient/rendez-vous','var(--warning)'],['🔒','Sécurisé','#','var(--text-muted)']].map(([icon,label,path,color])=>(
              <button key={label as string} onClick={()=>navigate(path as string)} style={{padding:'14px',border:'1px solid var(--border)',borderRadius:'var(--radius)',background:'white',cursor:'pointer',textAlign:'center'}}>
                <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
                <div style={{fontSize:13,fontWeight:500}}>{label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PatientDashboard;
