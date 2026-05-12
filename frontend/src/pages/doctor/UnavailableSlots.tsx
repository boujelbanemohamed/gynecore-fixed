import React, { useState, useEffect } from 'react';
import { doctorAPI } from '../../services/api';

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdAt: string;
}

const UnavailableSlots: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formulaire
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await doctorAPI.getUnavailableSlots();
      setSlots(res.data.data.slots || []);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      setError('Veuillez selectionner une date');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const startDT = new Date(startDate + 'T' + startTime + ':00');
      const endDT = new Date(startDate + 'T' + endTime + ':00');
      await doctorAPI.createUnavailableSlot({
        startTime: startDT.toISOString(),
        endTime: endDT.toISOString(),
        reason: reason || null,
      });
      setSuccessMsg('Creneau indisponible ajoute');
      setReason('');
      fetchSlots();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'ajout';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce creneau indisponible ?')) return;
    try {
      await doctorAPI.deleteUnavailableSlot(id);
      setSlots(prev => prev.filter(s => s.id !== id));
      setSuccessMsg('Creneau supprime');
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const fmt = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' };
  const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 };
  const cardTitle: React.CSSProperties = { margin: '0 0 24px', fontSize: '1.15rem', fontWeight: 700, color: '#16213e', paddingBottom: 12, borderBottom: '2px solid #f0f0f0' };
  const btnPrimary: React.CSSProperties = { padding: '10px 28px', backgroundColor: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 };
  const btnDanger: React.CSSProperties = { padding: '6px 16px', backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 };

  return (
    <div>
      <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#4a5568' }}>Indisponibilites</h2>
      <p style={{ margin: '0 0 28px', color: '#a0aec0', fontSize: '0.9rem' }}>
        Gerez vos creneaux d'indisponibilite. Les rendez-vous ne pourront pas etre places sur ces plages horaires.
      </p>

      {successMsg && <div style={{ padding: '12px 16px', marginBottom: 16, backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: 8, color: '#22543d', fontSize: '0.9rem' }}>{successMsg}</div>}
      {error && <div style={{ padding: '12px 16px', marginBottom: 16, backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, color: '#c53030', fontSize: '0.9rem' }}>{error}</div>}

      {/* Formulaire */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>Ajouter un creneau</h3>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input style={inputStyle} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Heure debut</label>
              <input style={inputStyle} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Heure fin</label>
              <input style={inputStyle} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Motif (optionnel)</label>
            <input style={inputStyle} type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Conge, formation, personnel..." />
          </div>
          <button type="submit" style={btnPrimary} disabled={submitting}>
            {submitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      </div>

      {/* Liste */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>Mes indisponibilites</h3>
        {loading ? (
          <p style={{ color: '#718096' }}>Chargement...</p>
        ) : slots.length === 0 ? (
          <p style={{ color: '#a0aec0' }}>Aucun creneau d'indisponibilite defini.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slots.map(slot => (
              <div key={slot.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#c53030', fontSize: '0.9rem', marginBottom: 2 }}>
                    {fmt(slot.startTime)} — {fmt(slot.endTime)}
                  </div>
                  {slot.reason && <div style={{ color: '#718096', fontSize: '0.82rem' }}>{slot.reason}</div>}
                </div>
                <button style={btnDanger} onClick={() => handleDelete(slot.id)}>Supprimer</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnavailableSlots;
