import React, { useEffect, useState } from 'react';
import { patientAPI } from '../../services/api';

const typeLabels: Record<string,string> = {FIRST_VISIT:'Première visite',FOLLOW_UP:'Suivi',EMERGENCY:'Urgence',ANNUAL_CHECKUP:'Bilan annuel',PRENATAL:'Prénatal',POSTNATAL:'Postnatal'};

const PatientDossier: React.FC = () => {
  const [dossier, setDossier] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info'|'consultations'>('info');

  useEffect(() => {
    Promise.all([patientAPI.getDossier(),patientAPI.getConsultations()]).then(([d,c])=>{setDossier(d.data.data);setConsultations(c.data.data);}).finally(()=>setLoading(false));
  }, []);

  if(loading)return <div className="loading-screen"><div className="spinner"/></div>;
  if(!dossier)return null;
  const u=dossier.user;
  const calcAge=(dob:string)=>Math.floor((Date.now()-new Date(dob).getTime())/(365.25*24*60*60*1000));

  return (
    <div>
      <div className="portal-header"><h2>Mon dossier médical</h2><p>Vos informations médicales personnelles</p></div>
      <div className="tabs">
        <button className={`tab-btn${tab==='info'?' active':''}`} onClick={()=>setTab('info')}>Informations médicales</button>
        <button className={`tab-btn${tab==='consultations'?' active':''}`} onClick={()=>setTab('consultations')}>Consultations ({consultations.length})</button>
      </div>
      {tab==='info'&&(
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">Informations personnelles</span></div>
            {[['Nom complet',`${u.firstName} ${u.lastName}`],['Email',u.email],['Téléphone',u.phone||'—'],['Âge',dossier.dateOfBirth?`${calcAge(dossier.dateOfBirth)} ans`:'—'],['Ville',dossier.city||'—']].map(([l,v])=>(
              <div className="detail-row" key={l}><span className="detail-label">{l}</span><span className="detail-value">{v}</span></div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Informations médicales</span></div>
            {[['Groupe sanguin',dossier.bloodType||'—'],['Allergies',dossier.allergies||'Aucune'],['Maladies chroniques',dossier.chronicDiseases||'Aucune'],['Contraception',dossier.contraceptionMethod||'—'],['Grossesses',String(dossier.numberOfPregnancies||0)],['Accouchements',String(dossier.numberOfDeliveries||0)]].map(([l,v])=>(
              <div className="detail-row" key={l}><span className="detail-label">{l}</span><span className="detail-value">{v}</span></div>
            ))}
          </div>
        </div>
      )}
      {tab==='consultations'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {!consultations.length?<div className="card"><div className="empty-state"><div className="empty-icon">📋</div><p>Aucune consultation</p></div></div>:
          consultations.map((c:any)=>(
            <div className="card" key={c.id}>
              <div className="card-header"><span style={{fontWeight:500}}>{new Date(c.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span><span className="badge badge-info">{typeLabels[c.type]}</span></div>
              {c.diagnosis&&<div className="detail-row"><span className="detail-label">Diagnostic</span><span className="detail-value">{c.diagnosis}</span></div>}
              {c.treatment&&<div className="detail-row"><span className="detail-label">Traitement</span><span className="detail-value">{c.treatment}</span></div>}
              {c.nextVisit&&<div className="detail-row"><span className="detail-label">Prochain RDV</span><span className="detail-value" style={{color:'var(--info)'}}>{new Date(c.nextVisit).toLocaleDateString('fr-FR')}</span></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default PatientDossier;
