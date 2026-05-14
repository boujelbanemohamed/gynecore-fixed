import React, { useState, useEffect } from 'react';
import { superadminAPI } from '../../services/api';

const SuperadminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', licenseNumber: '', specialization: '', clinicName: '' });
  const [msg, setMsg] = useState<{type:string;text:string}|null>(null);

  const load = () => {
    setLoading(true);
    superadminAPI.getDoctors().then(r => setDoctors(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await superadminAPI.createDoctor(form);
      setMsg({ type: 'ok', text: 'Médecin créé' });
      setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', licenseNumber: '', specialization: '', clinicName: '' });
      setShowForm(false);
      load();
    } catch (err: any) { setMsg({ type: 'err', text: err.response?.data?.error || 'Erreur' }); }
  };

  const handleResetPassword = async (id: string) => {
    if (!window.confirm('Réinitialiser le mot de passe ?')) return;
    try {
      const r = await superadminAPI.resetDoctorPassword(id);
      alert(`Nouveau mot de passe: ${r.data.data.tempPassword}`);
    } catch { alert('Erreur'); }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await superadminAPI.updateDoctor(id, { isActive: !current });
      load();
    } catch { alert('Erreur'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Gestion des Médecins</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouveau médecin'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Créer un médecin</h3>
          {msg && <div className={`alert ${msg.type === 'ok' ? 'badge-success' : 'alert-error'}`} style={{ padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{msg.text}</div>}
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 600 }}>
            <div><label className="form-label">Email *</label><input className="form-control" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><label className="form-label">Mot de passe *</label><input className="form-control" required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
            <div><label className="form-label">Prénom *</label><input className="form-control" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
            <div><label className="form-label">Nom *</label><input className="form-control" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
            <div><label className="form-label">Téléphone</label><input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><label className="form-label">RPPS</label><input className="form-control" value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} /></div>
            <div><label className="form-label">Spécialité</label><input className="form-control" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} /></div>
            <div><label className="form-label">Cabinet</label><input className="form-control" value={form.clinicName} onChange={e => setForm({...form, clinicName: e.target.value})} /></div>
            <div style={{ gridColumn: '1 / -1' }}><button type="submit" className="btn btn-primary btn-sm">Créer</button></div>
          </form>
        </div>
      )}

      {loading ? <p>Chargement...</p> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#f9f9f9' }}>
              <th style={{ padding: 10 }}>Nom</th><th style={{ padding: 10 }}>Email</th><th style={{ padding: 10 }}>Spécialité</th>
              <th style={{ padding: 10 }}>Patients</th><th style={{ padding: 10 }}>RDV</th><th style={{ padding: 10 }}>Statut</th><th style={{ padding: 10 }}>Actions</th>
            </tr></thead>
            <tbody>
              {doctors.map((d: any) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 10, fontWeight: 500 }}>{d.firstName} {d.lastName}</td>
                  <td style={{ padding: 10 }}>{d.email}</td>
                  <td style={{ padding: 10 }}>{d.specialization || '-'}</td>
                  <td style={{ padding: 10 }}>{d.patientsCount}</td>
                  <td style={{ padding: 10 }}>{d.appointmentsCount}</td>
                  <td style={{ padding: 10 }}>
                    <span className={`badge ${d.isActive ? 'badge-success' : 'badge-error'}`}>
                      {d.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <button className="btn btn-outline btn-sm" style={{ marginRight: 4 }} onClick={() => handleResetPassword(d.id)}>Reset MDP</button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(d.id, d.isActive)}>
                      {d.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#999' }}>Aucun médecin</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SuperadminDoctors;
