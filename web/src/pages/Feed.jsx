import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ThoughtCard from '../components/ThoughtCard';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { postsApi, quotesApi, filesApi, userApi } from '../utils/api';
import { theme } from '../theme';

const TABS = ['For You', 'Following'];

export default function FeedPage() {
  const navigate         = useNavigate();
  const location         = useLocation();
  const { user } = useAuth();
  const isGuest = !user;

  const [posts,     setPosts]     = useState([]);
  const [quote,     setQuote]     = useState(null);
  const [tab,       setTab]       = useState(() => {
    const t = Number(new URLSearchParams(location.search).get('tab'));
    return Number.isFinite(t) && t >= 0 && t <= 1 ? t : 0;
  });
  const [page,      setPage]      = useState(0);
  const [hasMore,   setHasMore]   = useState(true);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [compose,   setCompose]   = useState('');
  const [toast,     setToast]     = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Fetch daily quote
  useEffect(() => {
    quotesApi.getDailyQuote()
      .then(setQuote)
      .catch(() => setQuote({ quoteText: 'Every day is a new page in your story.', author: 'DailyThoughts' }));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('dt_toast');
    if (!raw) return;
    sessionStorage.removeItem('dt_toast');
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.message) setToast({ message: String(parsed.message), type: parsed.type === 'error' ? 'error' : 'success' });
    } catch {
      setToast({ message: String(raw), type: 'success' });
    }
  }, []);

  // Fetch posts
  const loadPosts = useCallback(async (reset = false) => {
    const p = reset ? 0 : page;
    setLoading(true);
    setError('');
    try {
      const res = tab === 1
        ? (isGuest || user?.id == null ? { content: [], totalPages: 0 } : await postsApi.getFollowing(user.id, p, 10))
        : await postsApi.getAll(p, 10);
      setPosts(prev => reset ? res.content : [...prev, ...res.content]);
      setPage(p + 1);
      setHasMore(p + 1 < res.totalPages);
    } catch (e) {
      setError(e?.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, [isGuest, page, tab, user?.id]);

  useEffect(() => {
    const t = Number(new URLSearchParams(location.search).get('tab'));
    const next = Number.isFinite(t) && t >= 0 && t <= 1 ? t : 0;
    setTab((prev) => (prev === next ? prev : next));
  }, [location.search]);

  useEffect(() => { loadPosts(true); }, [tab, loadPosts]);

  const handleDelete = (postId) => {
    setConfirmDeleteId(postId);
  };

  const confirmDelete = async () => {
    const postId = confirmDeleteId;
    if (postId == null) return;
    try {
      await postsApi.delete(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setToast({ message: 'Post deleted.', type: 'success' });
    } catch (e) {
      setToast({ message: e?.message || 'Failed to delete post.', type: 'error' });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleComposeSubmit = () => {
    if (!compose.trim()) return;
    navigate('/create', { state: { prefill: compose } });
    setCompose('');
  };

  return (
    <div style={styles.shell}>
      <Toast message={toast?.message} type={toast?.type || 'success'} onClose={() => setToast(null)} />
      {confirmDeleteId != null && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true">
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Delete Post</div>
            <div style={styles.modalBody}>Are you sure you want to delete this post?</div>
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setConfirmDeleteId(null)} style={styles.modalCancel}>
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} style={styles.modalDanger}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={styles.layout}>
        <Sidebar dailyQuote={quote} />

        <main style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.title}>
              Your <span style={{ color: theme.colors.amber }}>Feed</span>
            </h1>
          </div>

          <div style={styles.tabs}>
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => navigate(i === 0 ? '/feed' : `/feed?tab=${i}`)}
                style={{ ...styles.tab, ...(tab === i ? styles.tabActive : {}) }}
              >
                {t}
              </button>
            ))}
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ fontFamily: theme.fonts.body, color: theme.colors.ink }}>
                  {error}
                </div>
                <button onClick={() => loadPosts(true)} style={styles.retryBtn}>Retry</button>
              </div>
            </div>
          )}

          {isGuest && (
            <div style={styles.guestBanner}>
              <span style={{ fontSize: '28px' }}>🔒</span>
              <div style={{ flex: 1 }}>
                <h4 style={styles.guestTitle}>You're viewing as a Guest</h4>
                <p style={styles.guestSub}>Login to like posts, comment, and share your own daily thoughts.</p>
              </div>
              <button onClick={() => navigate('/login')} style={styles.guestCta}>
                Login
              </button>
            </div>
          )}

          {!isGuest && (
            <div style={styles.compose}>
              <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" src={filesApi.getUrl(user?.avatarUrl)} onClick={() => navigate('/profile')} />
              <div style={{ flex: 1 }}>
                <textarea
                  value={compose}
                  onChange={e => setCompose(e.target.value)}
                  placeholder="What's on your mind today?"
                  rows={compose.split('\n').length > 1 ? 3 : 1}
                  style={styles.composeInput}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleComposeSubmit(); }}
                />
                {compose && (
                  <div style={styles.composeActions}>
                    <button onClick={() => navigate('/create', { state: { prefill: compose } })} style={styles.composeFull}>
                      📷 Add Image / Mood
                    </button>
                    <button onClick={handleComposeSubmit} style={styles.composePost}>
                      Post Thought
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading && posts.length === 0 ? (
            <div style={styles.loadingState}>
              {[1,2,3].map(n => <SkeletonCard key={n} />)}
            </div>
          ) : posts.length === 0 ? (
            <div style={styles.emptyState}>
              {tab === 1 ? (
                <>
                  <span style={{ fontSize: '48px' }}>👥</span>
                  <p style={{ color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>
                    {isGuest
                      ? 'Login to see posts from people you follow.'
                      : 'No posts here yet. Follow someone to see their posts in Following.'}
                  </p>
                  {isGuest ? (
                    <button onClick={() => navigate('/login')} style={styles.emptyBtn}>
                      Login
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <span style={{ fontSize: '48px' }}>📓</span>
                  <p style={{ color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>
                    No thoughts yet. Be the first to share!
                  </p>
                  {!isGuest && (
                    <button onClick={() => navigate('/create')} style={styles.emptyBtn}>
                      Share a Thought
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {posts.map(post => (
                <ThoughtCard
                  key={post.id}
                  post={post}
                  viewer={user}
                  onDelete={user?.id === post.userId ? handleDelete : undefined}
                />
              ))}
              {hasMore && !loading && (
                <button onClick={() => loadPosts()} style={styles.loadMore}>
                  Load more thoughts
                </button>
              )}
              {loading && <div style={{ textAlign: 'center', color: theme.colors.inkMuted, padding: '16px' }}>Loading…</div>}
            </>
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────
function RightSidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isGuest = !user
  const suggested = [
    { name: 'Karla Manalo', sub: '34 thoughts this week', initial: 'K' },
    { name: 'Ben Cruz', sub: 'Philosophy · Stoicism', initial: 'B' },
    { name: 'Lena Park', sub: 'Mindfulness · Wellness', initial: 'L' },
  ];
  const [followed, setFollowed] = useState({});
  const [query, setQuery] = useState('')
  const [userResults, setUserResults] = useState([])
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')

  const q = query.trim().toLowerCase()

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
          placeholder="Search users"
          style={styles.searchInput}
        />
      </div>

      {/* Who to follow */}
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

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: theme.colors.warmWhite, borderRadius: theme.radius.xl, padding: '18px', marginBottom: '12px', border: `1px solid ${theme.colors.border}` }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.colors.parchment }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, background: theme.colors.parchment, borderRadius: 4, width: '40%', marginBottom: 6 }} />
          <div style={{ height: 10, background: theme.colors.parchment, borderRadius: 4, width: '25%' }} />
        </div>
      </div>
      <div style={{ height: 12, background: theme.colors.parchment, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 12, background: theme.colors.parchment, borderRadius: 4, width: '80%', marginBottom: 8 }} />
      <div style={{ height: 12, background: theme.colors.parchment, borderRadius: 4, width: '60%' }} />
    </div>
  );
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
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  title: { fontFamily: theme.fonts.display, fontSize: '26px', fontWeight: '700', color: theme.colors.ink },
  tabs: {
    display: 'flex',
    gap: '2px',
    background: theme.colors.parchment,
    borderRadius: theme.radius.md,
    padding: '3px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: theme.radius.sm,
    border: 'none',
    background: 'transparent',
    color: theme.colors.inkMuted,
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: theme.transition,
    fontFamily: theme.fonts.body,
  },
  tabActive: {
    background: theme.colors.warmWhite,
    color: theme.colors.ink,
    fontWeight: '600',
    boxShadow: theme.shadows.sm,
  },
  errorBanner: {
    background: theme.colors.warmWhite,
    border: `1px solid ${theme.colors.rose}40`,
    borderRadius: theme.radius.lg,
    padding: '12px 14px',
    marginBottom: '16px',
  },
  retryBtn: {
    border: `1px solid ${theme.colors.border}`,
    background: 'transparent',
    borderRadius: theme.radius.sm,
    padding: '6px 10px',
    fontFamily: theme.fonts.body,
    fontSize: '12px',
    cursor: 'pointer',
    color: theme.colors.inkMuted,
  },
  guestBanner: {
    background: `linear-gradient(135deg, ${theme.colors.ink}, #2a1a08)`,
    borderRadius: theme.radius.xl,
    padding: '20px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: `1px solid ${theme.colors.amber}30`,
  },
  guestTitle: { fontFamily: theme.fonts.display, color: theme.colors.cream, fontSize: '15px', marginBottom: '4px' },
  guestSub: { color: '#a08060', fontSize: '12.5px', lineHeight: 1.5, fontFamily: theme.fonts.body },
  guestCta: {
    flexShrink: 0,
    padding: '9px 18px',
    background: theme.colors.amber,
    border: 'none',
    borderRadius: theme.radius.sm,
    fontSize: '13px',
    fontWeight: '600',
    color: theme.colors.ink,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
  },
  compose: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '14px 16px',
    marginBottom: '16px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.card,
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  composeInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    resize: 'none',
    fontFamily: theme.fonts.body,
    fontSize: '15px',
    color: theme.colors.ink,
    outline: 'none',
    lineHeight: 1.6,
  },
  composeActions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '10px',
    borderTop: `1px solid ${theme.colors.border}`,
    marginTop: '8px',
  },
  composeFull: {
    padding: '7px 14px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.sm,
    background: 'transparent',
    color: theme.colors.inkMuted,
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
  },
  composePost: {
    marginLeft: 'auto',
    padding: '8px 20px',
    background: theme.colors.amber,
    border: 'none',
    borderRadius: theme.radius.sm,
    fontSize: '13px',
    fontWeight: '600',
    color: theme.colors.ink,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
  },
  loadingState: { marginTop: '8px' },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  emptyBtn: {
    padding: '12px 24px',
    background: theme.colors.amber,
    border: 'none',
    borderRadius: theme.radius.md,
    fontSize: '14px',
    fontWeight: '600',
    color: theme.colors.ink,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
  },
  loadMore: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    fontSize: '13px',
    color: theme.colors.inkMuted,
    cursor: 'pointer',
    marginTop: '8px',
    fontFamily: theme.fonts.body,
    transition: theme.transition,
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
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    zIndex: 20000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '560px',
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: '0 24px 80px rgba(0,0,0,0.30)',
    padding: '22px 22px 18px',
    fontFamily: theme.fonts.body,
  },
  modalTitle: { fontFamily: theme.fonts.display, fontSize: '22px', fontWeight: 800, color: theme.colors.ink, marginBottom: '8px' },
  modalBody: { color: theme.colors.inkMuted, fontSize: '14px', lineHeight: 1.5, marginBottom: '18px' },
  modalActions: { display: 'flex', justifyContent: 'space-between', gap: '12px' },
  modalCancel: {
    padding: '10px 18px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    background: 'transparent',
    color: theme.colors.inkMuted,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    minWidth: '120px',
  },
  modalDanger: {
    padding: '10px 22px',
    border: 'none',
    borderRadius: theme.radius.md,
    background: theme.colors.amberDark,
    color: theme.colors.warmWhite,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    minWidth: '120px',
  },
};
