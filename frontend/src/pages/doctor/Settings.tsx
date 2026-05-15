import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI } from '../../services/api';
import Alert from '../../components/shared/Alert';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const IMG_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string|null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [gcConnected, setGcConnected] = useState(false);
  const [gcEventsCount, setGcEventsCount] = useState(0);
  const [gcSyncing, setGcSyncing] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{message:string;onConfirm:()=>void}|null>(null);
  const [form, setForm] = useState({
    specialization: '', licenseNumber: '', rppsNumber: '',
    clinicName: '', address: '', city: '', postalCode: '', country: 'France',
    logo: '', services: '',
  });

  useEffect(() => {
    doctorAPI.getProfile().then(r => {
      const p = r.data.data;
      setForm({
        specialization: p.specialization || '', licenseNumber: p.licenseNumber || '', rppsNumber: p.rppsNumber || '',
        clinicName: p.clinicName || '', address: p.address || '', city: p.city || '', postalCode: p.postalCode || '',
        country: p.country || 'France', logo: p.logo || '', services: p.services || '',
      });
    }).catch(() => {});
    doctorAPI.getGoogleCalendarStatus().then(r => {
      setGcConnected(r.data.data?.connected || false);
    }).catch(() => {});
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await doctorAPI.getHealth();
      setHealth(res.data.data);
    } catch {} finally { setLoadingHealth(false); }
  };

  const update = (patch: any) => setForm(prev => ({ ...prev, ...patch }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await doctorAPI.updateProfile({
        specialization: form.specialization, licenseNumber: form.licenseNumber,
        rppsNumber: form.rppsNumber, clinicName: form.clinicName,
        address: form.address, city: form.city, postalCode: form.postalCode,
        country: form.country, services: form.services,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await doctorAPI.uploadLogo(file);
      update({ logo: res.data.data.logo });
    } catch { setErrorMsg("Erreur lors de l'upload du logo"); }
    finally { setUploadingLogo(false); }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 20 }}>Parametres</h2>

      <form onSubmit={handleSave}>
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Informations professionnelles</span></div>
            <div className="form-group">
              <label className="form-label">Specialite</label>
              <input className="form-control" placeholder="Gynecologue-Obstetricien" value={form.specialization} onChange={e => update({ specialization: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">N. de licence</label>
              <input className="form-control" placeholder="Ex: 12345" value={form.licenseNumber} onChange={e => update({ licenseNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">N. RPPS</label>
              <input className="form-control" placeholder="Ex: 10123456789" value={form.rppsNumber} onChange={e => update({ rppsNumber: e.target.value })} />
            </div>
          <div className="form-group">
              <label className="form-label">Services</label>
              <textarea className="form-control" rows={3} placeholder="Ex: Echographie 3D - Fecondation In vitro - ..." value={form.services} onChange={e => update({ services: e.target.value })} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Coordonnees du cabinet</span></div>
            <div className="form-group">
              <label className="form-label">Nom du cabinet</label>
              <input className="form-control" placeholder="Cabinet Dr. Martin" value={form.clinicName} onChange={e => update({ clinicName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse</label>
              <input className="form-control" placeholder="12 Rue de la Sante" value={form.address} onChange={e => update({ address: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Code postal</label>
                <input className="form-control" placeholder="75014" value={form.postalCode} onChange={e => update({ postalCode: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Ville</label>
                <input className="form-control" placeholder="Paris" value={form.city} onChange={e => update({ city: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Pays</label>
                <input className="form-control" placeholder="France" value={form.country} onChange={e => update({ country: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Logo du cabinet</span></div>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Ce logo sera affiche sur les ordonnances imprimees. Format recommande : carre, 200x200 px minimum.
            </p>
            <input type="file" ref={logoInputRef} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.gif,.webp" onChange={handleLogoUpload} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 100, height: 100, borderRadius: 12,
                border: form.logo ? 'none' : '2px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', background: 'var(--bg-secondary, #f8f9fa)',
                flexShrink: 0,
              }}>
                {uploadingLogo ? (
                  <div className="spinner" />
                ) : form.logo ? (
                  <img src={`${IMG_BASE}${form.logo}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 32, color: 'var(--text-muted)' }}>+</span>
                )}
              </div>
              <div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                  {form.logo ? 'Changer le logo' : 'Telecharger un logo'}
                </button>
                {form.logo && (
                  <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={async () => { try { await doctorAPI.updateProfile({ logo: null as any }); update({ logo: '' }); } catch { setErrorMsg("Erreur lors de la suppression du logo"); } }}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GOOGLE CALENDAR */}
          <div className="card">
            <div className="card-header"><span className="card-title">Google Agenda</span></div>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Connectez votre Google Agenda pour afficher vos événements directement dans le planning GyneCare.
            </p>
            <div style={{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'14px 16px',borderRadius:'var(--radius-sm)',
              background:gcConnected?'#f1f8e9':'#fff8e1',
              border:gcConnected?'1px solid #c8e6c9':'1px solid #ffe082'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>{gcConnected?'✅':'⚠️'}</span>
                <div>
                  <div style={{fontWeight:500,fontSize:14,color:gcConnected?'#2e7d32':'#e65100'}}>
                    {gcConnected?'Connecté à Google Agenda':'Non connecté'}
                  </div>
                  {gcConnected&&<div className="text-muted" style={{fontSize:12,marginTop:2}}>Les événements Google s'affichent dans le planning</div>}
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                {gcConnected&&<button className="btn btn-outline btn-sm" disabled={gcSyncing} onClick={async () => {
                  setGcSyncing(true);
                  try {
                    const y=new Date().getFullYear(), m=new Date().getMonth();
                    const res=await doctorAPI.getGoogleCalendarEvents({start:new Date(y,m,1).toISOString(),end:new Date(y,m+1,0,23,59,59).toISOString()});
                    setGcEventsCount(res.data.data?.events?.length||0);
                    setSuccess(true);
                    setTimeout(()=>setSuccess(false),3000);
                  } catch(err:any) {
                    setErrorMsg(err.response?.data?.error||'Erreur de synchronisation');
                  } finally {setGcSyncing(false);}
                }} style={{fontSize:11}}>{gcSyncing?'...':'⟳ Synchroniser'}</button>}
                {!gcConnected
                  ?<button className="btn btn-sm" onClick={async ()=>{
                      try {
                        const res=await doctorAPI.getGoogleAuthUrl();
                        if(res.data.data?.url) window.open(res.data.data.url,'_self');
                      } catch {setErrorMsg('Erreur de connexion');}
                    }} style={{background:'#34a853',color:'white',fontSize:11}}>Connecter</button>
                  :<button className="btn btn-outline btn-sm" onClick={()=>setConfirmDialog({
                      message:'Déconnecter Google Agenda ?',
                      onConfirm:async ()=>{
                        setConfirmDialog(null);
                        try {
                          await doctorAPI.disconnectGoogleCalendar();
                          setGcConnected(false);
                        } catch {setErrorMsg('Erreur de déconnexion');}
                      }
                    })} style={{borderColor:'#ea4335',color:'#ea4335',fontSize:11}}>Déconnecter</button>}
              </div>
            </div>
          </div>

          {/* ÉTAT DE SANTÉ */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">État du système</span>
              <button className="btn btn-outline btn-sm" onClick={fetchHealth} disabled={loadingHealth} style={{fontSize:11}}>
                {loadingHealth?'...':'⟳ Actualiser'}
              </button>
            </div>
            {!health
              ?<p className="text-muted text-sm">Chargement...</p>
              :<div style={{display:'flex',flexDirection:'column',gap:8}}>
                {[
                  {label:'Backend',value:`${health.checks.backend.status === 'ok' ? '✅' : '❌'} En ligne`,detail:`Uptime: ${Math.floor(health.checks.backend.uptime / 60)}min · ${health.checks.backend.responseTime}ms`},
                  {label:'Base de données',value:health.checks.database.status === 'ok' ? '✅ Connectée' : '❌ Erreur',detail:`${health.checks.database.responseTime}ms`},
                  {label:'SMTP',value:health.checks.smtp.configured ? '✅ Configuré' : '⚠️ Non configuré'},
                ].map(item => (
                  <div key={item.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                    <div>
                      <span style={{fontWeight:500}}>{item.label}</span>
                      {item.detail&&<span className="text-muted" style={{marginLeft:8,fontSize:11}}>{item.detail}</span>}
                    </div>
                    <span>{item.value}</span>
                  </div>
                ))}
                <div style={{textAlign:'right',fontSize:10,color:'var(--text-muted)',marginTop:4}}>
                  {new Date(health.timestamp).toLocaleString('fr-FR')}
                </div>
              </div>
            }
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
          </button>
          {success && <span style={{ color: '#28a745', fontSize: 14, fontWeight: 500 }}>Parametres mis a jour avec succes !</span>}
        </div>
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} autoClose={4000} />}
      </form>
      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          message={confirmDialog.message}
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
export default Settings;
