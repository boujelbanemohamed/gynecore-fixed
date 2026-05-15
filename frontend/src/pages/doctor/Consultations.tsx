import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const typeLabels: Record<string, string> = {
  FIRST_VISIT: 'Premiere visite', FOLLOW_UP: 'Suivi', EMERGENCY: 'Urgence',
  ANNUAL_CHECKUP: 'Bilan annuel', PRENATAL: 'Prenatal', POSTNATAL: 'Postnatal'
};

const typeOptions = [
  { value: '', label: 'Tous les types' },
  { value: 'FIRST_VISIT', label: 'Premiere visite' },
  { value: 'FOLLOW_UP', label: 'Suivi' },
  { value: 'EMERGENCY', label: 'Urgence' },
  { value: 'ANNUAL_CHECKUP', label: 'Bilan annuel' },
  { value: 'PRENATAL', label: 'Prenatal' },
  { value: 'POSTNATAL', label: 'Postnatal' },
];

const PER_PAGE = 15;

const Consultations: React.FC = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmCancel, setConfirmCancel] = useState<string|null>(null);

  const totalPages = Math.ceil(consultations.length / PER_PAGE);
  const paginatedData = consultations.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 200 };
      if (search) params.search = search;
      if (type) params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const r = await doctorAPI.getConsultations(params);
      setConsultations(r.data.data.consultations);
      setCurrentPage(1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, type, startDate, endDate]);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  const resetFilters = () => { setSearch(''); setType(''); setStartDate(''); setEndDate(''); };
  const activeFilterCount = [search, type, startDate, endDate].filter(Boolean).length;

  const handleCancel = async (id: string) => {
    try {
      await doctorAPI.cancelConsultation(id);
      setConsultations(prev => prev.filter(c => c.id !== id));
    } catch (e) { console.error(e); }
    setConfirmCancel(null);
  };

  const iS: React.CSSProperties = { padding: '7px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 13, outline: 'none', backgroundColor: '#fff' };
  const bS = (v: 'p' | 's') => ({ padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: v === 'p' ? '1px solid #27ae60' : '1px solid #dee2e6', backgroundColor: v === 'p' ? '#27ae60' : '#fff', color: v === 'p' ? '#fff' : '#495057' });

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Consultations</h2>
          <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>
            {consultations.length} consultation(s)
            {activeFilterCount > 0 && <span style={{ color: '#27ae60', marginLeft: 8 }}>({activeFilterCount} filtre(s) actif(s))</span>}
          </p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} style={{ ...bS('s'), display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filtres
          {activeFilterCount > 0 && <span style={{ backgroundColor: '#27ae60', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{activeFilterCount}</span>}
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 16, border: '1px solid #e9ecef' }}>
          <input type="text" placeholder="Rechercher (nom, diagnostic, motif)..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...iS, flex: 1, minWidth: 200 }} />
          <select value={type} onChange={e => setType(e.target.value)} style={{ ...iS, cursor: 'pointer', minWidth: 160 }}>
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6c757d' }}>Du</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={iS} />
            <span style={{ fontSize: 12, color: '#6c757d' }}>au</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={iS} />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} style={{ ...bS('s'), color: '#e74c3c', borderColor: '#e74c3c', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Reinitialiser
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? <div className="loading-screen"><div className="spinner"/></div> :
        !consultations.length ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Aucune consultation{activeFilterCount > 0 ? ' avec ces filtres' : ''}</p>
            {activeFilterCount > 0 && <button onClick={resetFilters} style={{ ...bS('s'), marginTop: 8 }}>Reinitialiser les filtres</button>}
          </div>
        ) : (
          <>
            <table>
              <thead><tr><th>Date</th><th>Patiente</th><th>Type</th><th>Motif</th><th>Diagnostic</th><th>Traitement</th><th>Actions</th></tr></thead>
              <tbody>
                {paginatedData.map((c: any) => {
                  const u = c.patient?.user;
                  return (
                    <tr key={c.id} onClick={() => navigate(`/patients/${c.patient?.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                      <td style={{ fontWeight: 500 }}>{u?.firstName} {u?.lastName}</td>
                      <td><span className="badge badge-info">{typeLabels[c.type] || c.type}</span></td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.chiefComplaint || '—'}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.diagnosis || '—'}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.treatment || '—'}</td>
                      <td>
                        <button onClick={e => { e.stopPropagation(); setConfirmCancel(c.id); }}
                          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e74c3c', background: '#fff', color: '#e74c3c', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Annuler
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                <span style={{ fontSize: 13, color: '#6c757d' }}>
                  {(currentPage - 1) * PER_PAGE + 1} - {Math.min(currentPage * PER_PAGE, consultations.length)} sur {consultations.length}
                </span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{ ...iS, padding: '5px 8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, fontSize: 12 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    style={{ ...iS, padding: '5px 8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  {getPageNumbers().map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`dots-${i}`} style={{ padding: '5px 6px', fontSize: 12, color: '#6c757d' }}>...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        style={{
                          ...iS,
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontWeight: p === currentPage ? 600 : 400,
                          backgroundColor: p === currentPage ? '#27ae60' : '#fff',
                          color: p === currentPage ? '#fff' : '#495057',
                          borderColor: p === currentPage ? '#27ae60' : '#dee2e6',
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                    style={{ ...iS, padding: '5px 8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{ ...iS, padding: '5px 8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, fontSize: 12 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {confirmCancel && (
        <ConfirmDialog
          isOpen={true}
          message="Annuler cette consultation ? Le rendez-vous lie sera egalement annule."
          onConfirm={() => handleCancel(confirmCancel)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </div>
  );
};
export default Consultations;
