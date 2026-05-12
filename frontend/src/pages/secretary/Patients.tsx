import React, { useState, useEffect, useCallback } from 'react';
import { secretaryAPI } from '../../services/api';

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', cin: '', address: '', city: '', postalCode: '', country: '', insurance: '', insuranceNumber: '' };

const SecretaryPatients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ success: '', error: '' });

  const fetchPatients = useCallback(async () => {
    try {
      const res = await secretaryAPI.getPatients({ search: search || undefined });
      setPatients(res.data.data.patients);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleSubmit = async () => {
    setSaving(true); setMsg({ success: '', error: '' });
    try {
      if (editId) {
        await secretaryAPI.updatePatient(editId, form);
        setMsg({ success: 'Patient modifie', error: '' });
      } else {
        await secretaryAPI.createPatient(form);
        setMsg({ success: 'Patient cree', error: '' });
      }
      setShowModal(false); setEditId(null); setForm(emptyForm); fetchPatients();
    } catch (e: any) {
      setMsg({ success: '', error: e.response?.data?.message || 'Erreur' });
    }
    setSaving(false);
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      firstName: p.user.firstName, lastName: p.user.lastName, email: p.user.email || '', phone: p.user.phone || '',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '', cin: p.cin || '', address: p.address || '',
      city: p.city || '', postalCode: p.postalCode || '', country: p.country || '',
      insurance: p.insurance || '', insuranceNumber: p.insuranceNumber || '',
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>Patientes</h2>
          <p className="text-muted text-sm">{patients.length} patientes</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, width: 250 }} />
          <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(emptyForm); setShowModal(true); }}>+ Nouvelle patiente</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {!patients.length ? <div className="empty-state"><p>Aucune patiente</p></div> : (
          <table>
            <thead><tr><th>Nom</th><th>Telephone</th><th>Date de naissance</th><th>CIN</th><th>Assurance</th><th>Actions</th></tr></thead>
            <tbody>{patients.map((p: any) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.user.firstName} {p.user.lastName}</td>
                <td>{p.user.phone || '-'}</td>
                <td>{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('fr-FR') : '-'}</td>
                <td>{p.cin || '-'}</td>
                <td>{p.insurance || '-'}</td>
                <td><button className="btn" onClick={() => openEdit(p)} style={{ padding: '4px 12px', fontSize: 13 }}>Modifier</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 16 }}>{editId ? 'Modifier la patiente' : 'Nouvelle patiente'}</h3>
            {msg.success && <div style={{ padding: 10, backgroundColor: '#d4edda', color: '#155724', borderRadius: 8, marginBottom: 12 }}>{msg.success}</div>}
            {msg.error && <div style={{ padding: 10, backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 8, marginBottom: 12 }}>{msg.error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['firstName', 'Prenom'], ['lastName', 'Nom'], ['email', 'Email'], ['phone', 'Telephone'],
                ['dateOfBirth', 'Date de naissance', 'date'], ['cin', 'CIN'], ['address', 'Adresse'],
                ['city', 'Ville'], ['postalCode', 'Code postal'], ['insurance', 'Assurance'], ['insuranceNumber', "Numero d'assurance"],
              ].map(([k, l, t]) => (
                <div key={k} style={k === 'address' ? { gridColumn: '1/-1' } : {}}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#555' }}>{l}</label>
                  <input type={t || 'text'} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} value={(form as any)[k]} onChange={e => setForm({...form, [k]: e.target.value})} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)} style={{ backgroundColor: '#f0f0f0' }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? '...' : editId ? 'Modifier' : 'Creer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SecretaryPatients;
