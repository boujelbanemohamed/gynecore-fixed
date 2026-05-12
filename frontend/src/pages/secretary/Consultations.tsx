import React, { useState, useEffect } from 'react';
import { secretaryAPI } from '../../services/api';

const typeLabels: Record<string,string> = { FIRST_VISIT:'Premiere visite', FOLLOW_UP:'Suivi', EMERGENCY:'Urgence', ANNUAL_CHECKUP:'Bilan annuel', PRENATAL:'Prenatal', POSTNATAL:'Postnatal' };

const SecretaryConsultations = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    secretaryAPI.getConsultations().then(r => { setConsultations(r.data.data.consultations); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500 }}>Consultations</h2>
        <p className="text-muted text-sm">{consultations.length} consultation(s) - Lecture seule</p>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {!consultations.length ? <div className="empty-state"><p>Aucune consultation</p></div> : (
          <table>
            <thead><tr><th>Date</th><th>Patiente</th><th>Type</th><th>Motif</th><th>Diagnostic</th><th>Traitement</th><th>Details</th></tr></thead>
            <tbody>{consultations.map((co: any) => {
              const u = co.patient?.user;
              return (
                <tr key={co.id}>
                  <td>{new Date(co.date).toLocaleDateString('fr-FR')}</td>
                  <td style={{ fontWeight: 500 }}>{u?.firstName} {u?.lastName}</td>
                  <td><span className="badge badge-info">{typeLabels[co.type] || co.type}</span></td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.chiefComplaint || '-'}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.diagnosis || '-'}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.treatment || '-'}</td>
                  <td><button className="btn" onClick={() => setSelected(co)} style={{ padding: '4px 12px', fontSize: 13 }}>Voir</button></td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>

      {selected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelected(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Details consultation</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['Date', new Date(selected.date).toLocaleDateString('fr-FR')],
                ['Patiente', selected.patient?.user?.firstName + ' ' + selected.patient?.user?.lastName],
                ['Type', typeLabels[selected.type] || selected.type],
                ['Motif', selected.chiefComplaint || '-'],
                ['Symptomes', selected.symptoms || '-'],
                ['Examen clinique', selected.clinicalExam || '-'],
                ['Diagnostic', selected.diagnosis || '-'],
                ['Traitement', selected.treatment || '-'],
                ['Notes', selected.notes || '-'],
                ['Poids', selected.weight ? selected.weight + ' kg' : '-'],
                ['Tension', selected.bloodPressure || '-'],
                ['Temperature', selected.temperature ? selected.temperature + ' C' : '-'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#555' }}>{l}</span>
                  <span style={{ fontSize: 14 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}><button className="btn" onClick={() => setSelected(null)} style={{ backgroundColor: '#f0f0f0' }}>Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SecretaryConsultations;
