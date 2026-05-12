filepath = 'frontend/src/pages/secretary/Calendar.tsx'
with open(filepath, 'r') as f:
    lines = f.readlines()

# Trouver la ligne inseree (contient getDayUnavail(d))
for i, line in enumerate(lines):
    if 'getDayUnavail(d)' in line:
        # La supprimer
        del lines[i]
        print('Ligne badge supprimee (index', i, ')')
        # Inserer avant le </div> de la cellule (2 lignes avant)
        # Trouver le </div> qui ferme la cellule apres apts.length > 3
        for j in range(i-1, max(i-5, 0), -1):
            if '</div>' in lines[j] and 'apts.length' not in lines[j]:
                badge = '              {(() => { const ua = getDayUnavail(d); return ua.length > 0 ? <div style={{ fontSize: 10, padding: \'1px 4px\', margin: \'1px 0\', backgroundColor: \'#dc3545\', color: \'#fff\', borderRadius: 3, textAlign: \'center\' }}>{ua.length} indisp.</div> : null; })()}\n'
                lines.insert(j, badge)
                print('Badge insere a l\'index', j)
                break
        break

with open(filepath, 'w') as f:
    f.writelines(lines)
print('Termine')
