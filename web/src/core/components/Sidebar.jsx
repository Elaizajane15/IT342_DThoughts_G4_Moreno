import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Avatar from '@/core/components/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { authApi, filesApi, notificationsApi, oauthApi } from '@/core/api'

/* ── Warm Parchment Palette ──────────────────────────────────
   #FFF8EE  warm ivory      — sidebar background
   #F5ECD4  parchment       — card / widget surface
   #EDE0C4  deep parchment  — hover states
   #E8C97A  golden amber    — accent / badge bg
   #C9A84C  amber dark      — active nav / links
   #A67C28  amber deep      — hover accent
   #3D2600  espresso        — primary text
   #7A6040  warm brown      — muted text
   rgba(197,162,100,0.28)   — border
   ─────────────────────────────────────────────────────────── */

const C = {
  bg:        '#FFF8EE',
  surface:   '#F5ECD4',
  surfaceHi: '#EDE0C4',
  border:    'rgba(197,162,100,0.28)',
  borderHov: 'rgba(197,162,100,0.55)',
  amber:     '#E8C97A',
  amberDark: '#C9A84C',
  amberDeep: '#A67C28',
  ink:       '#3D2600',
  muted:     '#7A6040',
  mutedSoft: 'rgba(122,96,64,0.6)',
  white:     '#ffffff',
  rose:      '#c0392b',
  rosePale:  'rgba(192,57,43,0.07)',
};

