import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI } from '../../services/api';

const IMG_BASE = 'http://localhost:4000';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    specialization: '', licenseNumber: '', rppsNumber: '',
    clinicName: '', address: '', city: '', postalCode: '', country: 'France',
    logo: '',
  });

  useEffect(() => {
    doctorAPI.getProfile().then(r => {
      const p = r.data.data;
      setForm({
        firstName: p.firstName || '', lastName: p.lastName || '', phone: p.phone || '', email: p.email || '',
        specialization: p.specialization || '', licenseNumber: p.licenseNumber || '', rppsNumber: p.rppsNumber || '',
        clinicName: p.clinicName || '', address: p.address || '', city: p.city || '', postalCode: p.postalCode || '',
        country: p.country || 'France', logo: p.logo || '',
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
        firstName: form.firstName, lastName: form.lastName, phone: form.phone,
        specialization: form.specialization, licenseNumber: form.licenseNumber,
        rppsNumber: form.rppsNumber, clinicName: form.clinicName,
        address: form.address, city: form.city, postalCode: form.postalCode,
        country: form.country,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await doctorAPI.uploadLogo(file);
      update({ logo: res.data.data.logo });
    } catch { alert("Erreur lors de l'upload du logo"); }
    finally { setUploadingLogo(false); }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 20 }}>Parametres</h2>

      <form onSubmit={handleSave}>
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Informations personnelles</span></div>
            <div className="form-group">
              <label className="form-label">Prenom</label>
              <input className="form-control" value={form.firstName} onChange={e => update({ firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input className="form-control" value={form.lastName} onChange={e => update({ lastName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" value={form.email} readOnly style={{ background: '#f5f5f5' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Telephone</label>
              <input className="form-control" placeholder="01 23 45 67 89" value={form.phone} onChange={e => update({ phone: e.target.value })} />
            </div>
          </div>

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
                  <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => update({ logo: '' })}>
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
          {success && <span style={{ color: '#28a745', fontSize: 14, fontWeight: 500 }}>Profil mis a jour avec succes !</span>}
        </div>
      </form>
    </div>
  );
};
export default Settings;
