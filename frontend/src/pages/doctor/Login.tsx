import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DoctorLogin: React.FC = () => {
  const { loginDoctor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await loginDoctor(email, password); }
    catch (err: any) { setError(err.response?.data?.error || 'Erreur de connexion'); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>Gyne<span>Care</span></h1>
        <p>Système de gestion clinique gynécologique — sécurisé, rapide, efficace.</p>
        <div className="login-features">
          {[['⊞','Tableau de bord'],['📋','Dossiers médicaux'],['💊','Ordonnances'],['📅','Planning']].map(([icon,text]) => (
            <div className="login-feature" key={text}><div className="login-feature-icon">{icon}</div>{text}</div>
          ))}
        </div>
      </div>
      <div className="login-right">
        <div className="login-form-box">
          <h2>Connexion médecin</h2>
          <p>Accédez à votre espace médical sécurisé</p>
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
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div className="login-divider">ou</div>
          <div className="login-switch">Vous êtes patient ? <Link to="/patient/login">Portail patient →</Link></div>
        </div>
      </div>
    </div>
  );
};
export default DoctorLogin;
