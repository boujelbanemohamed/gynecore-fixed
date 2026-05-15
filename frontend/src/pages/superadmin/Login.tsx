import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperadminLogin: React.FC = () => {
  const { loginSuperadmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginSuperadmin(email, password);
      navigate('/superadmin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>Gyne<span>Care</span></h1>
        <p>Administration système — gestion des utilisateurs, établissements et paramètres.</p>
        <div className="login-features">
          {[['🛡️','Gestion des accès'],['🏥','Établissements'],['👥','Utilisateurs'],['⚙️','Configuration']].map(([icon,text]) => (
            <div className="login-feature" key={text}><div className="login-feature-icon">{icon}</div>{text}</div>
          ))}
        </div>
      </div>
      <div className="login-right">
        <div className="login-form-box">
          <h2>Accès SuperAdmin</h2>
          <p>Espace réservé aux administrateurs du système</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="admin@gynecare.fr" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input className="form-control" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div className="login-divider">ou</div>
          <div className="login-switch">Vous êtes médecin ? <Link to="/login">Espace médical →</Link> | Vous êtes patient ? <Link to="/patient/login">Portail patient →</Link> | Vous êtes secrétaire ? <Link to="/secretary/login">Portail secrétaire →</Link></div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminLogin;
