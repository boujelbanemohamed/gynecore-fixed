filepath = 'frontend/src/pages/secretary/Calendar.tsx'
with open(filepath, 'r') as f:
    lines = f.readlines()

# La ligne avec apts.length > 3 est la ligne 101 (index 100)
# On insere le badge juste apres
badge = '              {(() => { const ua = getDayUnavail(d); return ua.length > 0 ? <div style={{ fontSize: 10, padding: \'1px 4px\', margin: \'1px 0\', backgroundColor: \'#dc3545\', color: \'#fff\', borderRadius: 3, textAlign: \'center\' }}>{ua.length} indisp.</div> : null; })()}\n'

lines.insert(101, badge)

with open(filepath, 'w') as f:
    f.writelines(lines)
print('Badge insere a la ligne 102')
