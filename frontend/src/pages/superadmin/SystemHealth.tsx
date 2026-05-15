import React, { useState, useEffect, useCallback, useRef } from 'react';
import { superadminAPI } from '../../services/api';

interface HealthCheck {
  status: string;
  message?: string;
  recoveryAction?: string;
  recoverySuccess?: boolean;
  disabled?: boolean;
  details?: Record<string, unknown>;
}

interface HealthData {
  checks: {
    backend: HealthCheck & { uptime: number; nodeVersion: string; environment: string; platform: string; memoryUsage: { heapUsed: number; heapTotal: number; rss: number }; responseTime: number };
    frontend: HealthCheck & { durationMs: number };
    database: HealthCheck & { responseTime: number; version: string };
    systemConfig: HealthCheck & { path: string; size: number };
    smtp: HealthCheck & { configured: boolean; host: string; fromName: string };
    googleCalendar: HealthCheck & { connectedDoctors: number; totalTokens: number; doctors: {id: string; email: string; name: string}[] };
  };
  timestamp: string;
}

interface AuditEntry {
  id: string;
  component: string;
  status: string;
  action: string;
  message: string;
  durationMs: number;
  createdAt: string;
}

const componentLabels: Record<string, string> = {
  backend: 'Backend',
  frontend: 'Frontend',
  database: 'Base de donnees',
  config: 'Configuration',
  smtp: 'SMTP',
  googleCalendar: 'Google Agenda',
};

const actionLabels: Record<string, string> = {
  CHECK_OK: 'Verification OK',
  RECONNECT: 'Reconnexion',
  RECONNECT_ECHEC: 'Reconnexion (echec)',
  RECREATE: 'Recreation',
  RECREATE_ECHEC: 'Recreation (echec)',
  DISABLE: 'Desactivation',
  ENABLE_OK: 'Activation reussie',
  ENABLE_ECHEC: 'Activation echouee',
  RECOVERY_OK: 'Reparation reussie',
  RECOVERY_FAIL: 'Reparation echouee',
};

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

