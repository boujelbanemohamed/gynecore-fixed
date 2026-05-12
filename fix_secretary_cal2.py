filepath = 'frontend/src/pages/secretary/Calendar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Ajouter helper getDayUnavail apres getDayAppts
old_helper = "const getDayApts = (d: Date) => appointments.filter(a => { const ad = new Date(a.startTime); return ad.toDateString() === d.toDateString(); });"
new_helper = """const getDayApts = (d: Date) => appointments.filter(a => { const ad = new Date(a.startTime); return ad.toDateString() === d.toDateString(); });
  const getDayUnavail = (d: Date) => unavailSlots.filter((u: any) => { const ud = new Date(u.startTime); return ud.toDateString() === d.toDateString(); });"""
content = content.replace(old_helper, new_helper)

# 2. Ajouter badge indisponibilite dans les cellules du mois (apres le +X RDV)
old_month = "{apts.length > 3 && <div style={{ fontSize: 10, color: '#666' }}>+{appts.length - 3}</div>}"
new_month = """{apts.length > 3 && <div style={{ fontSize: 10, color: '#666' }}>+{apts.length - 3}</div>}
              {(() => { const ua = getDayUnavail(d); return ua.length > 0 ? <div style={{ fontSize: 10, padding: '1px 4px', margin: '1px 0', backgroundColor: '#dc3545', color: '#fff', borderRadius: 3, textAlign: 'center' }}>{ua.length} indisp.</div> : null; })()}"""
content = content.replace(old_month, new_month)

# 3. Dans le panneau jour, fusionner RDV et indisponibilites tries par heure
old_day = """const dayAppts = selected ? getDayAppts(selected) : [];

  return ("""
new_day = """const dayAppts = selected ? getDayAppts(selected) : [];
  const dayUnavail = selected ? getDayUnavail(selected) : [];
  const dayItems = [...dayAppts.map((a: any) => ({...a, _type: 'apt'})), ...dayUnavail.map((u: any) => ({...u, _type: 'unavail'}))].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return ("""
content = content.replace(old_day, new_day)

# 4. Remplacer le rendu des RDV du jour par le rendu fusionne
old_render = """{!dayAppts.length ? <p style={{ color: '#999', fontSize: 13 }}>Aucun rendez-vous</p> : dayAppts.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((a: any) => (
            <div key={a.id} style={{ padding: '8px 10px', border: '1px solid #eee', borderRadius: 6, marginBottom: 8, cursor: 'pointer' }} onClick={() => openEdit(a)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtTime(a.startTime)} - {fmtTime(a.endTime)}</div>
              <div style={{ fontSize: 13 }}>{a.patient?.user?.firstName} {a.patient?.user?.lastName}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{typeLabels[a.type] || a.type}</div>
              <select value={a.status} onChange={e => { e.stopPropagation(); handleStatus(a.id, e.target.value); }} onClick={e => e.stopPropagation()} style={{ marginTop: 4, fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '1px solid #ddd' }}>
                {statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            </div>
          ))}"""
new_render = """{!dayItems.length ? <p style={{ color: '#999', fontSize: 13 }}>Aucun rendez-vous ni indisponibilite</p> : dayItems.map((item: any) => item._type === 'unavail' ? (
            <div key={item.id} style={{ padding: '8px 10px', border: '1px solid #f5c6cb', borderRadius: 6, marginBottom: 8, backgroundColor: '#f8d7da' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#dc3545' }}>{fmtTime(item.startTime)} - {fmtTime(item.endTime)}</div>
              <div style={{ fontSize: 13, color: '#721c24' }}>Indisponible</div>
              {item.reason && <div style={{ fontSize: 12, color: '#999' }}>{item.reason}</div>}
            </div>
          ) : (
            <div key={item.id} style={{ padding: '8px 10px', border: '1px solid #eee', borderRadius: 6, marginBottom: 8, cursor: 'pointer' }} onClick={() => openEdit(item)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtTime(item.startTime)} - {fmtTime(item.endTime)}</div>
              <div style={{ fontSize: 13 }}>{item.patient?.user?.firstName} {item.patient?.user?.lastName}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{typeLabels[item.type] || item.type}</div>
              <select value={item.status} onChange={e => { e.stopPropagation(); handleStatus(item.id, e.target.value); }} onClick={e => e.stopPropagation()} style={{ marginTop: 4, fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '1px solid #ddd' }}>
                {statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            </div>
          ))}"""
content = content.replace(old_render, new_render)

with open(filepath, 'w') as f:
    f.write(content)
print('Done')
