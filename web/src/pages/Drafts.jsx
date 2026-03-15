import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import Toast from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { draftsApi, quotesApi, userApi } from '../utils/api'
import { theme } from '../theme'

export default function DraftsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isGuest = !user

  const [quote, setQuote] = useState(null)
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isGuest) navigate('/login', { replace: true })
  }, [isGuest, navigate])

  useEffect(() => {
    quotesApi.getDailyQuote()
      .then(setQuote)
      .catch(() => setQuote(null))
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem('dt_toast')
    if (!raw) return
    sessionStorage.removeItem('dt_toast')
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.message) setToast({ message: String(parsed.message), type: parsed.type === 'error' ? 'error' : 'success' })
    } catch {
      setToast({ message: String(raw), type: 'success' })
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const d = await draftsApi.getMy(user.id)
        if (cancelled) return
        setDraft(d)
      } catch (e) {
        if (cancelled) return
        setDraft(null)
        setError(e?.message || 'Failed to load draft.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user?.id])

  const handleDelete = async () => {
    if (!draft?.id) return
    try {
      await draftsApi.delete(draft.id)
      setDraft(null)
      setToast({ message: 'Draft deleted.', type: 'success' })
    } catch (e) {
      setToast({ message: e?.message || 'Failed to delete draft.', type: 'error' })
    }
  }

  const subtitle = useMemo(() => {
    if (!draft?.updatedAt && !draft?.createdAt) return null
    const raw = draft.updatedAt || draft.createdAt
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleString()
  }, [draft?.createdAt, draft?.updatedAt])

  return (
    <div style={styles.shell}>
      <Toast message={toast?.message} type={toast?.type || 'success'} onClose={() => setToast(null)} />
      <div style={styles.layout}>
        <Sidebar dailyQuote={quote} />

        <main style={styles.main}>
          <div style={styles.headerRow}>
            <h1 style={styles.title}>Your Drafts</h1>
            <button type="button" onClick={() => navigate('/create')} style={styles.primaryBtn}>
              ✏️ New Thought
            </button>
          </div>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          {loading ? (
            <div style={styles.loading}>Loading…</div>
          ) : !draft ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📄</div>
              <div style={styles.emptyTitle}>No saved drafts yet</div>
              <div style={styles.emptySub}>Save a draft from Feed or New Thought, then it will show here.</div>
              <button type="button" onClick={() => navigate('/create')} style={styles.secondaryBtn}>
                Continue Writing
              </button>
            </div>
          ) : (
            <div style={styles.card}>
              <div style={styles.cardTop}>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.cardTitle}>{draft.title || 'Untitled draft'}</div>
                  {subtitle && <div style={styles.cardSub}>Last saved: {subtitle}</div>}
                </div>
                {draft.mood && <div style={styles.moodChip}>😊 {draft.mood}</div>}
              </div>

              <div style={styles.contentBox}>{draft.content}</div>

              <div style={styles.actions}>
                <button type="button" onClick={() => navigate('/create')} style={styles.secondaryBtn}>
                  Continue Writing
                </button>
                <button type="button" onClick={handleDelete} style={styles.dangerBtn}>
                  Delete Draft
                </button>
              </div>
            </div>
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  )
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
  ]

  const suggested = [
    { name: 'Karla Manalo', sub: '34 thoughts this week' },
    { name: 'Ben Cruz', sub: 'Philosophy · Stoicism' },
    { name: 'Lena Park', sub: 'Mindfulness · Wellness' },
  ]

  const [followed, setFollowed] = useState({})
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
  )
}

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
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' },
  title: { fontFamily: theme.fonts.display, fontSize: '22px', fontWeight: 800, color: theme.colors.ink, margin: 0 },
  loading: { padding: '22px 0', color: theme.colors.inkMuted, fontFamily: theme.fonts.body },
  errorBox: {
    background: theme.colors.rosePale,
    border: `1px solid ${theme.colors.rose}40`,
    color: theme.colors.ink,
    padding: '10px 12px',
    borderRadius: theme.radius.md,
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    marginBottom: '12px',
  },
  empty: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '28px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.md,
    textAlign: 'center',
  },
  emptyIcon: { fontSize: '44px', marginBottom: '8px' },
  emptyTitle: { fontFamily: theme.fonts.display, fontSize: '16px', fontWeight: 800, color: theme.colors.ink, marginBottom: '6px' },
  emptySub: { fontFamily: theme.fonts.body, fontSize: '13px', color: theme.colors.inkMuted, marginBottom: '14px' },
  card: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '22px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.md,
  },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' },
  cardTitle: { fontFamily: theme.fonts.display, fontSize: '16px', fontWeight: 800, color: theme.colors.ink },
  cardSub: { fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.inkMuted, marginTop: '6px' },
  moodChip: {
    padding: '6px 10px',
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border}`,
    fontFamily: theme.fonts.body,
    fontSize: '12px',
    color: theme.colors.inkMuted,
    background: theme.colors.cream,
    whiteSpace: 'nowrap',
  },
  contentBox: {
    whiteSpace: 'pre-wrap',
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    color: theme.colors.ink,
    lineHeight: 1.7,
    padding: '12px',
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.cream,
    marginBottom: '16px',
  },
  actions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
  primaryBtn: {
    padding: '10px 14px',
    borderRadius: theme.radius.md,
    background: theme.colors.amber,
    border: 'none',
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    fontWeight: 800,
    color: theme.colors.ink,
  },
  secondaryBtn: {
    padding: '10px 14px',
    borderRadius: theme.radius.md,
    background: 'transparent',
    border: `1.5px solid ${theme.colors.border}`,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    fontWeight: 700,
    color: theme.colors.inkMuted,
  },
  dangerBtn: {
    padding: '10px 14px',
    borderRadius: theme.radius.md,
    background: theme.colors.rosePale,
    border: `1.5px solid ${theme.colors.rose}40`,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    fontWeight: 800,
    color: theme.colors.ink,
  },
  rightBar: {
    width: '280px',
    flexShrink: 0,
    position: 'sticky',
    top: '24px',
    maxHeight: 'calc(100vh - 48px)',
    overflowY: 'auto',
    '@media(max-width:900px)': { display: 'none' },
  },
  searchBox: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border}`,
    padding: '10px 12px',
    marginBottom: '14px',
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
    borderRadius: theme.radius.xl,
    padding: '16px',
    marginBottom: '14px',
    border: `1px solid ${theme.colors.border}`,
  },
  widgetTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: theme.colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '14px',
    fontFamily: theme.fonts.mono,
  },
  trendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: `1px solid ${theme.colors.border}`,
    cursor: 'pointer',
  },
  trendNum: { fontFamily: theme.fonts.display, fontSize: '20px', fontWeight: '900', color: theme.colors.border, width: '24px' },
  trendName: { fontSize: '13px', fontWeight: '600', color: theme.colors.ink, fontFamily: theme.fonts.body },
  trendCount: { fontSize: '11px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body },
  suggestRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' },
  suggestName: { fontSize: '13px', fontWeight: '600', color: theme.colors.ink, fontFamily: theme.fonts.body },
  suggestSub: { fontSize: '11px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body },
  followBtn: {
    padding: '5px 14px',
    border: `1.5px solid ${theme.colors.amber}`,
    borderRadius: theme.radius.full,
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: theme.transition,
    fontFamily: theme.fonts.body,
    whiteSpace: 'nowrap',
  },
}
