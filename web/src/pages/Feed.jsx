import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ThoughtCard from '../components/ThoughtCard';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { postsApi, quotesApi } from '../utils/api';
import { theme } from '../theme';

const TABS = ['For You', 'Following', 'Trending'];

export default function FeedPage() {
  const navigate         = useNavigate();
  const { user } = useAuth();
  const isGuest = !user;

  const [posts,     setPosts]     = useState([]);
  const [quote,     setQuote]     = useState(null);
  const [tab,       setTab]       = useState(0);
  const [page,      setPage]      = useState(0);
  const [hasMore,   setHasMore]   = useState(true);
  const [loading,   setLoading]   = useState(true);
  const [compose,   setCompose]   = useState('');

  // Fetch daily quote
  useEffect(() => {
    quotesApi.getDailyQuote()
      .then(setQuote)
      .catch(() => setQuote({ quoteText: 'Every day is a new page in your story.', author: 'DailyThoughts' }));
  }, []);

  // Fetch posts
  const loadPosts = useCallback(async (reset = false) => {
    const p = reset ? 0 : page;
    setLoading(true);
    try {
      const res = await postsApi.getAll(p, 10);
      setPosts(prev => reset ? res.content : [...prev, ...res.content]);
      setPage(p + 1);
      setHasMore(p + 1 < res.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadPosts(true); }, [tab, loadPosts]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this thought?')) return;
    await postsApi.delete(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleComposeSubmit = () => {
    if (!compose.trim()) return;
    navigate('/create', { state: { prefill: compose } });
    setCompose('');
  };

  return (
    <div style={styles.shell}>
      <Sidebar dailyQuote={quote} notifCount={3} />

      {/* Main Feed */}
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            Your <span style={{ color: theme.colors.amber }}>Feed</span>
          </h1>
        </div>

        {/* Tab bar */}
        <div style={styles.tabs}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              style={{ ...styles.tab, ...(tab === i ? styles.tabActive : {}) }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Guest banner */}
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

        {/* Compose box — only for logged-in users */}
        {!isGuest && (
          <div style={styles.compose}>
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" src={user?.avatarUrl} />
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

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div style={styles.loadingState}>
            {[1,2,3].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '48px' }}>📓</span>
            <p style={{ color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>
              No thoughts yet. Be the first to share!
            </p>
            {!isGuest && (
              <button onClick={() => navigate('/create')} style={styles.emptyBtn}>
                Share a Thought
              </button>
            )}
          </div>
        ) : (
          <>
            {posts.map(post => (
              <ThoughtCard
                key={post.id}
                post={post}
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

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────
function RightSidebar() {
  const trending = [
    { name: 'Morning Routine', count: '142 thoughts today' },
    { name: 'Gratitude Journal', count: '98 thoughts today' },
    { name: 'Mindfulness', count: '76 thoughts today' },
    { name: 'Self Reflection', count: '61 thoughts today' },
  ];
  const suggested = [
    { name: 'Karla Manalo', sub: '34 thoughts this week', initial: 'K' },
    { name: 'Ben Cruz', sub: 'Philosophy · Stoicism', initial: 'B' },
    { name: 'Lena Park', sub: 'Mindfulness · Wellness', initial: 'L' },
  ];
  const [followed, setFollowed] = useState({});

  return (
    <aside style={styles.rightBar}>
      {/* Trending */}
      <div style={styles.widget}>
        <div style={styles.widgetTitle}>📈 Trending Topics</div>
        {trending.map((t, i) => (
          <div key={t.name} style={styles.trendRow}>
            <span style={styles.trendNum}>{i + 1}</span>
            <div>
              <div style={styles.trendName}>{t.name}</div>
              <div style={styles.trendCount}>{t.count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Who to follow */}
      <div style={styles.widget}>
        <div style={styles.widgetTitle}>👥 People to Follow</div>
        {suggested.map((s) => (
          <div key={s.name} style={styles.suggestRow}>
            <Avatar name={s.name} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.suggestName}>{s.name}</div>
              <div style={styles.suggestSub}>{s.sub}</div>
            </div>
            <button
              onClick={() => setFollowed(f => ({ ...f, [s.name]: !f[s.name] }))}
              style={{
                ...styles.followBtn,
                background: followed[s.name] ? theme.colors.amberPale : 'transparent',
                color: followed[s.name] ? theme.colors.amberDark : theme.colors.amber,
              }}
            >
              {followed[s.name] ? '✓ Following' : 'Follow'}
            </button>
          </div>
        ))}
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
  shell: { display: 'flex', minHeight: '100vh', background: theme.colors.cream },
  main: { flex: 1, padding: '24px', maxWidth: '640px', minWidth: 0 },
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
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    '@media(max-width:900px)': { display: 'none' },
  },
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
};
