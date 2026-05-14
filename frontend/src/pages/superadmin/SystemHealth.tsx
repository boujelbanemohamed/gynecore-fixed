import React, { useState, useEffect, useCallback, useRef } from 'react';
import { superadminAPI } from '../../services/api';

interface HealthCheck {
  status: string;
  details?: Record<string, unknown>;
}

interface HealthData {
  checks: {
    backend: HealthCheck & { uptime: number; nodeVersion: string; environment: string; platform: string; memoryUsage: { heapUsed: number; heapTotal: number; rss: number }; responseTime: number };
    database: HealthCheck & { responseTime: number; version: string };
    systemConfig: HealthCheck & { path: string; size: number };
    smtp: HealthCheck & { configured: boolean; host: string; fromName: string };
  };
  timestamp: string;
}

const formatUptime = (s: number) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}j`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}min`);
  return parts.join(' ');
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const statusColor = (status: string) => {
  switch (status) {
    case 'ok': return '#34a853';
    case 'warning': return '#fbbc04';
    case 'error':
    case 'missing': return '#ea4335';
    default: return '#999';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'ok': return 'Fonctionnel';
    case 'warning': return 'Attention';
    case 'error': return 'Erreur';
    case 'missing': return 'Manquant';
    default: return 'Inconnu';
  }
};

const REFRESH_OPTIONS = [
  { value: 0, label: 'Désactivé' },
  { value: 10, label: '10s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 300, label: '5 min' },
];

const SystemHealth: React.FC = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const res = await superadminAPI.getHealth();
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de chargement');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => fetchHealth(false), refreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchHealth]);

  if (loading && !data) return <p>Chargement...</p>;
  if (error && !data) return <p style={{ color: '#ea4335' }}>{error}</p>;
  if (!data) return <p>Erreur de chargement</p>;

  const { checks, timestamp } = data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>Santé du système</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#999' }}>
            Dernière vérification : {new Date(timestamp).toLocaleString('fr-FR')}
          </span>
          <label style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
            Auto:
            <select value={refreshInterval} onChange={e => setRefreshInterval(Number(e.target.value))} style={{
              padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13, background: '#fff',
            }}>
              {REFRESH_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <button onClick={() => fetchHealth()} disabled={loading} style={{
            background: '#1a73e8', color: '#fff', border: 'none', padding: '8px 16px',
            borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Vérification...' : 'Rafraîchir'}
          </button>
        </div>
      </div>

      {error && <div className="card" style={{ padding: 16, marginBottom: 16, borderLeft: '4px solid #ea4335', background: '#fef7f7' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>

        {/* Backend */}
        <div className="card" style={{ padding: 20, borderTop: `4px solid ${statusColor(checks.backend.status)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>🖥️ Backend</h3>
            <span style={{ background: statusColor(checks.backend.status) + '20', color: statusColor(checks.backend.status), padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
              {statusLabel(checks.backend.status)}
            </span>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Uptime</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{formatUptime(checks.backend.uptime)}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Node.js</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.nodeVersion}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Environnement</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.environment}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Plateforme</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.platform}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Réponse</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.responseTime} ms</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Mémoire (RSS)</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.memoryUsage.rss} Mo</td></tr>
            </tbody>
          </table>
        </div>

        {/* Base de données */}
        <div className="card" style={{ padding: 20, borderTop: `4px solid ${statusColor(checks.database.status)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>🗄️ Base de données</h3>
            <span style={{ background: statusColor(checks.database.status) + '20', color: statusColor(checks.database.status), padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
              {statusLabel(checks.database.status)}
            </span>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Statut</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.database.status === 'ok' ? 'Connectée' : 'Déconnectée'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Version</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.database.version || '—'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Temps de réponse</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.database.responseTime} ms</td></tr>
            </tbody>
          </table>
        </div>

        {/* Configuration système */}
        <div className="card" style={{ padding: 20, borderTop: `4px solid ${statusColor(checks.systemConfig.status)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>⚙️ Configuration</h3>
            <span style={{ background: statusColor(checks.systemConfig.status) + '20', color: statusColor(checks.systemConfig.status), padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
              {statusLabel(checks.systemConfig.status)}
            </span>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Fichier</td><td style={{ padding: '4px 8px', fontWeight: 500, fontSize: 11, wordBreak: 'break-all' }}>{checks.systemConfig.path}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Taille</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{formatSize(checks.systemConfig.size)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* SMTP */}
        <div className="card" style={{ padding: 20, borderTop: `4px solid ${statusColor(checks.smtp.status)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>📧 SMTP</h3>
            <span style={{ background: statusColor(checks.smtp.status) + '20', color: statusColor(checks.smtp.status), padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
              {statusLabel(checks.smtp.status)}
            </span>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Configuré</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.smtp.configured ? 'Oui' : 'Non'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Hôte</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.smtp.host || '—'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Nom d'expéditeur</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.smtp.fromName}</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* Barre de santé globale */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Récapitulatif</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(checks).map(([key, check]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              background: statusColor(check.status) + '12', borderRadius: 8, fontSize: 13,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(check.status), display: 'inline-block' }} />
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{key}</span>
              <span style={{ color: statusColor(check.status) }}>({statusLabel(check.status)})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