const QUOTES = [
  { quoteText: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { quoteText: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau' },
  { quoteText: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { quoteText: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { quoteText: 'It always seems impossible until its done.', author: 'Nelson Mandela' },
  { quoteText: 'Your time is limited, so dont waste it living someone else life.', author: 'Steve Jobs' },
  { quoteText: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { quoteText: 'Act as if what you do makes a difference. It does.', author: 'William James' },
  { quoteText: 'Hardships often prepare ordinary people for an extraordinary destiny.', author: 'C. S. Lewis' },
  { quoteText: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
]

function pickQuote(excludeText) {
  if (!QUOTES.length) return null
  if (QUOTES.length === 1) return QUOTES[0]
  let next = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  for (let i = 0; i < 8 && next.quoteText === excludeText; i++) {
    next = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  }
  return next
}

export default function Sidebar({ notifCount }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, login, logout } = useAuth()
  const isGuest = !user

  const [unreadCount,     setUnreadCount]     = useState(0)
  const [quote,           setQuote]           = useState(() => pickQuote(null))
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [logoutOpen,      setLogoutOpen]      = useState(false)
  const [addAccountOpen,  setAddAccountOpen]  = useState(false)
  const [addForm,         setAddForm]         = useState({ email: '', password: '' })
  const [addError,        setAddError]        = useState('')
  const [addLoading,      setAddLoading]      = useState(false)
  const [addFocused,      setAddFocused]      = useState('')
  const menuRef = useRef(null)

  const isFeedActive         = location.pathname === '/feed'
  const isNotificationActive = location.pathname === '/notification'
  const isDraftsActive       = location.pathname === '/drafts'

  // Rotate quote every minute
  useEffect(() => {
    const id = setInterval(() => setQuote(prev => pickQuote(prev?.quoteText)), 60_000)
    return () => clearInterval(id)
  }, [])

  // Unread notifications
  useEffect(() => {
    if (typeof notifCount === 'number') return
    if (!user?.id) return
    let cancelled = false
    notificationsApi.unreadCount(user.id)
      .then(count => { if (!cancelled) setUnreadCount(Number(count) || 0) })
      .catch(()   => { if (!cancelled) setUnreadCount(0) })
    return () => { cancelled = true }
  }, [notifCount, user?.id, location.pathname, location.search])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onMD = e => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    const onKD = e => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onMD)
    document.addEventListener('keydown', onKD)
    return () => { document.removeEventListener('mousedown', onMD); document.removeEventListener('keydown', onKD) }
  }, [menuOpen])

  // ESC closes modals
  useEffect(() => {
    const onKD = e => { if (e.key === 'Escape') { setLogoutOpen(false); setAddAccountOpen(false) } }
    document.addEventListener('keydown', onKD)
    return () => document.removeEventListener('keydown', onKD)
  }, [])

  const handleAddAccount = () => {
    setMenuOpen(false); setAddError(''); setAddForm({ email: '', password: '' }); setAddAccountOpen(true)
  }

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Logout successful.', type: 'success' }))
    navigate('/login', { replace: true })
  }

  const handleLogoutPrompt = () => { setMenuOpen(false); setLogoutOpen(true) }

  const effectiveCount = typeof notifCount === 'number' ? notifCount : (user?.id ? unreadCount : 0)

  return (
    <aside style={S.sidebar}>
      <style>{CSS}</style>

      {/* ── Scroll area ── */}
      <div style={S.scrollArea}>

        {/* Brand */}
        <div style={S.brand}>
          <div style={S.brandBox}>
            <span style={{ fontSize:18, position:'relative', zIndex:1 }}>📓</span>
            <div style={S.brandShine} />
          </div>
          <div style={S.brandText}>
            Daily<span style={{ color:C.amberDark }}>Thoughts</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={S.nav}>
          <NavItem to="/feed" active={isFeedActive}>🏠 Feed</NavItem>

          {!isGuest && (
            <NavItem to="/create" active={location.pathname === '/create' || location.pathname === '/create-post'}>
              ✏️ New Thought
            </NavItem>
          )}
          {!isGuest && (
            <NavItem to="/drafts" active={isDraftsActive}>🗂️ Drafts</NavItem>
          )}

          <NavItem
            to="/notification"
            active={isNotificationActive}
            right={effectiveCount
              ? <span style={S.badge}>{effectiveCount}</span>
              : null}
          >
            🔔 Notifications
          </NavItem>

          {!isGuest && (
            <NavItem to="/profile" active={location.pathname === '/profile'}>
              👤 My Profile
            </NavItem>
          )}

          {isGuest && (
            <>
              <NavItem to="/login"    active={location.pathname === '/login'}>🔑 Login</NavItem>
              <NavItem to="/register" active={location.pathname === '/register'}>✍️ Register</NavItem>
            </>
          )}
        </nav>
      </div>

      {/* ── Bottom area ── */}
      <div style={S.bottomArea}>

        {/* Quote card */}
        {quote && (
          <div style={S.quoteCard}>
            <div style={S.quoteTopLine} />
            <div style={S.quoteLabel}>✦ Daily Quote</div>
            <p style={S.quoteText}>"{quote.quoteText}"</p>
            <p style={S.quoteAuthor}>— {quote.author}</p>
          </div>
        )}

        {/* Account card */}
        {!isGuest && (
          <div ref={menuRef} style={S.accountWrap}>
            <div style={S.accountCard} onClick={() => navigate('/profile')} className="dt-account-card">
              <div style={S.accountRow}>
                <Avatar
                  name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'}
                  src={filesApi.getUrl(user?.avatarUrl)}
                  size="sm"
                />
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={S.accountName}>{user?.firstName} {user?.lastName}</p>
                  <p style={S.accountEmail}>{user?.email}</p>
                </div>
                <button type="button" aria-label="Account menu"
                  onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
                  style={{ ...S.moreBtn, background: menuOpen ? C.surfaceHi : C.surface }}
                  className="dt-more-btn">
                  ⋯
                </button>
              </div>
            </div>

            {menuOpen && (
              <div style={S.menu}>
                <div style={S.menuArrow} />
                <button type="button" onClick={handleAddAccount} style={S.menuItem} className="dt-menu-item">
                  <span style={S.menuIcon}>➕</span> Add an existing account
                </button>
                <div style={S.menuDivider} />
                <button type="button" onClick={handleLogoutPrompt} style={{ ...S.menuItem, color:C.rose }} className="dt-menu-item">
                  <span style={S.menuIcon}>🚪</span> Log out @{String(user?.email || '').split('@')[0]}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════ LOGOUT MODAL ════ */}
      {logoutOpen && createPortal(
        <div style={S.overlay} onMouseDown={e => { if (e.target === e.currentTarget) setLogoutOpen(false) }}>
          <div role="dialog" aria-modal="true" style={S.modal}>
            <div style={S.modalLogoBox}>
              <span style={{ fontSize:24 }}>📓</span>
              <div style={S.modalLogoShine} />
            </div>
            <h3 style={S.modalTitle}>Log out of DailyThoughts?</h3>
            <p style={S.modalText}>
              You can always log back in at any time. To switch accounts, add an existing account from the menu.
            </p>
            <div style={S.modalActions}>
              <button type="button"
                onClick={async () => { setLogoutOpen(false); await handleLogout() }}
                style={S.btnDanger} className="dt-btn-danger">
                Log Out
              </button>
              <button type="button" onClick={() => setLogoutOpen(false)}
                style={S.btnCancel} className="dt-btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ════ ADD ACCOUNT MODAL ════ */}
      {addAccountOpen && createPortal(
        <div style={S.overlay} onMouseDown={e => { if (e.target === e.currentTarget) setAddAccountOpen(false) }}>
          <div role="dialog" aria-modal="true" style={S.modal}>
            {/* Close */}
            <button type="button" aria-label="Close" onClick={() => setAddAccountOpen(false)} style={S.closeBtn}>✕</button>

            {/* Logo */}
            <div style={S.modalLogoBox}>
              <span style={{ fontSize:24 }}>📓</span>
              <div style={S.modalLogoShine} />
            </div>
            <h3 style={S.modalTitle}>Sign in to DailyThoughts</h3>
            <p style={S.modalText}>Add another account to switch between them easily.</p>

            {/* Google */}
            <button type="button"
              onClick={() => { window.location.href = oauthApi.googleLoginUrl() }}
              style={S.googleBtn} className="dt-google-btn">
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div style={S.divider}>
              <div style={S.divLine} /><span style={S.divText}>or</span><div style={S.divLine} />
            </div>

            {/* Error */}
            {addError && (
              <div style={S.errorBox}>
                <span>⚠</span><span style={{ flex:1 }}>{addError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={async e => {
              e.preventDefault()
              if (addLoading) return
              setAddError('')
              const email    = String(addForm.email || '').trim()
              const password = String(addForm.password || '')
              if (!email || !password) { setAddError('Please enter your email and password.'); return }
              setAddLoading(true)
              try {
                const res = await authApi.login({ email, password })
                const prevToken    = localStorage.getItem('token')
                const prevUserRaw  = localStorage.getItem('user')
                let prevUser = null
                try { prevUser = prevUserRaw ? JSON.parse(prevUserRaw) : null } catch { prevUser = null }
                const storedRaw = localStorage.getItem('dt_accounts')
                let stored = []
                try { stored = storedRaw ? JSON.parse(storedRaw) : [] } catch { stored = [] }
                if (!Array.isArray(stored)) stored = []
                if (prevUser?.email && prevToken) {
                  const exists = stored.some(a => String(a?.user?.email||'').toLowerCase() === String(prevUser.email).toLowerCase())
                  if (!exists) stored.unshift({ token: prevToken, user: prevUser })
                }
                const nextUser  = res?.user || null
                const nextToken = res?.token || null
                if (nextUser?.email && nextToken) {
                  stored = stored.filter(a => String(a?.user?.email||'').toLowerCase() !== String(nextUser.email).toLowerCase())
                  stored.unshift({ token: nextToken, user: nextUser })
                }
                localStorage.setItem('dt_accounts', JSON.stringify(stored.slice(0, 5)))
                login(res.token, res.user)
                sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Account added.', type: 'success' }))
                setAddAccountOpen(false)
                navigate('/feed')
              } catch (err) {
                setAddError(err?.message || 'Failed to sign in.')
              } finally { setAddLoading(false) }
            }}>
              {[['email','email','Email address','you@example.com'],['password','password','Password','Enter your password']].map(([name,type,lbl,ph]) => (
                <div key={name} style={{ marginBottom:14 }}>
                  <label style={{ ...S.fieldLabel, color: addFocused===name ? C.amberDeep : C.muted }}>{lbl}</label>
                  <div style={{ position:'relative' }}>
                    <input name={name} type={type} autoComplete={type==='email'?'email':'current-password'}
                      value={addForm[name]} placeholder={ph}
                      onChange={e => setAddForm(f => ({ ...f, [name]: e.target.value }))}
                      onFocus={() => setAddFocused(name)} onBlur={() => setAddFocused('')}
                      style={{
                        ...S.addInput,
                        borderColor: addFocused===name ? C.amberDark : addForm[name] ? 'rgba(197,162,100,0.5)' : C.border,
                        boxShadow:   addFocused===name ? '0 0 0 3px rgba(200,168,76,0.1)' : 'none',
                        background:  addFocused===name ? C.white : C.bg,
                      }}
                    />
                    <div style={{ position:'absolute', bottom:0, left:0, height:2, borderRadius:'0 0 12px 12px',
                      width: addFocused===name ? '100%' : '0%',
                      background:`linear-gradient(90deg,${C.amber},${C.amberDark})`,
                      transition:'width 0.35s ease' }} />
                  </div>
                </div>
              ))}

              <button type="submit" disabled={addLoading} className="dt-btn-primary"
                style={{ ...S.btnPrimary, opacity: addLoading ? 0.75 : 1 }}>
                {addLoading ? <><span style={S.spinner} />Signing in…</> : <><span>Sign In</span><span>→</span></>}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </aside>
  )
}

/* ─── NavItem ─────────────────────────────────────────────── */
function NavItem({ to, active, children, right }) {
  return (
    <Link to={to} className={`dt-nav-item${active ? ' active' : ''}`} style={{
      ...S.navItem,
      background: active ? C.surface : 'transparent',
      color:      active ? C.ink     : C.muted,
      borderColor: active ? 'rgba(197,162,100,0.4)' : 'transparent',
      boxShadow:  active ? '0 1px 8px rgba(61,38,0,0.07)' : 'none',
      fontWeight: active ? 700 : 400,
    }}>
      <span style={S.navLabel}>{children}</span>
      {right}
    </Link>
  )
}

/* ─── Google icon ─────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

/* ─── Styles ──────────────────────────────────────────────── */
const S = {
  sidebar: {
    width: 240,
    flexShrink: 0,
    padding: '24px 14px',
    position: 'sticky',
    top: 24,
    height: 'calc(100vh - 48px)',
    overflow: 'hidden',
    borderRight: `1px solid rgba(197,162,100,0.22)`,
    background: C.bg,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Lora','Georgia',serif",
  },
  scrollArea: { overflowY: 'auto', paddingBottom: 12, flex: 1, minHeight: 0 },
  bottomArea: { paddingTop: 12, borderTop:`1px solid rgba(197,162,100,0.22)`, position:'relative', marginTop:'auto' },

  /* Brand */
  brand: { display:'flex', alignItems:'center', gap:10, marginBottom:20 },
  brandBox: {
    width:38, height:38, borderRadius:11, flexShrink:0,
    background:`linear-gradient(135deg,${C.amber},${C.amberDark})`,
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:`0 4px 14px rgba(200,160,60,0.35)`,
    position:'relative', overflow:'hidden',
  },
  brandShine: { position:'absolute', inset:0, background:'radial-gradient(circle at 28% 28%,rgba(255,255,255,0.3),transparent 55%)' },
  brandText: { fontFamily:"'Playfair Display','Georgia',serif", fontSize:16, fontWeight:700, color:C.ink },

  /* Nav */
  nav: { display:'grid', gap:6 },
  navItem: {
    display:'flex', alignItems:'center', gap:10,
    padding:'10px 12px', borderRadius:12,
    textDecoration:'none', border:'1px solid',
    fontFamily:"'Lora','Georgia',serif", fontSize:13,
    transition:'all 0.2s', width:'100%',
  },
  navLabel: { flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  badge: {
    background:`linear-gradient(135deg,${C.amber},${C.amberDark})`,
    color: C.ink, borderRadius:50,
    padding:'2px 8px',
    fontFamily:"'DM Mono',monospace",
    fontSize:10, fontWeight:700, lineHeight:1.4,
    boxShadow:`0 1px 6px rgba(200,160,60,0.3)`,
  },

  /* Quote card */
  quoteCard: {
    background:`linear-gradient(145deg,${C.surface},#f0e4c8)`,
    borderRadius:14, padding:'14px 16px', marginBottom:12,
    border:`1px solid rgba(197,162,100,0.3)`,
    boxShadow:'0 2px 12px rgba(61,38,0,0.06)',
    position:'relative', overflow:'hidden',
  },
  quoteTopLine: {
    position:'absolute', top:0, left:0, right:0, height:2,
    background:`linear-gradient(90deg,transparent,${C.amber},transparent)`,
  },
  quoteLabel: { fontFamily:"'DM Mono',monospace", fontSize:9, color:C.amberDark, letterSpacing:2.5, marginBottom:8, textTransform:'uppercase' },
  quoteText:  { fontFamily:"'Playfair Display','Georgia',serif", fontSize:12, color:C.ink, fontStyle:'italic', lineHeight:1.55, margin:0, marginBottom:8 },
  quoteAuthor:{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.muted },

  /* Account card */
  accountWrap: { position:'relative' },
  accountCard: {
    background: C.white,
    border:`1px solid rgba(197,162,100,0.28)`,
    borderRadius:14, padding:'12px',
    boxShadow:'0 2px 10px rgba(61,38,0,0.05)',
    cursor:'pointer', marginBottom:0,
    transition:'all 0.2s',
  },
  accountRow: { display:'flex', alignItems:'center', gap:10 },
  accountName: { fontFamily:"'Playfair Display','Georgia',serif", fontSize:13, fontWeight:700, color:C.ink, marginBottom:1 },
  accountEmail:{ fontFamily:"'DM Mono',monospace", fontSize:10.5, color:C.muted, wordBreak:'break-word' },
  moreBtn: {
    width:32, height:32, borderRadius:50, flexShrink:0,
    border:`1px solid rgba(197,162,100,0.3)`,
    background: C.surface,
    fontSize:18, cursor:'pointer', color:C.muted,
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'all 0.2s',
  },

  /* Dropdown menu */
  menu: {
    position:'absolute', left:0, right:0, bottom:52,
    background: C.white,
    border:`1px solid rgba(197,162,100,0.3)`,
    borderRadius:14, boxShadow:'0 8px 32px rgba(61,38,0,0.12)',
    padding:'6px', zIndex:50,
  },
  menuArrow: {
    position:'absolute', bottom:-6, left:24,
    width:12, height:12, background:C.white,
    border:`1px solid rgba(197,162,100,0.3)`,
    transform:'rotate(45deg)',
    borderTop:'none', borderLeft:'none',
  },
  menuItem: {
    width:'100%', background:'transparent', border:'none',
    cursor:'pointer', textAlign:'left', padding:'9px 12px',
    borderRadius:10, fontFamily:"'Lora','Georgia',serif",
    fontSize:13, color:C.ink, display:'flex', alignItems:'center', gap:10,
    transition:'background 0.15s',
  },
  menuIcon: { fontSize:14, flexShrink:0, opacity:0.7 },
  menuDivider: { height:1, background:`rgba(197,162,100,0.2)`, margin:'4px 0' },

  /* Overlay */
  overlay: {
    position:'fixed', inset:0,
    background:'rgba(61,38,0,0.3)',
    display:'grid', placeItems:'center',
    zIndex:200, padding:18,
    backdropFilter:'blur(3px)',
  },

  /* Modal */
  modal: {
    width:'100%', maxWidth:440,
    background: C.white,
    borderRadius:22,
    padding:'32px 28px 28px',
    border:`1px solid rgba(197,162,100,0.25)`,
    boxShadow:'0 24px 80px rgba(61,38,0,0.18)',
    position:'relative', textAlign:'center',
    overflow:'hidden',
  },
  modalLogoBox: {
    width:56, height:56, borderRadius:16, margin:'0 auto 16px',
    background:`linear-gradient(135deg,${C.amber},${C.amberDark})`,
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:`0 6px 20px rgba(200,160,60,0.35)`,
    position:'relative', overflow:'hidden',
  },
  modalLogoShine: { position:'absolute', inset:0, background:'radial-gradient(circle at 28% 28%,rgba(255,255,255,0.3),transparent 55%)' },
  modalTitle: { fontFamily:"'Playfair Display','Georgia',serif", fontSize:20, fontWeight:700, color:C.ink, marginBottom:10 },
  modalText:  { fontFamily:"'Lora','Georgia',serif", fontSize:13, lineHeight:1.65, color:C.mutedSoft, marginBottom:22 },
  modalActions: { display:'grid', gap:10 },

  /* Buttons */
  btnDanger: {
    width:'100%', padding:'12px 14px', borderRadius:50, border:'none',
    background:C.ink, color:C.surface,
    fontFamily:"'Lora','Georgia',serif", fontSize:14, fontWeight:700,
    cursor:'pointer', boxShadow:`0 3px 12px rgba(61,38,0,0.2)`,
    transition:'all 0.2s',
  },
  btnCancel: {
    width:'100%', padding:'12px 14px', borderRadius:50,
    border:`1.5px solid rgba(197,162,100,0.35)`,
    background:'transparent', color:C.muted,
    fontFamily:"'Lora','Georgia',serif", fontSize:14, fontWeight:600,
    cursor:'pointer', transition:'all 0.2s',
  },
  closeBtn: {
    position:'absolute', top:14, right:14,
    width:32, height:32, borderRadius:50,
    border:`1.5px solid rgba(197,162,100,0.3)`,
    background:C.surface, cursor:'pointer',
    fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700,
    display:'flex', alignItems:'center', justifyContent:'center',
    color:C.muted, transition:'all 0.2s',
  },
  googleBtn: {
    width:'100%', padding:'12px 14px', borderRadius:50,
    border:`1.5px solid rgba(197,162,100,0.3)`,
    background: C.bg, color:C.ink,
    fontFamily:"'Lora','Georgia',serif", fontSize:13, fontWeight:700,
    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    marginBottom:0, transition:'all 0.2s',
    boxShadow:'0 1px 6px rgba(61,38,0,0.05)',
  },
  divider: { display:'flex', alignItems:'center', gap:10, margin:'16px 0' },
  divLine:  { flex:1, height:1, background:'rgba(197,162,100,0.2)' },
  divText:  { fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mutedSoft, letterSpacing:1.5, textTransform:'uppercase' },
  errorBox: {
    background:C.rosePale, border:`1px solid rgba(192,57,43,0.2)`,
    borderRadius:10, padding:'10px 14px', fontSize:13, color:C.rose,
    marginBottom:14, display:'flex', alignItems:'center', gap:10,
    fontFamily:"'Lora',serif", textAlign:'left',
  },
  fieldLabel: {
    display:'block', marginBottom:7,
    fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:500,
    letterSpacing:1.5, textTransform:'uppercase', transition:'color 0.2s',
    textAlign:'left',
  },
  addInput: {
    width:'100%', padding:'12px 14px',
    background:C.bg, border:`1.5px solid rgba(197,162,100,0.3)`,
    borderRadius:12, outline:'none',
    fontFamily:"'Lora',serif", fontSize:14, color:C.ink,
    transition:'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    boxSizing:'border-box',
  },
  btnPrimary: {
    width:'100%', padding:'13px 20px', marginTop:4,
    background:`linear-gradient(135deg,${C.amber} 0%,${C.amberDark} 100%)`,
    border:'none', borderRadius:50, fontSize:14, fontWeight:700, color:C.ink,
    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    fontFamily:"'Lora',serif",
    boxShadow:`0 4px 18px rgba(200,160,60,0.3)`, transition:'all 0.2s',
  },
  spinner: {
    display:'inline-block', width:13, height:13,
    border:`2px solid rgba(61,38,0,0.25)`, borderTopColor:C.ink,
    borderRadius:'50%', animation:'dt-spin 0.7s linear infinite',
  },

  get bg() { return C.bg },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');

  @keyframes dt-spin { to { transform: rotate(360deg); } }

  .dt-nav-item:hover:not(.active) {
    background: #F5ECD4 !important;
    color: #3D2600 !important;
    border-color: rgba(197,162,100,0.3) !important;
  }
  .dt-account-card:hover {
    border-color: rgba(197,162,100,0.55) !important;
    box-shadow: 0 4px 18px rgba(61,38,0,0.09) !important;
  }
  .dt-more-btn:hover {
    background: #EDE0C4 !important;
    border-color: rgba(197,162,100,0.5) !important;
    color: #3D2600 !important;
  }
  .dt-menu-item:hover {
    background: #F5ECD4 !important;
  }
  .dt-google-btn:hover {
    background: #FFF8EE !important;
    border-color: rgba(197,162,100,0.55) !important;
    box-shadow: 0 4px 14px rgba(61,38,0,0.08) !important;
  }
  .dt-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 28px rgba(200,160,60,0.4) !important;
  }
  .dt-btn-danger:hover {
    background: #5c2000 !important;
    transform: translateY(-1px) !important;
  }
  .dt-btn-cancel:hover {
    background: #F5ECD4 !important;
    color: #3D2600 !important;
  }
  input::placeholder { color: rgba(122,96,64,0.3) !important; }
  input[type="password"] { letter-spacing: 3px; }
  input[type="password"]::placeholder { letter-spacing: normal; }
`;