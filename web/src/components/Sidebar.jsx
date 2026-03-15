import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { useAuth } from '../hooks/useAuth'
import { filesApi, notificationsApi } from '../utils/api'
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
  const { user, logout } = useAuth()
  const isGuest = !user
  const [unreadCount, setUnreadCount] = useState(0)
  const [quote, setQuote] = useState(() => pickQuote(null))
  const [menuOpen, setMenuOpen] = useState(false)
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

  const handleAddAccount = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login', { replace: true, state: { addAccount: true } })
  }

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login', { replace: true })
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
                <button type="button" onClick={handleLogout} style={styles.menuItem}>
                  Log out {user?.email ? `@${String(user.email).split('@')[0]}` : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
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
}
