#!/usr/bin/env python3
"""GyneCare - Add ForgotPassword, ResetPassword, AuditLogs pages"""
import os, sys

def read(path):
    with open(path, 'r') as f: return f.read()
def write(path, content):
    with open(path, 'w') as f: f.write(content)

# ── 1. Patch App.tsx ──
def patch_app():
    found = False
    for fp in ['../frontend/src/App.tsx', '../../frontend/src/App.tsx', 'frontend/src/App.tsx', 'src/App.tsx']:
        if os.path.exists(fp):
            found = True; break
    if not found:
        print('  -> App.tsx non trouve'); return False
    c = read(fp)
    if 'ForgotPassword' in c:
        print('  -> App.tsx deja patche'); return True

    # Add imports
    c = c.replace(
        "import SecretaryProfile from './pages/secretary/Profile';",
        "import SecretaryProfile from './pages/secretary/Profile';\nimport ForgotPassword from './pages/shared/ForgotPassword';\nimport ResetPassword from './pages/shared/ResetPassword';\nimport AuditLogs from './pages/doctor/AuditLogs';"
    )

    # Add public routes for forgot/reset password
    c = c.replace(
        """          <Route path="/secretary/login" element={<SecretaryLogin />} />
        </Route>""",
        """          <Route path="/secretary/login" element={<SecretaryLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>"""
    )

    # Add audit logs route inside doctor layout
    c = c.replace(
        """            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<DoctorProfile />} />""",
        """            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<DoctorProfile />} />
            <Route path="/audit-logs" element={<AuditLogs />} />"""
    )

    write(fp, c)
    print('  -> App.tsx patche (ForgotPassword, ResetPassword, AuditLogs)')
    return True

# ── 2. Add "Mot de passe oublie" link to all login pages ──
def patch_login_pages():
    pages = [
        ('../frontend/src/pages/doctor/Login.tsx', 'DOCTOR'),
        ('../frontend/src/pages/patient/Login.tsx', 'PATIENT'),
        ('../frontend/src/pages/secretary/Login.tsx', 'SECRETARY'),
    ]
    any_ok = False
    for rel, role in pages:
        # Try multiple paths
        fp = None
        for p in [rel, '../../frontend/' + rel.split('/', 1)[1], rel.split('/', 1)[1]]:
            if os.path.exists(p):
                fp = p; break
        if not fp:
            continue
        c = read(fp)
        if 'forgot-password' in c:
            print(f'  -> Login {role}: deja patche')
            any_ok = True
            continue
        # Add "Mot de passe oublie ?" link after the submit button
        c = c.replace(
            """            </button>
          </form>""",
            """            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/forgot-password" style={{ color: '#e91e63', fontSize: 14, textDecoration: 'none' }}>Mot de passe oublié ?</Link>
          </div>"""
        )
        write(fp, c)
        print(f'  -> Login {role}: lien "Mot de passe oublie" ajoute')
        any_ok = True
    return any_ok

# ── 3. Add API call for audit logs ──
def patch_api():
    found = False
    for fp in ['../frontend/src/services/api.ts', '../../frontend/src/services/api.ts', 'frontend/src/services/api.ts', 'src/services/api.ts']:
        if os.path.exists(fp):
            found = True; break
    if not found:
        print('  -> api.ts non trouve'); return False
    c = read(fp)
    if 'getAuditLogs' in c:
        print('  -> api.ts: audit logs deja present'); return True
    c = c.replace(
        "  getSecretaries: () => api.get('/doctor/secretaries'),",
        "  getSecretaries: () => api.get('/doctor/secretaries'),\n  getAuditLogs: (params?: any) => api.get('/doctor/audit-logs', { params }),"
    )
    write(fp, c)
    print('  -> api.ts: getAuditLogs ajoute')
    return True

# ── 4. Add Audit Logs to sidebar nav ──
def patch_sidebar():
    found = False
    for fp in ['../frontend/src/components/doctor/Layout.tsx', '../../frontend/src/components/doctor/Layout.tsx', 'frontend/src/components/doctor/Layout.tsx', 'src/components/doctor/Layout.tsx']:
        if os.path.exists(fp):
            found = True; break
    if not found:
        print('  -> Layout.tsx non trouve'); return False
    c = read(fp)
    if 'audit-logs' in c:
        print('  -> Layout.tsx: audit-logs deja present'); return True
    # Add nav item
    c = c.replace(
        """  { to: '/settings', icon: '⚙', label: 'Paramètres' },
];""",
        """  { to: '/settings', icon: '⚙', label: 'Paramètres' },
  { to: '/audit-logs', icon: '📊', label: "Journal d'audit" },
];"""
    )
    # Add page title
    c = c.replace(
        """  '/consultations': 'Consultations', '/calendar': 'Planning', '/settings': 'Paramètres',""",
        """  '/consultations': 'Consultations', '/calendar': 'Planning', '/settings': 'Paramètres',
  '/audit-logs': "Journal d'audit","""
    )
    write(fp, c)
    print("  -> Layout.tsx: 'Journal d'audit' ajoute au menu")
    return True

if __name__ == '__main__':
    print('============================================')
    print('  GYNECARE - Patch Extra Pages')
    print('============================================')
    ok = True
    for name, fn in [
        ('1. App.tsx routes', patch_app),
        ('2. Login pages (forgot link)', patch_login_pages),
        ('3. api.ts (audit logs)', patch_api),
        ('4. Sidebar (audit nav)', patch_sidebar),
    ]:
        print(f'\n[{name}]')
        if not fn(): ok = False
    print('\n' + ('OK' if ok else 'ECHEC'))
    sys.exit(0 if ok else 1)
