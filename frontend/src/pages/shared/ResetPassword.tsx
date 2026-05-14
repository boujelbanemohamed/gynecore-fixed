import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('Token manquant. Veuillez utiliser le lien envoyé par email.');
      setTokenValid(false);
      return;
    }
    axios.post(`${API_URL}/auth/verify-reset-token`, { token })
      .then(() => setTokenValid(true))
      .catch(() => {
        setError('Ce lien est invalide ou a expiré. Demandez un nouveau lien.');
        setTokenValid(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-left">
          <h1>Gyne<span>Care</span></h1>
          <p>Système de gestion clinique gynécologique</p>
        </div>
        <div className="login-right">
          <div className="login-form-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2>Mot de passe mis à jour !</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Votre mot de passe a été changé avec succès.<br />
              Vous pouvez maintenant vous connecter.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="login-page">
        <div className="login-left">
          <h1>Gyne<span>Care</span></h1>
          <p>Système de gestion clinique gynécologique</p>
        </div>
        <div className="login-right">
          <div className="login-form-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2>Lien invalide</h2>
            <p style={{ color: '#e53935', marginBottom: 24 }}>{error}</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>Gyne<span>Care</span></h1>
        <p>Système de gestion clinique gynécologique</p>
      </div>
      <div className="login-right">
        <div className="login-form-box">
          <h2>Nouveau mot de passe</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>
            Choisissez un mot de passe sécurisé (minimum 8 caractères).
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <input
                className="form-control"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
          <div className="login-divider">ou</div>
          <div className="login-switch">
            <Link to="/login">← Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
