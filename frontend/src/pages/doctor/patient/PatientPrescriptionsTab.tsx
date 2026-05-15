import React, { useState } from 'react';
import { escapeHtml, fileUrl, printInIframe } from './constants';

interface Props {
  patient: any;
  prescriptions: any[];
  doctorProfile: any;
  onRefresh: () => void;
  onAlert: (msg: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null) => void;
  onConfirm: (dialog: { message: string; onConfirm: () => void; danger?: boolean } | null) => void;
}

const PatientPrescriptionsTab: React.FC<Props> = ({ patient, prescriptions, doctorProfile, onRefresh, onAlert, onConfirm }) => {
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [prescSaving, setPrescSaving] = useState(false);
  const [prescMeds, setPrescMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [prescNotes, setPrescNotes] = useState('');
  const [prescDate, setPrescDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingPrescId, setEditingPrescId] = useState<string | null>(null);

  const handleEditPresc = async (p: any) => {
    const meds = (p.medications || []).map((m: any) => ({
      name: m.name || '', dosage: m.dosage || '', frequency: m.frequency || '',
      duration: m.duration || '', instructions: m.instructions || '',
    }));
    setPrescMeds(meds.length > 0 ? meds : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setPrescNotes(p.notes || '');
    setPrescDate(p.date ? new Date(p.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditingPrescId(p.id);
    setShowPrescModal(true);
  };

  const handleUpdatePresc = async () => {
    if (!editingPrescId) return;
    const validMeds = prescMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) { onAlert({ type: 'warning', text: 'Ajoutez au moins un médicament' }); return; }
    setPrescSaving(true);
    try {
      const { doctorAPI } = await import('../../../services/api');
      await (doctorAPI as any).updatePrescription(editingPrescId, { medications: validMeds, notes: prescNotes || undefined, date: prescDate || undefined });
      onRefresh();
      setShowPrescModal(false);
      setEditingPrescId(null);
    } catch (err: any) { onAlert({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la modification' }); }
    finally { setPrescSaving(false); }
  };

  const openPrescModal = () => {
    setPrescMeds([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setEditingPrescId(null);
    setPrescNotes('');
    setShowPrescModal(true);
  };

  const addMedRow = () => setPrescMeds([...prescMeds, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeMedRow = (i: number) => setPrescMeds(prescMeds.filter((_, idx) => idx !== i));
  const updateMed = (i: number, patch: any) => setPrescMeds(prescMeds.map((m, idx) => idx === i ? { ...m, ...patch } : m));

  const handleCreatePresc = async () => {
    const validMeds = prescMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) { onAlert({ type: 'warning', text: 'Ajoutez au moins un médicament' }); return; }
    setPrescSaving(true);
    try {
      const { doctorAPI } = await import('../../../services/api');
      await doctorAPI.createPrescription({ patientId: patient.id, medications: validMeds, notes: prescNotes || undefined, date: prescDate || undefined });
      onRefresh();
      setShowPrescModal(false);
    } catch (err: any) { onAlert({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la création' }); }
    finally { setPrescSaving(false); }
  };

  const handlePrintPresc = async (prescId: string) => {
    try {
      const { doctorAPI } = await import('../../../services/api');
      const res = await doctorAPI.getPrescriptionById(prescId);
      const presc = res.data.data;
      const medsRows = (presc.medications || []).map((m: any) =>
        '<tr><td style="font-weight:500">' + escapeHtml(m.name||'') + '</td><td>' + escapeHtml(m.dosage||'') + '</td><td>' + escapeHtml(m.frequency||'') + '</td><td>' + escapeHtml(m.duration||'') + '</td><td>' + escapeHtml(m.instructions||'') + '</td></tr>'
      ).join('');
      const pName = escapeHtml((presc.patient?.user?.firstName||'') + ' ' + (presc.patient?.user?.lastName||''));
      const pAge = presc.patient?.dateOfBirth ? Math.floor((Date.now() - new Date(presc.patient.dateOfBirth).getTime()) / (365.25*24*60*60*1000)) + ' ans' : '--';
      let logoHtml = '';
      if (doctorProfile?.logo) {
        try {
          const imgUrl = fileUrl(doctorProfile.logo);
          const imgRes = await fetch(imgUrl);
          const blob = await imgRes.blob();
          logoHtml = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve('<img style="width:64px;height:64px;border-radius:50%;object-fit:contain;border:2px solid #1a5c4a;" src="' + reader.result + '" />');
            reader.readAsDataURL(blob);
          });
        } catch { logoHtml = ''; }
      }
      const notesHtml = presc.notes ? '<div class="rx-notes"><strong>Notes :</strong> ' + escapeHtml(presc.notes) + '</div>' : '';
      const licHtml = doctorProfile?.licenseNumber ? '<div class="rx-contact">N Licence : ' + escapeHtml(doctorProfile.licenseNumber) + (doctorProfile?.rppsNumber ? ' . RPPS : ' + escapeHtml(doctorProfile.rppsNumber) : '') + '</div>' : '';
      const html = '<div>' +
        '<div class="rx-header">' + logoHtml +
        '<div class="rx-info">' +
        '<div class="rx-clinic-name">' + escapeHtml(doctorProfile?.clinicName||'') + '</div>' +
        '<h2>Dr ' + escapeHtml(doctorProfile?.lastName||'') + ' ' + escapeHtml(doctorProfile?.firstName||'') + '</h2>' +
        '<div class="rx-specialty">' + escapeHtml(doctorProfile?.specialization||'Gynecologie-Obstetrique') + '</div>' +
        '<div class="rx-services">' + escapeHtml(doctorProfile?.services||'') + '</div>' +
        '<div class="rx-contact">' + escapeHtml(doctorProfile?.phone||'') + (doctorProfile?.email?' . ':'') + escapeHtml(doctorProfile?.email||'') + '</div>' +
        '</div></div>' +
        '<div class="rx-title">Ordonnance Medicale</div>' +
        '<div class="rx-patient"><div><strong>Patiente :</strong> ' + pName + '</div><div><strong>Age :</strong> ' + pAge + '</div></div>' +
        '<div class="rx-date-place">Fait a ' + escapeHtml(doctorProfile?.city||'') + ', le ' + new Date(presc.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) + '</div>' +
        '<table class="rx-meds-table"><thead><tr><th>Medicament</th><th>Dosage</th><th>Frequence</th><th>Duree</th><th>Instructions</th></tr></thead><tbody>' + medsRows + '</tbody></table>' +
        notesHtml +
        '<div class="rx-footer"><div class="rx-signature"><div class="rx-sig-line">Signature et cachet du medecin</div></div></div>' +
        '</div>';
      printInIframe(html);
    } catch { onAlert({ type: 'error', text: 'Erreur lors du chargement' }); }
  };

  if (!prescriptions?.length) {
    return (
      <div className="card">
        <div className="empty-state"><div className="empty-icon">💊</div><p>Aucune ordonnance</p></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={openPrescModal}>+ Ordonnance</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {prescriptions.map((p: any) => (
          <div className="card" key={p.id} style={{ borderLeft: `3px solid ${p.isValid ? 'var(--success)' : 'var(--border)'}` }}>
            <div className="card-header">
              <span style={{ fontWeight: 500 }}>Ordonnance du {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + new Date(p.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`badge ${p.isValid ? 'badge-success' : 'badge-muted'}`}>{p.isValid ? 'Valide' : 'Expirée'}</span>
                <button className="btn btn-outline btn-sm" onClick={() => handlePrintPresc(p.id)}>🖨 Imprimer</button>
                <button className="btn btn-outline btn-sm" onClick={() => handleEditPresc(p)}>✏ Modifier</button>
                <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: '#f5c6c3' }}
                  onClick={() => onConfirm({ message: 'Supprimer cette ordonnance ?', onConfirm: async () => {
                    try { const { doctorAPI } = await import('../../../services/api'); await (doctorAPI as any).deletePrescription(p.id); onRefresh(); }
                    catch { onAlert({ type: 'error', text: 'Erreur lors de la suppression' }); }
                  }})}>
                  Supprimer
                </button>
              </div>
            </div>
            <table>
              <thead><tr><th>Médicament</th><th>Dosage</th><th>Fréquence</th><th>Durée</th><th>Instructions</th></tr></thead>
              <tbody>
                {(p.medications || []).map((m: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td>{m.dosage}</td>
                    <td>{m.frequency}</td>
                    <td>{m.duration}</td>
                    <td>{m.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {p.notes && <p className="text-sm text-muted" style={{ marginTop: 8 }}>Note : {p.notes}</p>}
          </div>
        ))}
      </div>

      {showPrescModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPrescModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <span className="modal-title">{editingPrescId ? "Modifier l'ordonnance" : 'Nouvelle ordonnance'}</span>
              <button className="btn-close" onClick={() => setShowPrescModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 40px', gap: 8, fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                  <span>Médicament *</span><span>Dosage</span><span>Fréquence</span><span>Durée</span><span></span>
                </div>
                {prescMeds.map((med, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 40px', gap: 8, alignItems: 'center' }}>
                    <input className="form-control" placeholder="Nom" value={med.name} onChange={e => updateMed(i, { name: e.target.value })} />
                    <input className="form-control" placeholder="Dosage" value={med.dosage} onChange={e => updateMed(i, { dosage: e.target.value })} />
                    <input className="form-control" placeholder="Fréquence" value={med.frequency} onChange={e => updateMed(i, { frequency: e.target.value })} />
                    <input className="form-control" placeholder="Durée" value={med.duration} onChange={e => updateMed(i, { duration: e.target.value })} />
                    <button className="btn-close" style={{ fontSize: 16 }} onClick={() => removeMedRow(i)} disabled={prescMeds.length <= 1}>×</button>
                  </div>
                ))}
                <button className="btn btn-outline btn-sm" onClick={addMedRow} style={{ alignSelf: 'flex-start' }}>+ Ajouter un médicament</button>
              </div>
              <div className="form-group">
                <label className="form-label">Date de l'ordonnance</label>
                <input className="form-control" type="date" value={prescDate} onChange={e => setPrescDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} placeholder="Notes complémentaires..." value={prescNotes} onChange={e => setPrescNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPrescModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={editingPrescId ? handleUpdatePresc : handleCreatePresc} disabled={prescSaving}>
                {prescSaving ? 'Enregistrement...' : editingPrescId ? 'Modifier' : "Créer l'ordonnance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptionsTab;
