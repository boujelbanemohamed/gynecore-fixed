import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      textAlign: 'center',
      padding: 40,
    }}>
      <div style={{
        fontSize: 80,
        fontWeight: 700,
        color: 'var(--primary)',
        lineHeight: 1,
        marginBottom: 8,
      }}>404</div>
      <div style={{
        fontSize: 18,
        color: 'var(--text-secondary)',
        marginBottom: 24,
      }}>Page introuvable</div>
      <p style={{
        fontSize: 14,
        color: 'var(--text-muted)',
        maxWidth: 400,
        marginBottom: 32,
        lineHeight: 1.6,
      }}>
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/login')}>
        Retour à l'accueil
      </button>
    </div>
  );
};

export default NotFound;
