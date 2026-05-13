import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';

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

const Consultations: React.FC = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, type, startDate, endDate]);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  const resetFilters = () => {
    setSearch('');
    setType('');
    setStartDate('');
    setEndDate('');
  };

  const activeFilterCount = [search, type, startDate, endDate].filter(Boolean).length;

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
    border: '1px solid #e9ecef',
  };

  const inputStyle: React.CSSProperties = {
    padding: '7px 12px',
    borderRadius: 6,
    border: '1px solid #dee2e6',
    fontSize: 13,
    outline: 'none',
    backgroundColor: '#fff',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    minWidth: 160,
  };

  const buttonStyle = (variant: 'primary' | 'secondary') => ({
    padding: '7px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: variant === 'primary' ? '1px solid #27ae60' : '1px solid #dee2e6',
    backgroundColor: variant === 'primary' ? '#27ae60' : '#fff',
    color: variant === 'primary' ? '#fff' : '#495057',
  });

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
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            ...buttonStyle('secondary'),
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filtres
          {activeFilterCount > 0 && (
            <span style={{
              backgroundColor: '#27ae60',
              color: '#fff',
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
            }}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div style={filterBarStyle}>
          {/* Search */}
          <input
            type="text"
            placeholder="Rechercher (nom, diagnostic, motif)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />

          {/* Type filter */}
          <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6c757d', whiteSpace: 'nowrap' }}>Du</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={inputStyle}
            />
            <span style={{ fontSize: 12, color: '#6c757d' }}>au</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Reset button */}
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} style={{
              ...buttonStyle('secondary'),
              color: '#e74c3c',
              borderColor: '#e74c3c',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Reinitialiser
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div className="loading-screen"><div className="spinner"/></div>
        ) : !consultations.length ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Aucune consultation{activeFilterCount > 0 ? ' avec ces filtres' : ''}</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} style={{ ...buttonStyle('secondary'), marginTop: 8 }}>Reinitialiser les filtres</button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patiente</th>
                <th>Type</th>
                <th>Motif</th>
                <th>Diagnostic</th>
                <th>Traitement</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c: any) => {
                const u = c.patient?.user;
                return (
                  <tr key={c.id} onClick={() => navigate(`/patients/${c.patient?.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                    <td style={{ fontWeight: 500 }}>{u?.firstName} {u?.lastName}</td>
                    <td><span className="badge badge-info">{typeLabels[c.type] || c.type}</span></td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.chiefComplaint || '—'}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.diagnosis || '—'}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.treatment || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default Consultations;
