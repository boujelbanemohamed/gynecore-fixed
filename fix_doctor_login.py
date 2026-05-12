filepath = 'frontend/src/pages/doctor/Login.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old = 'Vous êtes patient ? <Link to="/patient/login">Portail patient →</Link></div>'
new = 'Vous êtes patient ? <Link to="/patient/login">Portail patient →</Link> | Vous êtes secrétaire ? <Link to="/secretary/login">Portail secrétaire →</Link></div>'
content = content.replace(old, new)

with open(filepath, 'w') as f:
    f.write(content)
print('Done')
