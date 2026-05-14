import React, { useState, useEffect } from 'react';
import { superadminAPI } from '../../services/api';

const SuperadminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    superadminAPI.getAuditLogs({ page, limit: pageSize }).then(r => {
      setLogs(r.data.data.logs || []);
      setTotal(r.data.data.total || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Journal d'audit centralisé</h2>
      {loading ? <p>Chargement...</p> : logs.length === 0 ? (
        <div className="card"><div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Aucune action enregistrée.</div></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#f9f9f9' }}>
              <th style={{ padding: 10 }}>Date</th><th style={{ padding: 10 }}>Utilisateur</th><th style={{ padding: 10 }}>Rôle</th>
              <th style={{ padding: 10 }}>Action</th><th style={{ padding: 10 }}>Ressource</th><th style={{ padding: 10 }}>Détails</th>
            </tr></thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 10, fontSize: 12 }}>{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                  <td style={{ padding: 10 }}>{log.user?.email || log.userId}</td>
                  <td style={{ padding: 10 }}><span className="badge">{log.userRole}</span></td>
                  <td style={{ padding: 10 }}>
                    <span className={`badge ${log.action?.includes('CREATE') ? 'badge-success' : log.action?.includes('DELETE') ? 'badge-error' : 'badge-info'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>{log.resource || '-'}</td>
                  <td style={{ padding: 10, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && logs.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
          <span style={{ fontSize: 14 }}>Page {page} / {Math.ceil(total / pageSize)}</span>
          <button className="btn btn-outline btn-sm" disabled={logs.length < pageSize} onClick={() => setPage(p => p + 1)}>Suivant</button>
        </div>
      )}
    </div>
  );
};

export default SuperadminAuditLogs;
