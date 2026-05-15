import React from 'react';
import { typeLabels } from './constants';

interface Props {
  consultations: any[];
}

const PatientConsultationsTab: React.FC<Props> = ({ consultations }) => {
  if (!consultations?.length) {
    return (
      <div className="card">
        <div className="empty-state"><div className="empty-icon">📋</div><p>Aucune consultation</p></div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {consultations.map((c: any) => (
        <div className="card" key={c.id}>
          <div className="card-header">
            <span style={{ fontWeight: 500 }}>
              {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' +
               new Date(c.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="badge badge-info">{typeLabels[c.type] || c.type}</span>
          </div>
          {c.chiefComplaint && <div className="detail-row"><span className="detail-label">Motif de consultation</span><span>{c.chiefComplaint}</span></div>}
          {c.symptoms && <div className="detail-row"><span className="detail-label">Symptômes</span><span>{c.symptoms}</span></div>}
          <div className="detail-row">
            <span className="detail-label">Constantes</span>
            <span>{[c.weight ? c.weight + ' kg' : '', c.height ? c.height + ' cm' : '', c.bloodPressure, c.temperature ? c.temperature + '°C' : '', c.heartRate ? c.heartRate + ' bpm' : ''].filter(Boolean).join(' · ') || '—'}</span>
          </div>
          {c.generalState && <div className="detail-row"><span className="detail-label">État général</span><span>{c.generalState}</span></div>}
          {c.ddr && <div className="detail-row"><span className="detail-label">DDR</span><span>{new Date(c.ddr).toLocaleDateString('fr-FR')}</span></div>}
          {c.examDetails?.abdomen && <div className="detail-row"><span className="detail-label">Abdomen</span><span>{c.examDetails.abdomen}</span></div>}
          {c.examDetails?.uterusState && <div className="detail-row"><span className="detail-label">État utérin</span><span>{c.examDetails.uterusState}</span></div>}
          {c.examDetails?.uterineHeight && <div className="detail-row"><span className="detail-label">Hauteur utérine</span><span>{c.examDetails.uterineHeight}</span></div>}
          {c.examDetails?.bcf && <div className="detail-row"><span className="detail-label">BCF</span><span>{c.examDetails.bcf}</span></div>}
          {c.diagnosis && <div className="detail-row"><span className="detail-label">Diagnostic</span><span style={{ fontWeight: 500 }}>{c.diagnosis}</span></div>}
          {c.treatment && <div className="detail-row"><span className="detail-label">Traitement</span><span>{c.treatment}</span></div>}
          {c.notes && <div className="detail-row"><span className="detail-label">Notes</span><span>{c.notes}</span></div>}
          {c.nextVisit && <div className="detail-row"><span className="detail-label">Prochain RDV</span><span style={{ color: 'var(--info)' }}>{new Date(c.nextVisit).toLocaleDateString('fr-FR')}</span></div>}
        </div>
      ))}
    </div>
  );
};

export default PatientConsultationsTab;
