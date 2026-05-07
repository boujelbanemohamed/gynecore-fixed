import React, { useEffect, useState } from 'react';
import { patientAPI } from '../../services/api';

const PatientPrescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { patientAPI.getPrescriptions().then(r=>setPrescriptions(r.data.data)).finally(()=>setLoading(false)); }, []);

  if(loading)return <div className="loading-screen"><div className="spinner"/></div>;
  const active=prescriptions.filter(p=>p.isValid);
  const expired=prescriptions.filter(p=>!p.isValid);

  return (
    <div>
      <div className="portal-header"><h2>Mes ordonnances</h2><p>{active.length} ordonnance(s) active(s)</p></div>
      {!prescriptions.length?<div className="card"><div className="empty-state"><div className="empty-icon">💊</div><p>Aucune ordonnance</p></div></div>:(
        <div>
          {active.length>0&&<><h3 className="section-title" style={{color:'var(--success)'}}>✓ Ordonnances actives</h3>
          <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:24}}>{active.map((p:any)=><PrescCard key={p.id} p={p}/>)}</div></>}
          {expired.length>0&&<><h3 className="section-title" style={{color:'var(--text-muted)'}}>Expirées</h3>
          <div style={{display:'flex',flexDirection:'column',gap:14,opacity:0.65}}>{expired.map((p:any)=><PrescCard key={p.id} p={p}/>)}</div></>}
        </div>
      )}
    </div>
  );
};

const PrescCard:React.FC<{p:any}>=({p})=>(
  <div className="card" style={{borderLeft:`3px solid ${p.isValid?'var(--success)':'var(--border)'}`}}>
    <div className="card-header">
      <span style={{fontWeight:500}}>Ordonnance du {new Date(p.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
      <span className={`badge ${p.isValid?'badge-success':'badge-muted'}`}>{p.isValid?'Valide':'Expirée'}</span>
    </div>
    <table><thead><tr><th>Médicament</th><th>Dosage</th><th>Fréquence</th><th>Durée</th></tr></thead>
    <tbody>{(p.medications as any[]).map((m:any,i:number)=>(
      <tr key={i}><td style={{fontWeight:500}}>{m.name}</td><td>{m.dosage}</td><td>{m.frequency}</td><td>{m.duration}</td></tr>
    ))}</tbody></table>
    {p.notes&&<p className="text-sm text-muted" style={{marginTop:8}}>Note : {p.notes}</p>}
  </div>
);

export default PatientPrescriptions;
