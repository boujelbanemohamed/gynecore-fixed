import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div className="login-brand">
          <div className="login-logo">🛡️</div>
          <h1>GyneCare</h1>
          <p className="login-subtitle">Administration</p>
        </div>
      </div>
      <div className="login-right">
        <div className="login-form-container">
          <h2>Accès SuperAdmin</h2>
          <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
            Espace réservé aux administrateurs du système
          </p>
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
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#999' }}>
            <a href="/login" style={{ color: '#666' }}>← Portail médecin</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminLogin;
