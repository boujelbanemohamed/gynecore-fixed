import React, { useState, useEffect } from "react";
import { doctorAPI } from "../../services/api";

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const r = await doctorAPI.getAuditLogs({ page, limit: pageSize });
        setLogs(r.data.data.logs || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, [page]);
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 20 }}>Journal d'audit</h2>
      {loading ? <p>Chargement...</p> : logs.length === 0 ? (
        <div className="card"><div style={{ padding: 40, textAlign: "center", color: "#666" }}>Aucune action enregistrée.</div></div>
      ) : (
        <div className="card">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: 12, fontWeight: 600 }}>Date</th>
              <th style={{ padding: 12, fontWeight: 600 }}>Action</th>
              <th style={{ padding: 12, fontWeight: 600 }}>Ressource</th>
              <th style={{ padding: 12, fontWeight: 600 }}>Détails</th>
            </tr></thead>
            <tbody>{logs.map((log: any) => (
              <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 10, fontSize: 14 }}>{new Date(log.createdAt).toLocaleString("fr-FR")}</td>
                <td style={{ padding: 10 }}><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: log.action?.includes("CREATE") ? "#e8f5e9" : log.action?.includes("DELETE") ? "#ffebee" : "#e3f2fd", color: log.action?.includes("CREATE") ? "#2e7d32" : log.action?.includes("DELETE") ? "#c62828" : "#1565c0" }}>{log.action}</span></td>
                <td style={{ padding: 10, fontSize: 14 }}>{log.resource || "-"}</td>
                <td style={{ padding: 10, fontSize: 14, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{typeof log.details === "string" ? log.details : JSON.stringify(log.details)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {!loading && logs.length > 0 && <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
        <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
        <span style={{ padding: "6px 12px", fontSize: 14 }}>Page {page}</span>
        <button className="btn btn-outline btn-sm" disabled={logs.length < pageSize} onClick={() => setPage(p => p + 1)}>Suivant</button>
      </div>}
    </div>
  );
};

export default AuditLogs;