const SystemHealth: React.FC = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [intervalInput, setIntervalInput] = useState('30');
  const [savingInterval, setSavingInterval] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [recovering, setRecovering] = useState<string | null>(null);
  const [lastToggleResult, setLastToggleResult] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditFilterComponent, setAuditFilterComponent] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [auditFilterDateFrom, setAuditFilterDateFrom] = useState('');
  const [auditFilterDateTo, setAuditFilterDateTo] = useState('');
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

  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      const params: any = { limit: 50, page };
      if (auditFilterComponent) params.component = auditFilterComponent;
      if (auditFilterAction) params.action = auditFilterAction;
      if (auditFilterDateFrom) params.dateFrom = auditFilterDateFrom;
      if (auditFilterDateTo) params.dateTo = auditFilterDateTo;
      const res = await superadminAPI.getHealthAuditLogs(params);
      const d = res.data.data;
      setAuditLogs(d.logs || []);
      setAuditTotalPages(d.totalPages || 1);
      setAuditPage(d.page || 1);
    } catch { /* ignore */ }
    finally { setAuditLoading(false); }
  }, [auditFilterComponent, auditFilterAction, auditFilterDateFrom, auditFilterDateTo]);

  useEffect(() => {
    fetchHealth();
    fetchAuditLogs(1);
    superadminAPI.getSettings().then(r => {
      const env = r.data.data?.env || {};
      const interval = parseInt(env.HEALTH_CHECK_INTERVAL) || 30;
      setRefreshInterval(interval);
      setIntervalInput(String(interval));
    }).catch(() => setRefreshInterval(30));
  }, [fetchHealth, fetchAuditLogs]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchHealth(false);
        fetchAuditLogs(auditPage);
      }, refreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchHealth, fetchAuditLogs]);

  const handleToggle = async (component: string, currentlyDisabled: boolean) => {
    setToggling(component);
    setLastToggleResult(null);
    try {
      const res = await superadminAPI.toggleHealthComponent(component, currentlyDisabled);
      const logs = res.data.data?.logs || [];
      setLastToggleResult(`${currentlyDisabled ? 'Activation' : 'Desactivation'} de ${component} effectuee`);
      await fetchHealth(false);
      await fetchAuditLogs(auditPage);
    } catch (err: any) {
      setLastToggleResult(`Erreur: ${err.response?.data?.error || 'Erreur'}`);
    } finally {
      setToggling(null);
    }
  };

  if (loading && !data) return <p>Chargement...</p>;
  if (error && !data) return <p style={{ color: '#ea4335' }}>{error}</p>;
  if (!data) return <p>Erreur de chargement</p>;

  const { checks, timestamp } = data;

  const hasRecovery = (check: any) => check.recoveryAction;

  const handleSaveInterval = async () => {
    const val = parseInt(intervalInput);
    if (!val || val < 5) { setError('Minimum 5 secondes'); return; }
    setSavingInterval(true);
    setError('');
    try {
      await superadminAPI.updateHealthInterval(val);
      setRefreshInterval(val);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSavingInterval(false);
    }
  };

  const handleRecover = async (component: string) => {
    setRecovering(component);
    try {
      await superadminAPI.recoverHealthComponent(component);
      fetchHealth(false);
    } catch { /* ignore */ }
    finally { setRecovering(null); }
  };

  const renderCard = (key: string, check: any, children: React.ReactNode) => {
    const isDisabled = check.disabled;
    return (
      <div className="card" style={{
        padding: 20,
        borderTop: `4px solid ${isDisabled ? '#999' : statusColor(check.status)}`,
        opacity: isDisabled ? 0.6 : 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{componentLabels[key] || key}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isDisabled ? (
              <span className="badge" style={{ background: '#eee', color: '#666', fontSize: 11 }}>Desactive</span>
            ) : (
              <span style={{ background: statusColor(check.status) + '20', color: statusColor(check.status), padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                {statusLabel(check.status)}
              </span>
            )}
            <button
              onClick={() => handleToggle(key, isDisabled === true)}
              disabled={toggling === key}
              style={{
                padding: '3px 10px', borderRadius: 4, border: '1px solid #ccc',
                fontSize: 11, cursor: 'pointer', background: '#fff',
                opacity: toggling === key ? 0.6 : 1,
              }}
            >
              {toggling === key ? '...' : isDisabled ? 'Activer' : 'Desactiver'}
            </button>
          </div>
        </div>
        {isDisabled && (
          <div style={{ padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12, background: '#f5f5f5', color: '#666' }}>
            {check.message || 'Composant desactive par l\'administrateur'}
          </div>
        )}
        {!isDisabled && check.message && check.status !== 'ok' && (
          <div style={{ padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12, background: statusColor(check.status) + '15', color: statusColor(check.status) }}>
            {check.message}
          </div>
        )}
        {children}
        {!isDisabled && hasRecovery(check) && (
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, fontSize: 12, background: check.recoverySuccess ? '#e8f5e9' : '#fef7f7', border: `1px solid ${check.recoverySuccess ? '#c8e6c9' : '#fed7d7'}` }}>
            <span style={{ fontWeight: 600 }}>Reparation :</span> {check.recoveryAction} — {check.recoverySuccess ? 'Reussi' : 'Echec'}
          </div>
        )}
        {!isDisabled && check.status !== 'ok' && (
          <button onClick={() => handleRecover(key)} disabled={recovering === key}
            style={{ marginTop: 12, padding: '6px 14px', borderRadius: 4, border: '1px solid #e67e22', background: '#fff', color: '#e67e22', fontSize: 12, cursor: 'pointer', fontWeight: 500, opacity: recovering === key ? 0.6 : 1 }}>
            {recovering === key ? 'Reparation...' : 'Reparer'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>Sante du systeme</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#999' }}>
            Derniere verification : {new Date(timestamp).toLocaleString('fr-FR')}
          </span>
          {refreshInterval && (
            <span className="badge badge-info" style={{ fontSize: 11 }}>
              Auto: {refreshInterval}s
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="number" min="5" max="3600" value={intervalInput}
              onChange={e => setIntervalInput(e.target.value)}
              style={{ width: 60, padding: '4px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 12, textAlign: 'center' }}
            />
            <button onClick={handleSaveInterval} disabled={savingInterval} style={{
              background: '#34a853', color: '#fff', border: 'none', padding: '4px 10px',
              borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 500,
              opacity: savingInterval ? 0.6 : 1, whiteSpace: 'nowrap',
            }}>
              {savingInterval ? '...' : 'Appliquer'}
            </button>
          </div>
          <span style={{ fontSize: 11, color: '#999' }}>secondes</span>
          <button onClick={() => { fetchHealth(); fetchAuditLogs(auditPage); }} disabled={loading} style={{
            background: '#1a73e8', color: '#fff', border: 'none', padding: '8px 16px',
            borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Verification...' : 'Rafraichir'}
          </button>
        </div>
      </div>

      {lastToggleResult && (
        <div className="card" style={{ padding: 12, marginBottom: 16, borderLeft: '4px solid #34a853', background: '#f1f8e9', fontSize: 13 }}>
          {lastToggleResult}
        </div>
      )}

      {error && <div className="card" style={{ padding: 16, marginBottom: 16, borderLeft: '4px solid #ea4335', background: '#fef7f7' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>

        {/* Backend */}
        {renderCard('backend', checks.backend, (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Uptime</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{formatUptime(checks.backend.uptime)}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Node.js</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.nodeVersion}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Environnement</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.environment}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Plateforme</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.platform}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Reponse</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.responseTime} ms</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Memoire (RSS)</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.backend.memoryUsage.rss} Mo</td></tr>
            </tbody>
          </table>
        ))}
        
        {/* Frontend */}
        {renderCard('frontend', checks.frontend, (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Statut</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.frontend.status === 'ok' ? 'Repond' : 'Inaccessible'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Temps de reponse</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.frontend.durationMs} ms</td></tr>
            </tbody>
          </table>
        ))}

        {/* Base de donnees */}
        {renderCard('database', checks.database, (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Statut</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.database.status === 'ok' ? 'Connectee' : 'Deconnectee'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Version</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.database.version || '—'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Temps de reponse</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.database.responseTime} ms</td></tr>
            </tbody>
          </table>
        ))}

        {/* Configuration systeme */}
        {renderCard('config', checks.systemConfig, (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Fichier</td><td style={{ padding: '4px 8px', fontWeight: 500, fontSize: 11, wordBreak: 'break-all' }}>{checks.systemConfig.path}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Taille</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{formatSize(checks.systemConfig.size)}</td></tr>
            </tbody>
          </table>
        ))}

        {/* SMTP */}
        {renderCard('smtp', checks.smtp, (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Configure</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.smtp.configured ? 'Oui' : 'Non'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Hote</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.smtp.host || '—'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Nom d'expediteur</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.smtp.fromName}</td></tr>
            </tbody>
          </table>
        ))}

        {/* Google Calendar */}
        {checks.googleCalendar && renderCard('googleCalendar', checks.googleCalendar, (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Statut</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.googleCalendar.connectedDoctors > 0 ? 'Connecte' : 'Aucun medecin connecte'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#666' }}>Medecins connectes</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{checks.googleCalendar.connectedDoctors}</td></tr>
              {checks.googleCalendar.doctors?.map(d => (
                <tr key={d.id}><td style={{ padding: '4px 8px', color: '#666' }}>—</td><td style={{ padding: '4px 8px', fontWeight: 500 }}>{d.name} ({d.email})</td></tr>
              ))}
            </tbody>
          </table>
        ))}

      </div>

      {/* Barre de sante globale */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recapitulatif</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(checks).map(([key, check]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              background: check.disabled ? '#f5f5f5' : statusColor(check.status) + '12', borderRadius: 8, fontSize: 13,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: check.disabled ? '#999' : statusColor(check.status), display: 'inline-block' }} />
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{key}</span>
              <span style={{ color: check.disabled ? '#999' : statusColor(check.status) }}>
                {check.disabled ? '(Desactive)' : `(${statusLabel(check.status)})`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit de sante */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Audit de sante</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={auditFilterComponent} onChange={e => { setAuditFilterComponent(e.target.value); setAuditPage(1); }}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 12, background: '#fff' }}>
              <option value="">Tous les composants</option>
              {Object.entries(componentLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={auditFilterAction} onChange={e => { setAuditFilterAction(e.target.value); setAuditPage(1); }}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 12, background: '#fff' }}>
              <option value="">Toutes les actions</option>
              {Object.entries(actionLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input type="datetime-local" value={auditFilterDateFrom} onChange={e => { setAuditFilterDateFrom(e.target.value); setAuditPage(1); }}
              style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 11, width: 170 }} />
            <span style={{ fontSize: 11, color: '#999' }}>à</span>
            <input type="datetime-local" value={auditFilterDateTo} onChange={e => { setAuditFilterDateTo(e.target.value); setAuditPage(1); }}
              style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 11, width: 170 }} />
          </div>
        </div>
        {auditLoading ? (
          <p style={{ fontSize: 13, color: '#999' }}>Chargement...</p>
        ) : auditLogs.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>Aucune entree d audit trouvee.</p>
        ) : (
          <div>
            <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Composant</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Action</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Message</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#555' }}>Duree</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#666' }}>
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontWeight: 500 }}>{componentLabels[log.component] || log.component}</span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span className="badge" style={{
                          background: log.status === 'error' || log.action === 'DISABLE' ? '#fef7f7' : '#e8f5e9',
                          color: log.status === 'error' || log.action === 'DISABLE' ? '#c53030' : '#2e7d32',
                          border: `1px solid ${log.status === 'error' || log.action === 'DISABLE' ? '#fed7d7' : '#c8e6c9'}`,
                          fontSize: 10,
                        }}>
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#555', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.message}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#666', whiteSpace: 'nowrap' }}>
                        {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {auditTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <button onClick={() => fetchAuditLogs(1)} disabled={auditPage <= 1}
                  style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 12, cursor: 'pointer', background: '#fff' }}>&lt;&lt;</button>
                <button onClick={() => fetchAuditLogs(auditPage - 1)} disabled={auditPage <= 1}
                  style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 12, cursor: 'pointer', background: '#fff' }}>&lt;</button>
                <span style={{ fontSize: 12, color: '#666' }}>Page {auditPage} / {auditTotalPages}</span>
                <button onClick={() => fetchAuditLogs(auditPage + 1)} disabled={auditPage >= auditTotalPages}
                  style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 12, cursor: 'pointer', background: '#fff' }}>&gt;</button>
                <button onClick={() => fetchAuditLogs(auditTotalPages)} disabled={auditPage >= auditTotalPages}
                  style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 12, cursor: 'pointer', background: '#fff' }}>&gt;&gt;</button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default SystemHealth;
