import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PatientLogin: React.FC = () => {
  const { loginPatient } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await loginPatient(email, password); }
    catch (err: any) { setError(err.response?.data?.error || 'Identifiants incorrects'); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>Gyne<span>Care</span></h1>
        <p>Accédez à votre espace santé personnel, sécurisé et confidentiel.</p>
        <div className="login-features">
          {[['📁','Mon dossier médical'],['💊','Mes ordonnances'],['📅','Mes rendez-vous'],['🔒','Données sécurisées']].map(([icon,text]) => (
            <div className="login-feature" key={text}><div className="login-feature-icon">{icon}</div>{text}</div>
          ))}
        </div>
      </div>
      <div className="login-right">
        <div className="login-form-box">
          <h2>Portail Patient</h2>
          <p>Connectez-vous pour accéder à votre espace santé</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Votre mot de passe" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{width:'100%',justifyContent:'center',padding:'11px'}}>
              {loading ? 'Connexion...' : 'Accéder à mon espace'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/forgot-password" style={{ color: '#e91e63', fontSize: 14, textDecoration: 'none' }}>Mot de passe oublié ?</Link>
          </div>
          <div className="login-divider">ou</div>
          <div className="login-switch">Vous êtes médecin ? <Link to="/login">Espace médical →</Link> | Vous êtes secrétaire ? <Link to="/secretary/login">Portail secrétaire →</Link> | <Link to="/superadmin/login">Administration →</Link></div>
        </div>
      </div>
    </div>
  );
};
export default PatientLogin;
