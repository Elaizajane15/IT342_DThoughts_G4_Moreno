import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { useAuth } from '../hooks/useAuth'
import { authApi, filesApi, notificationsApi, oauthApi } from '../utils/api'
import { theme } from '../theme'

const QUOTES = [
  { quoteText: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { quoteText: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau' },
  { quoteText: "Don’t watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { quoteText: "Believe you can and you’re halfway there.", author: 'Theodore Roosevelt' },
  { quoteText: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
  { quoteText: 'Your time is limited, so don’t waste it living someone else’s life.', author: 'Steve Jobs' },
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [quote, setQuote] = useState(() => pickQuote(null))
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', password: '' })
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const menuRef = useRef(null)
  const isFeedActive = location.pathname === '/feed'
  const isNotificationActive = location.pathname === '/notification'
  const isDraftsActive = location.pathname === '/drafts'

  useEffect(() => {
    const id = setInterval(() => {
      setQuote((prev) => pickQuote(prev?.quoteText))
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof notifCount === 'number') return
    if (!user?.id) return
    let cancelled = false
    notificationsApi.unreadCount(user.id)
      .then((count) => { if (!cancelled) setUnreadCount(Number(count) || 0) })
      .catch(() => { if (!cancelled) setUnreadCount(0) })
    return () => { cancelled = true }
  }, [notifCount, user?.id, location.pathname, location.search])

  useEffect(() => {
    if (!menuOpen) return

    const onMouseDown = (e) => {
      if (!menuRef.current) return
      if (menuRef.current.contains(e.target)) return
      setMenuOpen(false)
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!logoutOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLogoutOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [logoutOpen])

  useEffect(() => {
    if (!addAccountOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setAddAccountOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [addAccountOpen])

  const handleAddAccount = () => {
    setMenuOpen(false)
    setAddError('')
    setAddForm({ email: '', password: '' })
    setAddAccountOpen(true)
  }

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Logout successful.', type: 'success' }))
    navigate('/login', { replace: true })
  }

  const handleLogoutPrompt = () => {
    setMenuOpen(false)
    setLogoutOpen(true)
  }

  const effectiveCount = typeof notifCount === 'number' ? notifCount : (user?.id ? unreadCount : 0)

  return (
    <aside style={styles.sidebar}>
      <div style={styles.scrollArea}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>📓</div>
          <div style={styles.brandText}>
            Daily<span style={{ color: theme.colors.amber }}>Thoughts</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavItem to="/feed" active={isFeedActive}>
            🏠 Feed
          </NavItem>
          {!isGuest && (
            <NavItem to="/create" active={location.pathname === '/create' || location.pathname === '/create-post'}>
              ✏️ New Thought
            </NavItem>
          )}
          {!isGuest && (
            <NavItem to="/drafts" active={isDraftsActive}>
              🗂️ Drafts
            </NavItem>
          )}
          <NavItem
            to="/notification"
            active={isNotificationActive}
            right={effectiveCount ? <span style={styles.badge}>{effectiveCount}</span> : null}
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
              <NavItem to="/login" active={location.pathname === '/login'}>
                � Login
              </NavItem>
              <NavItem to="/register" active={location.pathname === '/register'}>
                ✍️ Register
              </NavItem>
            </>
          )}
        </nav>
      </div>

      <div style={styles.bottomArea}>
        {quote && (
          <div style={styles.quoteCard}>
            <div style={styles.quoteLabel}>✨ Daily Quote</div>
            <div style={styles.quoteText}>"{quote.quoteText}"</div>
            <div style={styles.quoteAuthor}>— {quote.author}</div>
          </div>
        )}

        {!isGuest && (
          <div ref={menuRef} style={styles.accountWrap}>
            <div style={styles.accountCard} onClick={() => navigate('/profile')}>
              <div style={styles.accountRow}>
                <Avatar
                  name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'}
                  src={filesApi.getUrl(user?.avatarUrl)}
                  size="sm"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={styles.accountName}>{user?.firstName} {user?.lastName}</div>
                  <div style={styles.accountEmail}>{user?.email}</div>
                </div>
                <button
                  type="button"
                  aria-label="Account menu"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
                  style={styles.moreBtn}
                >
                  ⋯
                </button>
              </div>
            </div>

            {menuOpen && (
              <div style={styles.menu}>
                <button type="button" onClick={handleAddAccount} style={styles.menuItem}>
                  Add an existing account
                </button>
                <button type="button" onClick={handleLogoutPrompt} style={styles.menuItem}>
                  Log out {user?.email ? `@${String(user.email).split('@')[0]}` : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {logoutOpen && (
        <div
          style={styles.logoutOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLogoutOpen(false)
          }}
        >
          <div role="dialog" aria-modal="true" style={styles.logoutModal}>
            <div style={styles.logoutLogo}>📓</div>
            <div style={styles.logoutTitle}>Log out of DailyThoughts?</div>
            <div style={styles.logoutText}>
              You can always log back in at any time. If you just want to switch accounts, you can do that by adding an existing account.
            </div>
            <div style={styles.logoutActions}>
              <button
                type="button"
                onClick={async () => {
                  setLogoutOpen(false)
                  await handleLogout()
                }}
                style={styles.logoutPrimary}
              >
                Log out
              </button>
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                style={styles.logoutSecondary}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {addAccountOpen && (
        <div
          style={styles.addOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAddAccountOpen(false)
          }}
        >
          <div role="dialog" aria-modal="true" style={styles.addModal}>
            <button type="button" aria-label="Close" onClick={() => setAddAccountOpen(false)} style={styles.addClose}>
              ✕
            </button>

            <div style={styles.addLogo}>📓</div>
            <div style={styles.addTitle}>Sign in to DailyThoughts</div>

            <button
              type="button"
              onClick={() => { window.location.href = oauthApi.googleLoginUrl() }}
              style={styles.addGoogle}
            >
              Continue with Google
            </button>

            <div style={styles.addDividerRow}>
              <div style={styles.addDividerLine} />
              <div style={styles.addDividerText}>or</div>
              <div style={styles.addDividerLine} />
            </div>

            {addError && <div style={styles.addError}>⚠️ {addError}</div>}

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (addLoading) return
                setAddError('')
                const email = String(addForm.email || '').trim()
                const password = String(addForm.password || '')
                if (!email || !password) { setAddError('Please enter your email and password.'); return }
                setAddLoading(true)
                try {
                  const res = await authApi.login({ email, password })

                  const prevToken = localStorage.getItem('token')
                  const prevUserRaw = localStorage.getItem('user')
                  let prevUser = null
                  try { prevUser = prevUserRaw ? JSON.parse(prevUserRaw) : null } catch { prevUser = null }

                  const storedRaw = localStorage.getItem('dt_accounts')
                  let stored = []
                  try { stored = storedRaw ? JSON.parse(storedRaw) : [] } catch { stored = [] }
                  if (!Array.isArray(stored)) stored = []

                  if (prevUser?.email && prevToken) {
                    const exists = stored.some(a => String(a?.user?.email || '').toLowerCase() === String(prevUser.email).toLowerCase())
                    if (!exists) stored.unshift({ token: prevToken, user: prevUser })
                  }

                  const nextUser = res?.user || null
                  const nextToken = res?.token || null
                  if (nextUser?.email && nextToken) {
                    stored = stored.filter(a => String(a?.user?.email || '').toLowerCase() !== String(nextUser.email).toLowerCase())
                    stored.unshift({ token: nextToken, user: nextUser })
                  }
                  localStorage.setItem('dt_accounts', JSON.stringify(stored.slice(0, 5)))

                  login(res.token, res.user)
                  sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Account added.', type: 'success' }))
                  setAddAccountOpen(false)
                  navigate('/feed')
                } catch (err) {
                  setAddError(err?.message || 'Failed to sign in.')
                } finally {
                  setAddLoading(false)
                }
              }}
            >
              <input
                value={addForm.email}
                onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                autoComplete="email"
                style={styles.addInput}
              />
              <input
                value={addForm.password}
                onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Password"
                type="password"
                autoComplete="current-password"
                style={styles.addInput}
              />

              <button type="submit" style={{ ...styles.addPrimary, opacity: addLoading ? 0.7 : 1 }}>
                {addLoading ? 'Signing in…' : 'Next'}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}

function NavItem({ to, active, children, right }) {
  return (
    <Link
      to={to}
      style={{
        ...styles.navItem,
        background: active ? theme.colors.warmWhite : 'transparent',
        color: active ? theme.colors.ink : theme.colors.inkMuted,
        borderColor: active ? theme.colors.border : 'transparent',
        boxShadow: active ? theme.shadows.sm : 'none',
      }}
    >
      <span style={styles.navLabel}>{children}</span>
      {right}
    </Link>
  )
}

const styles = {
  sidebar: {
    width: '240px',
    flexShrink: 0,
    padding: '24px 16px',
    position: 'sticky',
    top: '24px',
    height: 'calc(100vh - 48px)',
    overflow: 'hidden',
    borderRight: `1px solid ${theme.colors.border}`,
    background: theme.colors.cream,
    display: 'flex',
    flexDirection: 'column',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' },
  brandIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: theme.colors.amber,
    display: 'grid',
    placeItems: 'center',
    fontSize: '18px',
  },
  brandText: { fontFamily: theme.fonts.display, fontSize: '16px', fontWeight: 800, color: theme.colors.ink },
  scrollArea: { overflowY: 'auto', paddingBottom: '12px', flex: 1, minHeight: 0 },
  bottomArea: { paddingTop: '12px', borderTop: `1px solid ${theme.colors.border}`, position: 'relative', marginTop: 'auto' },
  nav: { display: 'grid', gap: '10px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: theme.radius.md,
    textDecoration: 'none',
    border: '1px solid',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    transition: theme.transition,
    width: '100%',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    transition: theme.transition,
    width: '100%',
    background: theme.colors.amber,
    color: theme.colors.ink,
    textAlign: 'left',
  },
  navLabel: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: {
    background: theme.colors.rose,
    color: theme.colors.warmWhite,
    borderRadius: theme.radius.full,
    padding: '2px 8px',
    fontFamily: theme.fonts.display,
    fontSize: '11px',
    fontWeight: 800,
    lineHeight: 1.4,
  },
  quoteCard: {
    background: theme.colors.ink,
    borderRadius: theme.radius.lg,
    padding: '14px',
    marginBottom: '12px',
  },
  quoteLabel: { fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.amber, letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' },
  quoteText: { fontFamily: theme.fonts.display, fontSize: '13px', color: '#d4c4a8', fontStyle: 'italic', lineHeight: 1.5 },
  quoteAuthor: { fontFamily: theme.fonts.mono, fontSize: '11px', color: '#6a5a40', marginTop: '10px' },
  accountCard: {
    background: theme.colors.warmWhite,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: '12px',
    boxShadow: theme.shadows.sm,
    cursor: 'pointer',
    marginBottom: '10px',
  },
  accountWrap: { position: 'relative' },
  accountRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  accountTitle: { fontFamily: theme.fonts.display, fontSize: '12px', fontWeight: 800, color: theme.colors.ink, marginBottom: '6px' },
  accountName: { fontFamily: theme.fonts.display, fontSize: '13px', fontWeight: 800, color: theme.colors.ink },
  accountEmail: { fontFamily: theme.fonts.body, fontSize: '12px', color: theme.colors.inkMuted, marginTop: '2px', wordBreak: 'break-word' },
  moreBtn: {
    width: '34px',
    height: '34px',
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.cream,
    fontFamily: theme.fonts.body,
    fontSize: '18px',
    cursor: 'pointer',
    color: theme.colors.inkMuted,
    display: 'grid',
    placeItems: 'center',
  },
  menu: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '58px',
    background: theme.colors.warmWhite,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.md,
    padding: '6px',
    zIndex: 50,
  },
  menuItem: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    padding: '10px 10px',
    borderRadius: theme.radius.md,
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    color: theme.colors.ink,
  },
  logoutOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 200,
    padding: '18px',
  },
  logoutModal: {
    width: '100%',
    maxWidth: '420px',
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '26px 22px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.md,
    textAlign: 'center',
  },
  logoutLogo: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    background: theme.colors.cream,
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 12px',
    fontSize: '26px',
    border: `1px solid ${theme.colors.border}`,
  },
  logoutTitle: {
    fontFamily: theme.fonts.display,
    fontSize: '20px',
    fontWeight: 800,
    color: theme.colors.ink,
    marginBottom: '10px',
  },
  logoutText: {
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    lineHeight: 1.6,
    color: theme.colors.inkMuted,
    marginBottom: '18px',
  },
  logoutActions: { display: 'grid', gap: '10px' },
  logoutPrimary: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: theme.radius.full,
    border: 'none',
    background: theme.colors.ink,
    color: theme.colors.cream,
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  logoutSecondary: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: theme.radius.full,
    border: `1.5px solid ${theme.colors.border}`,
    background: 'transparent',
    color: theme.colors.ink,
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  addOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 220,
    padding: '18px',
  },
  addModal: {
    width: '100%',
    maxWidth: '520px',
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '26px 22px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.md,
    position: 'relative',
  },
  addClose: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.cream,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    fontWeight: 900,
    display: 'grid',
    placeItems: 'center',
    color: theme.colors.ink,
  },
  addLogo: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    background: theme.colors.cream,
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 12px',
    fontSize: '26px',
    border: `1px solid ${theme.colors.border}`,
  },
  addTitle: {
    fontFamily: theme.fonts.display,
    fontSize: '24px',
    fontWeight: 900,
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: '14px',
  },
  addGoogle: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: theme.radius.full,
    border: `1.5px solid ${theme.colors.border}`,
    background: theme.colors.warmWhite,
    color: theme.colors.ink,
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  addDividerRow: { display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' },
  addDividerLine: { height: 1, background: theme.colors.border, flex: 1, opacity: 0.8 },
  addDividerText: { fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.inkMuted, textTransform: 'uppercase', letterSpacing: '2px' },
  addError: {
    background: theme.colors.rosePale,
    border: `1px solid ${theme.colors.rose}40`,
    borderRadius: theme.radius.sm,
    padding: '10px 14px',
    fontSize: '13px',
    color: theme.colors.rose,
    marginBottom: '12px',
    fontFamily: theme.fonts.body,
    fontWeight: 700,
  },
  addInput: {
    width: '100%',
    padding: '12px 12px',
    borderRadius: theme.radius.lg,
    border: `1.5px solid ${theme.colors.border}`,
    background: theme.colors.cream,
    outline: 'none',
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    marginBottom: '10px',
  },
  addPrimary: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: theme.radius.full,
    border: 'none',
    background: theme.colors.ink,
    color: theme.colors.cream,
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: '6px',
  },
}
