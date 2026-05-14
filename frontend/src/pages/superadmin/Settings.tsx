import React, { useState, useEffect } from 'react';
import { superadminAPI } from '../../services/api';

const SuperadminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superadminAPI.getSettings().then(r => setSettings(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Configuration système</h2>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Variables d'environnement</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {settings?.env && Object.entries(settings.env).map(([key, val]) => (
              <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 12px', fontWeight: 500, width: 200 }}>{key}</td>
                <td style={{ padding: '6px 12px', color: '#666' }}>{String(val || '-')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Base de données</h3>
        {settings?.db?.map((row: any, i: number) => (
          <div key={i} style={{ fontSize: 13, color: '#666' }}>{row.version}</div>
        ))}
      </div>
    </div>
  );
};

export default SuperadminSettings;
