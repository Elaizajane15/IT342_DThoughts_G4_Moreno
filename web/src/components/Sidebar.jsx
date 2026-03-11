import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { theme } from '../theme'

export default function Sidebar({ dailyQuote, notifCount = 0 }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isGuest = !user

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandIcon}>📓</div>
        <div style={styles.brandText}>
          Daily<span style={{ color: theme.colors.amber }}>Thoughts</span>
        </div>
      </div>

      <nav style={styles.nav}>
        <NavItem to="/feed" active={location.pathname === '/feed'}>
          🏠 Home
        </NavItem>
        {isGuest ? (
          <>
            <NavItem to="/login" active={location.pathname === '/login'}>
              🔐 Login
            </NavItem>
            <NavItem to="/register" active={location.pathname === '/register'}>
              ✍️ Register
            </NavItem>
          </>
        ) : (
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            style={styles.navButton}
          >
            🚪 Logout
          </button>
        )}
      </nav>

      {!isGuest && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>👤 Account</div>
          <div style={styles.accountName}>{user?.firstName} {user?.lastName}</div>
          <div style={styles.accountEmail}>{user?.email}</div>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardTitle}>🔔 Notifications</div>
        <div style={styles.notifCount}>{notifCount}</div>
      </div>

      {dailyQuote && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>✨ Daily Quote</div>
          <div style={styles.quoteText}>"{dailyQuote.quoteText}"</div>
          <div style={styles.quoteAuthor}>— {dailyQuote.author}</div>
        </div>
      )}
    </aside>
  )
}

function NavItem({ to, active, children }) {
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
      {children}
    </Link>
  )
}

const styles = {
  sidebar: {
    width: '240px',
    flexShrink: 0,
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    borderRight: `1px solid ${theme.colors.border}`,
    background: theme.colors.cream,
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
  nav: { display: 'grid', gap: '8px', marginBottom: '18px' },
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
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: theme.radius.md,
    textDecoration: 'none',
    border: '1px solid transparent',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    transition: theme.transition,
    cursor: 'pointer',
    background: 'transparent',
    color: theme.colors.inkMuted,
    textAlign: 'left',
  },
  card: {
    background: theme.colors.warmWhite,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: '12px',
    boxShadow: theme.shadows.sm,
    marginBottom: '12px',
  },
  cardTitle: { fontFamily: theme.fonts.display, fontSize: '12px', fontWeight: 800, color: theme.colors.ink, marginBottom: '6px' },
  notifCount: { fontFamily: theme.fonts.display, fontSize: '28px', fontWeight: 900, color: theme.colors.amberDark, lineHeight: 1 },
  accountName: { fontFamily: theme.fonts.display, fontSize: '13px', fontWeight: 800, color: theme.colors.ink },
  accountEmail: { fontFamily: theme.fonts.body, fontSize: '12px', color: theme.colors.inkMuted, marginTop: '2px', wordBreak: 'break-word' },
  quoteText: { fontFamily: theme.fonts.body, fontSize: '13px', color: theme.colors.inkLight, lineHeight: 1.45 },
  quoteAuthor: { fontFamily: theme.fonts.body, fontSize: '12px', color: theme.colors.inkMuted, marginTop: '8px' },
}
