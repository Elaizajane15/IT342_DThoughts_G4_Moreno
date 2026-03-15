import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';
import { quotesApi, userApi, notificationsApi } from '../utils/api';

// ─── Notification types ───────────────────────────────────────────────────────
const TYPE_META = {
  LIKE:    { icon: '❤️', color: theme.colors.rose,     label: 'liked your thought' },
  COMMENT: { icon: '💬', color: theme.colors.amber,    label: 'commented on your thought' },
  FOLLOW:  { icon: '👤', color: theme.colors.sky,      label: 'started following you' },
  POST:    { icon: '📝', color: theme.colors.sage,     label: 'posted a new thought' },
  SYSTEM:  { icon: '📢', color: theme.colors.sage,     label: '' },
};

export default function NotificationsPage() {
  const navigate         = useNavigate();
  const { user } = useAuth();
  const isGuest = !user;

  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | unread
  const [quote,   setQuote]   = useState(null);

  useEffect(() => {
    if (isGuest) { navigate('/login'); return; }
    if (!user?.id) return
    notificationsApi.listMine(user.id)
      .then(data => setNotifs(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err)
        setNotifs([])
      })
      .finally(() => setLoading(false))
  }, [isGuest, navigate, user?.id]);

  useEffect(() => {
    quotesApi.getDailyQuote()
      .then(setQuote)
      .catch(() => setQuote({ quoteText: 'Every day is a new page in your story.', author: 'DailyThoughts' }));
  }, []);

  const handleMarkAll = async () => {
    if (!user?.id) return
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    await notificationsApi.markAllRead(user.id).catch(console.error);
  };

  const handleMarkOne = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (user?.id) {
      notificationsApi.markRead(user.id, id).catch(() => {})
    }
  };

  const filtered = filter === 'unread'
    ? notifs.filter(n => !n.read)
    : notifs;

  const unreadCount = notifs.filter(n => !n.read).length;

  // Group by date
  const grouped = filtered.reduce((acc, n) => {
    const key = groupLabel(n.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <div style={styles.shell}>
      <div style={styles.layout}>
        <Sidebar dailyQuote={quote} notifCount={unreadCount} />

        <main style={styles.main}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Notifications</h1>
              {unreadCount > 0 && (
                <p style={styles.subtitle}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
            <div style={styles.headerActions}>
              <div style={styles.filterPills}>
                {['all', 'unread'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{ ...styles.filterPill, ...(filter === f ? styles.filterPillActive : {}) }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === 'unread' && unreadCount > 0 && (
                      <span style={styles.pillBadge}>{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} style={styles.markAllBtn}>
                  ✓ Mark all read
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>
              Loading notifications…
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '48px' }}>🔔</span>
              <p style={{ color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>
                {filter === 'unread' ? 'All caught up! No unread notifications.' : 'No notifications yet.'}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div style={styles.groupLabel}>{group}</div>
                {items.map(notif => (
                  <NotifItem
                    key={notif.id}
                    notif={notif}
                    onRead={handleMarkOne}
                    onClick={() => {
                      handleMarkOne(notif.id);
                    if (notif.refPostId) navigate(`/post/${notif.refPostId}`);
                    }}
                  />
                ))}
              </div>
            ))
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

function RightSidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isGuest = !user
  const trending = [
    { name: 'Morning Routine', count: '142 thoughts today' },
    { name: 'Gratitude Journal', count: '98 thoughts today' },
    { name: 'Mindfulness', count: '76 thoughts today' },
    { name: 'Self Reflection', count: '61 thoughts today' },
  ];
  const suggested = [
    { name: 'Karla Manalo', sub: '34 thoughts this week' },
    { name: 'Ben Cruz', sub: 'Philosophy · Stoicism' },
    { name: 'Lena Park', sub: 'Mindfulness · Wellness' },
  ];
  const [followed, setFollowed] = useState({});
  const [query, setQuery] = useState('')
  const [userResults, setUserResults] = useState([])
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')

  const q = query.trim().toLowerCase()
  const filteredTrending = q
    ? trending.filter(t => String(t.name).toLowerCase().includes(q))
    : trending

  useEffect(() => {
    const text = query.trim()
    let ignore = false
    const t = setTimeout(() => {
      if (!text) return
      setUserLoading(true)
      setUserError('')
      userApi.search(text, { limit: 25 })
        .then((list) => {
          if (ignore) return
          setUserResults(list)
        })
        .catch((e) => {
          if (ignore) return
          setUserError(e?.message || 'Failed to search users.')
          setUserResults([])
        })
        .finally(() => {
          if (ignore) return
          setUserLoading(false)
        })
    }, 250)

    return () => {
      ignore = true
      clearTimeout(t)
    }
  }, [query])

  const listUsers = q ? userResults : suggested

  return (
    <aside style={styles.rightBar}>
      <div style={styles.searchBox}>
        <span style={styles.searchIcon}>🔎</span>
        <input
          value={query}
          onChange={(e) => {
            const next = e.target.value
            setQuery(next)
            if (!next.trim()) {
              setUserResults([])
              setUserLoading(false)
              setUserError('')
            }
          }}
          placeholder="Search trending or users"
          style={styles.searchInput}
        />
      </div>
      <div style={styles.widget}>
        <div style={styles.widgetTitle}>📈 Trending Topics</div>
        {filteredTrending.length === 0 ? (
          <div style={styles.searchEmpty}>No trending results.</div>
        ) : filteredTrending.map((t, i) => (
          <div key={t.name} style={styles.trendRow}>
            <span style={styles.trendNum}>{i + 1}</span>
            <div>
              <div style={styles.trendName}>{t.name}</div>
              <div style={styles.trendCount}>{t.count}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.widget}>
        <div style={styles.widgetTitle}>👥 People to Follow</div>
        {userLoading ? (
          <div style={styles.searchEmpty}>Searching…</div>
        ) : userError ? (
          <div style={styles.searchEmpty}>{userError}</div>
        ) : listUsers.length === 0 ? (
          <div style={styles.searchEmpty}>No user results.</div>
        ) : listUsers.map((u) => {
          const id = u?.id
          const name = u?.firstName || u?.lastName
            ? `${u?.firstName || ''} ${u?.lastName || ''}`.trim()
            : (u?.name || u?.email || 'Unknown')
          const sub = u?.sub || u?.email || ''
          const key = id != null ? `u:${id}` : `s:${name}`
          const followKey = id != null ? String(id) : name
          return (
            <div key={key} style={styles.suggestRow}>
              <div onClick={() => { if (id != null) navigate(`/profile/${id}`) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, cursor: id != null ? 'pointer' : 'default' }}>
                <Avatar name={name} src={u?.avatarUrl} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.suggestName}>{name}</div>
                  <div style={styles.suggestSub}>{sub}</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (id == null) return
                  if (isGuest) { navigate('/login'); return }
                  try {
                    const res = await userApi.toggleFollow(id, user?.id ?? null)
                    setFollowed(f => ({ ...f, [followKey]: !!res.following }))
                  } catch (e) {
                    alert(e?.message || 'Failed to follow user.')
                  }
                }}
                style={{
                  ...styles.followBtn,
                  background: followed[followKey] ? theme.colors.amberPale : 'transparent',
                  color: followed[followKey] ? theme.colors.amberDark : theme.colors.amber,
                }}
              >
                {followed[followKey] ? '✓ Following' : 'Follow'}
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────
function NotifItem({ notif, onRead, onClick }) {
  const [hov, setHov] = useState(false);
  const meta = TYPE_META[notif.type] || TYPE_META.SYSTEM;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...styles.item,
        background: !notif.read ? '#fffbf0' : theme.colors.warmWhite,
        border: `1px solid ${!notif.read ? theme.colors.amber + '30' : theme.colors.border}`,
        boxShadow: hov ? theme.shadows.md : theme.shadows.card,
        transform: hov ? 'translateY(-1px)' : 'none',
        cursor: notif.refPostId ? 'pointer' : 'default',
      }}
    >
      {/* Unread dot */}
      {!notif.read && <div style={styles.unreadDot} />}

      {/* Actor avatar with type icon */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={notif.actorName || 'System'} src={notif.actorAvatar} size="sm" />
        <div style={{ ...styles.typeIcon, borderColor: meta.color + '40' }}>
          {meta.icon}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={styles.itemText}>
          <strong style={{ color: theme.colors.ink }}>{notif.actorName || 'DailyThoughts'}</strong>
          {' '}{meta.label || notif.message}
        </p>

        {notif.postPreview && (
          <div style={styles.preview}>
            {notif.postPreview.length > 80
              ? notif.postPreview.slice(0, 80) + '…'
              : notif.postPreview}
          </div>
        )}

        <p style={styles.itemTime}>{formatRelative(notif.createdAt)}</p>
      </div>

      {/* Mark read button */}
      {!notif.read && (
        <button
          onClick={e => { e.stopPropagation(); onRead(notif.id); }}
          style={styles.markBtn}
          title="Mark as read"
        >
          ✓
        </button>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function groupLabel(ts) {
  if (!ts) return 'Earlier';
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 3600)  return 'Just Now';
  if (diff < 86400) return 'Today';
  if (diff < 172800) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' });
}

function formatRelative(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  shell: { minHeight: '100vh', background: theme.colors.cream },
  layout: {
    width: '100%',
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '24px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '18px',
  },
  main: { flex: '0 1 640px', minWidth: 0 },
  header: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: '24px',
    gap: '16px', flexWrap: 'wrap',
  },
  title: { fontFamily: theme.fonts.display, fontSize: '28px', fontWeight: '700', color: theme.colors.ink },
  subtitle: { color: theme.colors.inkMuted, fontSize: '13px', fontFamily: theme.fonts.body, marginTop: '4px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  filterPills: { display: 'flex', gap: '4px', background: theme.colors.parchment, borderRadius: theme.radius.md, padding: '3px' },
  filterPill: {
    padding: '6px 14px', borderRadius: theme.radius.sm,
    border: 'none', background: 'transparent',
    fontSize: '12px', fontWeight: '600',
    color: theme.colors.inkMuted, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: theme.transition, fontFamily: theme.fonts.body,
  },
  filterPillActive: {
    background: theme.colors.warmWhite,
    color: theme.colors.ink,
    boxShadow: theme.shadows.sm,
  },
  pillBadge: {
    background: theme.colors.rose, color: '#fff',
    fontSize: '9px', fontWeight: '700',
    padding: '1px 5px', borderRadius: '8px',
    fontFamily: theme.fonts.mono,
  },
  markAllBtn: {
    background: 'none', border: 'none',
    color: theme.colors.amberDark,
    fontSize: '12px', fontWeight: '600',
    cursor: 'pointer', fontFamily: theme.fonts.body,
  },
  groupLabel: {
    fontSize: '11px', fontWeight: '700',
    color: theme.colors.inkMuted,
    textTransform: 'uppercase', letterSpacing: '1px',
    fontFamily: theme.fonts.mono,
    margin: '20px 0 8px',
  },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    borderRadius: theme.radius.xl,
    padding: '14px 16px', marginBottom: '8px',
    transition: theme.transition, position: 'relative',
  },
  unreadDot: {
    position: 'absolute', top: '16px', right: '16px',
    width: '8px', height: '8px', borderRadius: '50%',
    background: theme.colors.amber,
  },
  typeIcon: {
    position: 'absolute', bottom: '-2px', right: '-2px',
    width: '18px', height: '18px', borderRadius: '50%',
    background: theme.colors.warmWhite,
    border: `1px solid ${theme.colors.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px',
  },
  itemText: {
    fontSize: '13.5px', color: theme.colors.inkLight,
    lineHeight: 1.5, fontFamily: theme.fonts.body,
    margin: 0,
  },
  preview: {
    marginTop: '6px',
    padding: '7px 12px',
    background: theme.colors.parchment,
    borderRadius: theme.radius.sm,
    fontSize: '12px',
    color: theme.colors.inkMuted,
    fontStyle: 'italic',
    borderLeft: `3px solid ${theme.colors.amber}`,
    fontFamily: theme.fonts.body,
  },
  itemTime: {
    fontSize: '11px', color: theme.colors.inkMuted,
    marginTop: '5px', fontFamily: theme.fonts.mono,
  },
  markBtn: {
    background: 'none', border: 'none',
    color: theme.colors.inkMuted, cursor: 'pointer',
    fontSize: '14px', flexShrink: 0,
    padding: '2px 6px', borderRadius: '50%',
    transition: theme.transition,
  },
  emptyState: {
    textAlign: 'center', padding: '64px 20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '16px',
  },
  rightBar: { flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '12px' },
  searchBox: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border}`,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  searchIcon: { color: theme.colors.inkMuted, fontSize: '14px' },
  searchInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    color: theme.colors.ink,
    background: 'transparent',
  },
  searchEmpty: { color: theme.colors.inkMuted, fontFamily: theme.fonts.body, fontSize: '12px' },
  widget: {
    background: theme.colors.warmWhite,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.xl,
    padding: '14px',
    boxShadow: theme.shadows.card,
  },
  widgetTitle: { fontFamily: theme.fonts.display, fontSize: '14px', color: theme.colors.ink, marginBottom: '10px' },
  trendRow: { display: 'flex', gap: '10px', padding: '10px 0', borderTop: `1px solid ${theme.colors.border}` },
  trendNum: { fontFamily: theme.fonts.display, color: theme.colors.amberDark, width: '18px' },
  trendName: { fontFamily: theme.fonts.body, fontWeight: 600, color: theme.colors.ink, fontSize: '13px' },
  trendCount: { fontFamily: theme.fonts.body, color: theme.colors.inkMuted, fontSize: '12px' },
  suggestRow: { display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${theme.colors.border}` },
  suggestName: { fontFamily: theme.fonts.display, fontSize: '13px', color: theme.colors.ink },
  suggestSub: { fontFamily: theme.fonts.body, color: theme.colors.inkMuted, fontSize: '12px' },
  followBtn: {
    border: `1px solid ${theme.colors.amber}`,
    background: 'transparent',
    borderRadius: theme.radius.sm,
    padding: '6px 10px',
    fontFamily: theme.fonts.body,
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
 
