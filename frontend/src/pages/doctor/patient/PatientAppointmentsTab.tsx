import React, { useState } from 'react';
import { typeLabels } from './constants';

interface Props {
  appointments: any[];
  patientId: string;
  onRefresh: () => void;
  onAlert: (msg: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null) => void;
}

const PatientAppointmentsTab: React.FC<Props> = ({ appointments, patientId, onRefresh, onAlert }) => {
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptSaving, setApptSaving] = useState(false);
  const [apptForm, setApptForm] = useState({ date: '', startTime: '09:00', endTime: '09:30', type: 'FOLLOW_UP', reason: '' });

  const updAppt = (patch: any) => setApptForm(prev => ({ ...prev, ...patch }));

  const openApptModal = () => {
    setApptForm({ date: new Date().toISOString().slice(0, 10), startTime: '09:00', endTime: '09:30', type: 'FOLLOW_UP', reason: '' });
    setShowApptModal(true);
  };

  const handleCreateAppt = async () => {
    if (!apptForm.date || !apptForm.startTime || !apptForm.endTime) {
      onAlert({ type: 'warning', text: 'Date et heures requises' });
      return;
    }
    setApptSaving(true);
    try {
      const doctorAPI = (await import('../../../services/api')).doctorAPI;
      const start = new Date(apptForm.date + 'T' + apptForm.startTime);
      const end = new Date(apptForm.date + 'T' + apptForm.endTime);
      if (end <= start) { onAlert({ type: 'warning', text: "L'heure de fin doit etre apres l'heure de debut" }); setApptSaving(false); return; }
      const profRes = await (doctorAPI as any).getProfile();
      await (doctorAPI as any).createAppointment({
        patientId,
        doctorId: profRes.data.data.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: apptForm.type,
        reason: apptForm.reason || undefined,
      });
      onRefresh();
      setShowApptModal(false);
    } catch (err: any) { onAlert({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la creation' }); }
    finally { setApptSaving(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={openApptModal}>+ Rendez-vous</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {!appointments?.length ? (
          <div className="empty-state"><div className="empty-icon">📅</div><p>Aucun rendez-vous</p></div>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Heure</th><th>Type</th><th>Motif</th><th>Statut</th></tr></thead>
            <tbody>
              {appointments.map((a: any) => (
                <tr key={a.id}>
                  <td>{new Date(a.startTime).toLocaleDateString('fr-FR')}</td>
                  <td>{new Date(a.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td><span className="badge badge-info">{typeLabels[a.type] || a.type}</span></td>
                  <td>{a.reason || '—'}</td>
                  <td>
                    <span className={`badge ${a.status === 'CONFIRMED' ? 'badge-success' : a.status === 'CANCELLED' ? 'badge-danger' : a.status === 'COMPLETED' ? 'badge-muted' : 'badge-info'}`}>
                      {a.status === 'SCHEDULED' ? 'Planifié' : a.status === 'CONFIRMED' ? 'Confirmé' : a.status === 'CANCELLED' ? 'Annulé' : a.status === 'COMPLETED' ? 'Effectué' : 'Non présent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showApptModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowApptModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">Nouveau rendez-vous</span>
              <button className="btn-close" onClick={() => setShowApptModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-control" type="date" value={apptForm.date} onChange={e => updAppt({ date: e.target.value })} />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Heure debut *</label>
                  <input className="form-control" type="time" value={apptForm.startTime} onChange={e => updAppt({ startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Heure fin *</label>
                  <input className="form-control" type="time" value={apptForm.endTime} onChange={e => updAppt({ endTime: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={apptForm.type} onChange={e => updAppt({ type: e.target.value })}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Motif</label>
                <textarea className="form-control" rows={2} placeholder="Motif du rendez-vous..." value={apptForm.reason} onChange={e => updAppt({ reason: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowApptModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCreateAppt} disabled={apptSaving}>
                {apptSaving ? 'Enregistrement...' : 'Creer le rendez-vous'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointmentsTab;
