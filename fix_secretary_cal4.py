filepath = 'frontend/src/pages/secretary/Calendar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Ajouter la definition de getDayUnavail AVANT getDayAppts (avec 2 p)
if 'const getDayUnavail' not in content:
    content = content.replace(
        'const getDayAppts = (d: Date) => appointments.filter',
        "const getDayUnavail = (d: Date) => unavailSlots.filter((u: any) => { const ud = new Date(u.startTime); return ud.toDateString() === d.toDateString(); });\n  const getDayAppts = (d: Date) => appointments.filter"
    )
    print('1. Helper getDayUnavail ajoute')
else:
    print('1. Deja present')

# 2. Ajouter le badge dans la vue mois
if 'getDayUnavail(d)' not in content:
    content = content.replace(
        '{apts.length > 3 && <div style={{ fontSize: 10, color: \'#666\' }}>+{apts.length - 3}</div>}',
        "{apts.length > 3 && <div style={{ fontSize: 10, color: '#666' }}>+{apts.length - 3}</div>}\n              {(() => { const ua = getDayUnavail(d); return ua.length > 0 ? <div style={{ fontSize: 10, padding: '1px 4px', margin: '1px 0', backgroundColor: '#dc3545', color: '#fff', borderRadius: 3, textAlign: 'center' }}>{ua.length} indisp.</div> : null; })()}"
    )
    print('2. Badge mois ajoute')
else:
    print('2. Deja present')

with open(filepath, 'w') as f:
    f.write(content)
print('\nTermine')
