import React, { useEffect, useState } from 'react';
import { doctorAPI } from '../../services/api';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState('');
  const pageSize = 50;

  const fetchLogs = async (p: number, resource?: string) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: pageSize };
      if (resource) params.resource = resource;
      const r = await doctorAPI.getAuditLogs(params);
      setLogs(r.data.data.logs);
      setTotal(r.data.data.total);
    } catch (err) {
      console.error('Erreur chargement logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page, resourceFilter); }, [page, resourceFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const actionColors: Record<string, string> = {
    CREATE: '#43a047', UPDATE: '#1976d2', DELETE: '#e53935', LOGIN: '#ff9800', LOGOUT: '#9e9e9e',
  };
  const resourceLabels: Record<string, string> = {
    user: 'Utilisateur', patient: 'Patient', consultation: 'Consultation',
    appointment: 'Rendez-vous', prescription: 'Ordonnance', certificate: 'Certificat',
    document: 'Document', secretary: 'Secrétaire', profile: 'Profil',
    clinical_exam: 'Examen clinique', medical_letter: 'Lettre médicale',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Journal d'audit</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select className="form-control" style={{ width: 200, padding: '6px 10px' }}
            value={resourceFilter} onChange={e => { setResourceFilter(e.target.value); setPage(1); }}>
            <option value="">Toutes les ressources</option>
            {Object.entries(resourceLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <span className="text-muted" style={{ fontSize: 13 }}>{total} entrée(s)</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            Aucune entrée dans le journal d'audit.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Date & Heure</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Utilisateur</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Rôle</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Ressource</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#555', fontSize: 13 }}>
                      {new Date(log.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{log.userId?.substring(0, 8)}...</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                        background: log.userRole === 'DOCTOR' ? '#e3f2fd' : log.userRole === 'SECRETARY' ? '#f3e5f5' : '#e8f5e9',
                        color: log.userRole === 'DOCTOR' ? '#1565c0' : log.userRole === 'SECRETARY' ? '#7b1fa2' : '#2e7d32',
                      }}>
                        {log.userRole}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#fff',
                        background: actionColors[log.action] || '#757575',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>
                      {resourceLabels[log.resource] || log.resource}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#777', fontSize: 13, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}>Précédent</button>
          <span style={{ fontSize: 14 }}>Page {page} / {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}>Suivant</button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
