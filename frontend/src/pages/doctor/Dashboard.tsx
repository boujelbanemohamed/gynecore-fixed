import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorAPI.getDashboard().then(res => setData(res.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const stats = data?.stats;
  return (
    <div>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:20,fontWeight:500}}>Bonjour, Dr {user?.lastName} 👋</h2>
        <p className="text-muted" style={{marginTop:4}}>{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      </div>
      <div className="stats-grid">
        {[['👥','Total patientes',stats?.totalPatients??0,'var(--primary)'],['📅',"RDV aujourd'hui",stats?.todayAppointments??0,'var(--info)'],['📋','Consultations ce mois',stats?.monthConsultations??0,'var(--accent)'],['⏳','RDV en attente',stats?.pendingAppointments??0,'var(--warning)']].map(([icon,label,value,color])=>(
          <div className="stat-card" key={label as string}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{color:color as string}}>{value as number}</div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Prochains rendez-vous</span>
            <button className="btn btn-sm btn-outline" onClick={()=>navigate('/calendar')}>Voir tout</button>
          </div>
          {!data?.upcomingAppointments?.length ? (
            <div className="empty-state"><div className="empty-icon">📅</div><p>Aucun rendez-vous à venir</p></div>
          ) : data.upcomingAppointments.map((apt: any) => (
            <div key={apt.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:44,height:44,borderRadius:'var(--radius-sm)',background:'var(--primary-light)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:12,color:'var(--primary)',fontWeight:500,flexShrink:0}}>
                <span>{new Date(apt.startTime).getDate()}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,fontSize:14}}>{apt.patient.user.firstName} {apt.patient.user.lastName}</div>
                <div className="text-muted text-sm">{new Date(apt.startTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <span className={`badge ${apt.status==='CONFIRMED'?'badge-success':'badge-info'}`}>{apt.status==='CONFIRMED'?'Confirmé':'Planifié'}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Actions rapides</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[['👩','Nouvelle patiente','Créer un dossier','var(--primary)','/patients'],['📋','Nouvelle consultation','Saisir une consultation','var(--info)','/consultations'],['📅','Nouveau rendez-vous','Planifier','var(--accent)','/calendar']].map(([icon,label,sub,color,path])=>(
              <button key={path as string} onClick={()=>navigate(path as string)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',background:'white',cursor:'pointer',textAlign:'left'}}>
                <span style={{fontSize:22}}>{icon}</span>
                <div><div style={{fontWeight:500,fontSize:14}}>{label}</div><div className="text-muted text-sm">{sub}</div></div>
                <span style={{marginLeft:'auto',color:color as string}}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
