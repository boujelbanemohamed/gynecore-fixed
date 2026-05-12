filepath = 'frontend/src/pages/secretary/Calendar.tsx'
with open(filepath, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'apts.length - 3' in line:
        indent = '              '
        badge_line = indent + '{(() => { const ua = getDayUnavail(d); return ua.length > 0 ? <div style={{ fontSize: 10, padding: \'1px 4px\', margin: \'1px 0\', backgroundColor: \'#dc3545\', color: \'#fff\', borderRadius: 3, textAlign: \'center\' }}>{ua.length} indisp.</div> : null; })()}\n'
        new_lines.append(badge_line)
        print('Badge insere apres ligne', i+1)

with open(filepath, 'w') as f:
    f.writelines(new_lines)
print('Termine')
