import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';

const typeLabels: Record<string,string> = {FIRST_VISIT:'Première visite',FOLLOW_UP:'Suivi',EMERGENCY:'Urgence',ANNUAL_CHECKUP:'Bilan annuel',PRENATAL:'Prénatal',POSTNATAL:'Postnatal'};

const Consultations: React.FC = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorAPI.getConsultations({limit:50}).then(r=>setConsultations(r.data.data.consultations)).finally(()=>setLoading(false));
  }, []);

  if(loading)return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div>
      <div style={{marginBottom:20}}><h2 style={{fontSize:18,fontWeight:500}}>Consultations</h2><p className="text-muted text-sm">{consultations.length} consultation(s)</p></div>
      <div className="card" style={{padding:0}}>
        {!consultations.length?<div className="empty-state"><div className="empty-icon">📋</div><p>Aucune consultation</p></div>:
        <table><thead><tr><th>Date</th><th>Patiente</th><th>Type</th><th>Diagnostic</th><th>Traitement</th></tr></thead>
        <tbody>{consultations.map((c:any)=>{
          const u=c.patient?.user;
          return <tr key={c.id} onClick={()=>navigate(`/patients/${c.patient?.id}`)}>
            <td>{new Date(c.date).toLocaleDateString('fr-FR')}</td>
            <td style={{fontWeight:500}}>{u?.firstName} {u?.lastName}</td>
            <td><span className="badge badge-info">{typeLabels[c.type]}</span></td>
            <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.diagnosis||'—'}</td>
            <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.treatment||'—'}</td>
          </tr>;
        })}</tbody></table>}
      </div>
    </div>
  );
};
export default Consultations;
