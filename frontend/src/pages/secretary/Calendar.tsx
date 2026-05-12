import React, { useState, useEffect, useCallback } from 'react';
import { secretaryAPI } from '../../services/api';

const statusOptions = ['SCHEDULED','CONFIRMED','PENDING','ARRIVED','IN_PROGRESS','COMPLETED','CANCELLED','POSTPONED','NO_SHOW'];
const statusLabels: Record<string,string> = { SCHEDULED:'Planifie', CONFIRMED:'Confirme', PENDING:'En attente', ARRIVED:'Arrive', IN_PROGRESS:'En consultation', COMPLETED:'Termine', CANCELLED:'Annule', POSTPONED:'Reporte', NO_SHOW:'Absent' };
const typeLabels: Record<string,string> = { FIRST_VISIT:'Premiere visite', FOLLOW_UP:'Suivi', EMERGENCY:'Urgence', ANNUAL_CHECKUP:'Bilan annuel', PRENATAL:'Prenatal', POSTNATAL:'Postnatal' };
const typeOptions = [{value:'FIRST_VISIT',label:'Premiere visite'},{value:'FOLLOW_UP',label:'Suivi'},{value:'EMERGENCY',label:'Urgence'},{value:'ANNUAL_CHECKUP',label:'Bilan annuel'},{value:'PRENATAL',label:'Prenatal'},{value:'POSTNATAL',label:'Postnatal'}];

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR');
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const SecretaryCalendar = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editAppt, setEditAppt] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [unavailSlots, setUnavailSlots] = useState<any[]>([]);
  const [form, setForm] = useState({ patientId: '', date: '', startTime: '', endTime: '', type: 'FIRST_VISIT', reason: '', notes: '', status: 'SCHEDULED' });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await secretaryAPI.getAppointments();
      setAppointments(res.data.data.appointments);
      const resU = await secretaryAPI.getUnavailableSlots();
      setUnavailSlots(resU.data.data?.slots || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const openNew = () => {
    const d = selected || new Date();
    const ds = d.toISOString().split('T')[0];
    setEditAppt(null);
    setForm({ patientId: '', date: ds, startTime: '09:00', endTime: '09:30', type: 'FIRST_VISIT', reason: '', notes: '', status: 'SCHEDULED' });
    secretaryAPI.getPatients().then(r => setPatients(r.data.data.patients)).catch(() => {});
    setShowModal(true);
  };

  const openEdit = (a: any) => {
    setEditAppt(a);
    setForm({ patientId: a.patientId, date: a.startTime.split('T')[0], startTime: fmtTime(a.startTime), endTime: fmtTime(a.endTime), type: a.type, reason: a.reason || '', notes: a.notes || '', status: a.status });
    secretaryAPI.getPatients().then(r => setPatients(r.data.data.patients)).catch(() => {});
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const data = { patientId: form.patientId, startTime: form.date + 'T' + form.startTime + ':00', endTime: form.date + 'T' + form.endTime + ':00', type: form.type, reason: form.reason, notes: form.notes, status: form.status };
      if (editAppt) {
        await secretaryAPI.updateAppointment(editAppt.id, data);
      } else {
        await secretaryAPI.createAppointment(data);
      }
      setShowModal(false); fetchAppointments();
    } catch (e: any) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    await secretaryAPI.deleteAppointment(id);
    fetchAppointments();
  };

  const handleStatus = async (id: string, status: string) => {
    await secretaryAPI.updateAppointmentStatus(id, status);
    fetchAppointments();
  };

  const getDayUnavail = (d: Date) => unavailSlots.filter((u: any) => { const ud = new Date(u.startTime); return ud.toDateString() === d.toDateString(); });
  const getDayAppts = (d: Date) => appointments.filter(a => { const ad = new Date(a.startTime); return ad.toDateString() === d.toDateString(); });

  const renderMonth = () => {
    const y = selected.getFullYear(), m = selected.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    const startDay = (first.getDay() + 6) % 7;
    const days: Date[] = [];
    for (let i = 0; i < startDay; i++) days.push(new Date(y, m, 1 - startDay + i));
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i));
    while (days.length % 7) days.push(new Date(y, m + 1, days.length - startDay - last.getDate() + 1));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => <div key={d} style={{ textAlign: 'center', padding: 8, fontWeight: 600, fontSize: 13, color: '#666' }}>{d}</div>)}
        {days.map((d, i) => {
          const isMonth = d.getMonth() === m;
          const isToday = d.toDateString() === new Date().toDateString();
          const appts = getDayAppts(d);
          return (
            <div key={i} onClick={() => setSelected(d)} style={{ minHeight: 80, padding: 4, backgroundColor: isToday ? '#e8f5e9' : isMonth ? '#fff' : '#f9f9f9', border: '1px solid #eee', cursor: 'pointer', borderRadius: 4, position: 'relative' }}>
              <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isMonth ? '#333' : '#bbb' }}>{d.getDate()}</div>
              {appts.slice(0, 3).map((a: any) => (
                <div key={a.id} onClick={e => { e.stopPropagation(); openEdit(a); }} style={{ fontSize: 10, padding: '1px 4px', margin: '1px 0', backgroundColor: '#1a5c4a', color: '#fff', borderRadius: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fmtTime(a.startTime)} {a.patient?.user?.firstName}
                </div>
              ))}
              {appts.length > 3 && <div style={{ fontSize: 10, color: '#666' }}>+{appts.length - 3}</div>}
              {(() => { const ua = getDayUnavail(d); return ua.length > 0 ? <div style={{ fontSize: 10, padding: '1px 4px', margin: '1px 0', backgroundColor: '#dc3545', color: '#fff', borderRadius: 3, textAlign: 'center' }}>{ua.length} indisp.</div> : null; })()}
            </div>
          );
        })}
      </div>
    );
  };

  const dayAppts = selected ? getDayAppts(selected) : [];
  const dayUnavail = selected ? getDayUnavail(selected) : [];
  const dayItems = [...dayAppts.map((a: any) => ({...a, _type: 'apt'})), ...dayUnavail.map((u: any) => ({...u, _type: 'unavail'}))].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>Planning</h2>
          <p className="text-muted text-sm">{selected.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setSelected(new Date(selected.getFullYear(), selected.getMonth() - 1, 1))}>Mois precedent</button>
          <button className="btn" onClick={() => setSelected(new Date())}>Aujourd'hui</button>
          <button className="btn" onClick={() => setSelected(new Date(selected.getFullYear(), selected.getMonth() + 1, 1))}>Mois suivant</button>
          <button className="btn btn-primary" onClick={openNew}>+ Nouveau RDV</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div className="card" style={{ padding: 12 }}>{renderMonth()}</div>
        <div className="card" style={{ padding: 16 }}>
          <h4 style={{ marginBottom: 12 }}>{selected?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
          {!dayItems.length ? <p style={{ color: '#999', fontSize: 13 }}>Aucun rendez-vous ni indisponibilite</p> : dayItems.map((item: any) => item._type === 'unavail' ? (
            <div key={item.id} style={{ padding: '8px 10px', border: '1px solid #f5c6cb', borderRadius: 6, marginBottom: 8, backgroundColor: '#f8d7da' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#dc3545' }}>{fmtTime(item.startTime)} - {fmtTime(item.endTime)}</div>
              <div style={{ fontSize: 13, color: '#721c24' }}>Indisponible</div>
              {item.reason && <div style={{ fontSize: 12, color: '#999' }}>{item.reason}</div>}
            </div>
          ) : (
            <div key={item.id} style={{ padding: '8px 10px', border: '1px solid #eee', borderRadius: 6, marginBottom: 8, cursor: 'pointer' }} onClick={() => openEdit(item)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtTime(item.startTime)} - {fmtTime(item.endTime)}</div>
              <div style={{ fontSize: 13 }}>{item.patient?.user?.firstName} {item.patient?.user?.lastName}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{typeLabels[item.type] || item.type}</div>
              <select value={item.status} onChange={e => { e.stopPropagation(); handleStatus(item.id, e.target.value); }} onClick={e => e.stopPropagation()} style={{ marginTop: 4, fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '1px solid #ddd' }}>
                {statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 16 }}>{editAppt ? 'Modifier RDV' : 'Nouveau RDV'}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Patiente</label>
                <select value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
                  <option value="">-- Choisir --</option>
                  {patients.map((p: any) => <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }} /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Debut</label><input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }} /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Fin</label><input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}>{typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Statut</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}>{statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></div>
              </div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Motif</label><input value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }} /></div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'space-between' }}>
              {editAppt && <button className="btn" onClick={() => handleDelete(editAppt.id)} style={{ color: '#dc3545', backgroundColor: '#fff', border: '1px solid #dc3545' }}>Supprimer</button>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setShowModal(false)} style={{ backgroundColor: '#f0f0f0' }}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSave}>{editAppt ? 'Modifier' : 'Creer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SecretaryCalendar;
