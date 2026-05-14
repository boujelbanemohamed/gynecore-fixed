import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI } from '../../services/api';
import Alert from '../../components/shared/Alert';

const IMG_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string|null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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
  }, []);

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
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
          </button>
          {success && <span style={{ color: '#28a745', fontSize: 14, fontWeight: 500 }}>Parametres mis a jour avec succes !</span>}
        </div>
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} autoClose={4000} />}
      </form>

    </div>
  );
};
export default Settings;
