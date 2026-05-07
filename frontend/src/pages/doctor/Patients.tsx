import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';

const emptyPatientForm = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  bloodType: '', address: '', city: '', postalCode: '', country: 'France',
  emergencyContact: '', emergencyPhone: '',
  allergies: '', chronicDiseases: '', familyHistory: '', currentMedications: '',
  lastMenstrualPeriod: '', contraceptionMethod: '',
  numberOfPregnancies: 0, numberOfDeliveries: 0,
};

const bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyPatientForm);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      const res = await doctorAPI.getPatients({ search: search || undefined });
      setPatients(res.data.data.patients);
      setTotal(res.data.data.pagination.total);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  }, [search]);

  useEffect(() => { const t = setTimeout(fetchPatients,300); return ()=>clearTimeout(t); }, [fetchPatients]);

  const calcAge = (dob: string) => Math.floor((Date.now()-new Date(dob).getTime())/(365.25*24*60*60*1000));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setFormError('');
    try { await doctorAPI.createPatient(form); fetchPatients(); setShowModal(false); setForm(emptyPatientForm); }
    catch(err:any){ setFormError(err.response?.data?.error||'Erreur'); }
    finally{ setCreating(false); }
  };

  return (
    <div>
      <div className="flex-between" style={{marginBottom:20}}>
        <div><h2 style={{fontSize:18,fontWeight:500}}>Patientes</h2><p className="text-muted text-sm">{total} patiente(s)</p></div>
        <div className="flex-center">
          <div className="search-bar"><span>🔍</span><input placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={()=>setShowModal(true)}>+ Nouvelle patiente</button>
        </div>
      </div>
      <div className="card" style={{padding:0}}>
        {loading ? <div className="loading-screen" style={{height:200}}><div className="spinner"/></div>
        : patients.length===0 ? <div className="empty-state"><div className="empty-icon">👩</div><p>Aucune patiente</p></div>
        : <div className="table-wrap"><table>
            <thead><tr><th>Patiente</th><th>Âge</th><th>Ville</th><th>Contraception</th><th>Consultations</th><th></th></tr></thead>
            <tbody>
              {patients.map(p=>(
                <tr key={p.id} onClick={()=>navigate(`/patients/${p.id}`)}>
                  <td><div style={{fontWeight:500}}>{p.user.firstName} {p.user.lastName}</div><div className="text-muted text-sm">{p.user.email}</div></td>
                  <td>{calcAge(p.dateOfBirth)} ans</td>
                  <td>{p.city||'—'}</td>
                  <td>{p.contraceptionMethod?<span className="badge badge-primary">{p.contraceptionMethod}</span>:'—'}</td>
                  <td><span className="badge badge-muted">{p._count.consultations}</span></td>
                  <td><button className="btn btn-sm btn-outline" onClick={e=>{e.stopPropagation();navigate(`/patients/${p.id}`);}}>Voir →</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal" style={{maxWidth:820,maxHeight:'92vh',display:'flex',flexDirection:'column'}}>
            <div className="modal-header"><span className="modal-title">Nouvelle patiente</span><button className="btn-close" onClick={()=>setShowModal(false)}>×</button></div>
            <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div className="modal-body" style={{overflowY:'auto'}}>
                {formError&&<div className="alert alert-error">{formError}</div>}
                <div className="card-header" style={{padding:'0 0 12px',marginBottom:14}}><span className="card-title">Informations personnelles</span></div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Prénom *</label><input className="form-control" value={form.firstName} onChange={e=>setForm(p=>({...p,firstName:e.target.value}))} required/></div>
                  <div className="form-group"><label className="form-label">Nom *</label><input className="form-control" value={form.lastName} onChange={e=>setForm(p=>({...p,lastName:e.target.value}))} required/></div>
                </div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required/></div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Date de naissance *</label><input className="form-control" type="date" value={form.dateOfBirth} onChange={e=>setForm(p=>({...p,dateOfBirth:e.target.value}))} required/></div>
                </div>
                <div className="form-group"><label className="form-label">Adresse</label><input className="form-control" value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></div>
                <div className="form-grid-3">
                  <div className="form-group"><label className="form-label">Ville</label><input className="form-control" value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Code postal</label><input className="form-control" value={form.postalCode} onChange={e=>setForm(p=>({...p,postalCode:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Pays</label><input className="form-control" value={form.country} onChange={e=>setForm(p=>({...p,country:e.target.value}))}/></div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Contact d'urgence</label><input className="form-control" value={form.emergencyContact} onChange={e=>setForm(p=>({...p,emergencyContact:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Téléphone urgence</label><input className="form-control" value={form.emergencyPhone} onChange={e=>setForm(p=>({...p,emergencyPhone:e.target.value}))}/></div>
                </div>
                <div className="card-header" style={{padding:'8px 0 12px',marginBottom:14}}><span className="card-title">Antécédents médicaux</span></div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Groupe sanguin</label><select className="form-control" value={form.bloodType} onChange={e=>setForm(p=>({...p,bloodType:e.target.value}))}><option value="">—</option>{bloodTypes.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Dernières règles</label><input className="form-control" type="date" value={form.lastMenstrualPeriod} onChange={e=>setForm(p=>({...p,lastMenstrualPeriod:e.target.value}))}/></div>
                </div>
                <div className="form-group"><label className="form-label">Allergies</label><textarea className="form-control" rows={2} value={form.allergies} onChange={e=>setForm(p=>({...p,allergies:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Maladies chroniques</label><textarea className="form-control" rows={2} value={form.chronicDiseases} onChange={e=>setForm(p=>({...p,chronicDiseases:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Antécédents familiaux</label><textarea className="form-control" rows={2} value={form.familyHistory} onChange={e=>setForm(p=>({...p,familyHistory:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Médicaments actuels</label><textarea className="form-control" rows={2} value={form.currentMedications} onChange={e=>setForm(p=>({...p,currentMedications:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Contraception</label><input className="form-control" value={form.contraceptionMethod} onChange={e=>setForm(p=>({...p,contraceptionMethod:e.target.value}))}/></div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Nombre de grossesses</label><input className="form-control" type="number" min={0} value={form.numberOfPregnancies} onChange={e=>setForm(p=>({...p,numberOfPregnancies:parseInt(e.target.value || '0')}))}/></div>
                  <div className="form-group"><label className="form-label">Nombre d'accouchements</label><input className="form-control" type="number" min={0} value={form.numberOfDeliveries} onChange={e=>setForm(p=>({...p,numberOfDeliveries:parseInt(e.target.value || '0')}))}/></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={()=>setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating?'Création...':'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Patients;
