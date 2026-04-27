import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '@/core/components/Sidebar';
import ThoughtCard from '@/features/post/ThoughtCard';
import Avatar from '@/core/components/Avatar';
import Toast from '@/core/components/Toast';
import { useAuth } from '@/features/auth/useAuth';
import { postsApi, quotesApi, filesApi, userApi } from '@/core/api';

/* ── Warm Parchment ──────────────────────────────────────────
   #FFF8EE  warm ivory      — shell background
   #F5ECD4  parchment       — card/widget bg
   #EDE0C4  deep parchment  — surface hover
   #E8C97A  golden amber    — accent
   #C9A84C  amber dark      — links / active
   #3D2600  espresso        — primary text
   #7A6040  warm brown      — muted
   ─────────────────────────────────────────────────────────── */

const C = {
  bg:        '#FFF8EE',
  card:      '#ffffff',
  surface:   '#F5ECD4',
  surfaceHi: '#EDE0C4',
  border:    'rgba(197,162,100,0.28)',
  borderHov: 'rgba(197,162,100,0.5)',
  amber:     '#E8C97A',
  amberDark: '#C9A84C',
  ink:       '#3D2600',
  muted:     '#7A6040',
  mutedSoft: 'rgba(122,96,64,0.6)',
};

const TABS = ['For You', 'Following'];

export default function FeedPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const isGuest   = !user;

  const [posts,    setPosts]    = useState([]);
  const [quote,    setQuote]    = useState(null);
  const [tab,      setTab]      = useState(() => {
    const t = Number(new URLSearchParams(location.search).get('tab'));
    return Number.isFinite(t) && t >= 0 && t <= 1 ? t : 0;
  });
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [compose, setCompose] = useState('');
  const [toast,   setToast]   = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
      const p = JSON.parse(raw);
      if (p?.message) setToast({ message: String(p.message), type: p.type === 'error' ? 'error' : 'success' });
    } catch { setToast({ message: String(raw), type: 'success' }); }
  }, []);

  const loadPosts = useCallback(async (reset = false) => {
    const p = reset ? 0 : page;
    setLoading(true); setError('');
    try {
      const res = tab === 1
        ? (isGuest || user?.id == null ? { content: [], totalPages: 0 } : await postsApi.getFollowing(user.id, p, 10))
        : await postsApi.getAll(p, 10);
      setPosts(prev => reset ? res.content : [...prev, ...res.content]);
      setPage(p + 1);
      setHasMore(p + 1 < res.totalPages);
    } catch (e) {
      setError(e?.message || 'Failed to load posts.');
    } finally { setLoading(false); }
  }, [isGuest, page, tab, user?.id]);

  useEffect(() => {
    const t = Number(new URLSearchParams(location.search).get('tab'));
    const next = Number.isFinite(t) && t >= 0 && t <= 1 ? t : 0;
    setTab(prev => prev === next ? prev : next);
  }, [location.search]);

  useEffect(() => { loadPosts(true); }, [tab]);

  const handleDelete  = id  => setConfirmDeleteId(id);
  const confirmDelete = async () => {
    const id = confirmDeleteId; if (id == null) return;
    try {
      await postsApi.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      setToast({ message: 'Post deleted.', type: 'success' });
    } catch (e) {
      setToast({ message: e?.message || 'Failed to delete.', type: 'error' });
    } finally { setConfirmDeleteId(null); }
  };

  const handleComposeSubmit = () => {
    if (!compose.trim()) return;
    navigate('/create', { state: { prefill: compose } });
    setCompose('');
  };

  return (
    <div style={S.shell}>
      <style>{CSS}</style>
      <Toast message={toast?.message} type={toast?.type || 'success'} onClose={() => setToast(null)} />

      {/* Delete confirm modal */}
      {confirmDeleteId != null && (
        <div style={S.modalOverlay}>
          <div style={S.modalCard}>
            <div style={S.modalIcon}>🗑️</div>
            <h3 style={S.modalTitle}>Delete Post</h3>
            <p style={S.modalBody}>Are you sure you want to delete this post? This cannot be undone.</p>
            <div style={S.modalActions}>
              <button type="button" onClick={() => setConfirmDeleteId(null)} style={S.modalCancel}>Cancel</button>
              <button type="button" onClick={confirmDelete} style={S.modalDanger}>Delete Post</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.layout}>
        <Sidebar dailyQuote={quote} />

        {/* ── Main column ── */}
        <main style={S.main}>

          {/* Header */}
          <div style={S.header}>
            <div>
              <h1 style={S.title}>
                Your <span style={{ color:C.amberDark, fontStyle:'italic' }}>Feed</span>
              </h1>
              <p style={S.headerSub}>What's on people's minds today</p>
            </div>
            {!isGuest && (
              <button onClick={() => navigate('/create')} style={S.newPostBtn} className="dt-new-post">
                ✏️ New Thought
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={S.tabs}>
            {TABS.map((t, i) => (
              <button key={t}
                onClick={() => navigate(i === 0 ? '/feed' : `/feed?tab=${i}`)}
                style={{ ...S.tab, ...(tab === i ? S.tabActive : {}) }}>
                {t}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div style={S.errorBanner}>
              <span style={{ flex:1, color:C.ink, fontSize:13, fontFamily:"'Lora',serif" }}>{error}</span>
              <button onClick={() => loadPosts(true)} style={S.retryBtn}>Retry</button>
            </div>
          )}

          {/* Guest banner */}
          {isGuest && (
            <div style={S.guestBanner}>
              <div style={S.guestBannerLeft}>
                <div style={S.guestBannerIcon}>🔒</div>
                <div>
                  <h4 style={S.guestTitle}>Viewing as Guest</h4>
                  <p style={S.guestSub}>Sign in to like, comment, and share your own thoughts.</p>
                </div>
              </div>
              <button onClick={() => navigate('/login')} style={S.guestCta} className="dt-btn-primary">Login</button>
            </div>
          )}

          {/* Compose box */}
          {!isGuest && (
            <div style={S.compose}>
              <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" src={filesApi.getUrl(user?.avatarUrl)} onClick={() => navigate('/profile')} />
              <div style={{ flex:1 }}>
                <textarea
                  value={compose}
                  onChange={e => setCompose(e.target.value)}
                  placeholder="What's on your mind today?"
                  rows={compose.split('\n').length > 1 ? 3 : 1}
                  style={S.composeInput}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleComposeSubmit(); }}
                />
                {compose && (
                  <div style={S.composeActions}>
                    <button onClick={() => navigate('/create', { state: { prefill: compose } })} style={S.composeFull}>
                      📷 Add Image / Mood
                    </button>
                    <button onClick={handleComposeSubmit} style={S.composePost}>Post Thought</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Posts */}
          {loading && posts.length === 0 ? (
            <div style={{ marginTop:8 }}>
              {[1,2,3].map(n => <SkeletonCard key={n} />)}
            </div>
          ) : posts.length === 0 ? (
            <div style={S.empty}>
              <span style={{ fontSize:52 }}>{tab === 1 ? '👥' : '📓'}</span>
              <p style={S.emptyText}>
                {tab === 1
                  ? (isGuest ? 'Login to see posts from people you follow.' : 'Follow someone to see their posts here.')
                  : 'No thoughts yet. Be the first to share!'}
              </p>
              {isGuest ? (
                <button onClick={() => navigate('/login')} style={S.emptyBtn}>Login</button>
              ) : !isGuest && tab === 0 ? (
                <button onClick={() => navigate('/create')} style={S.emptyBtn}>Share a Thought</button>
              ) : null}
            </div>
          ) : (
            <>
              {posts.map(post => (
                <ThoughtCard key={post.id} post={post} viewer={user}
                  onDelete={user?.id === post.userId ? handleDelete : undefined} />
              ))}
              {hasMore && !loading && (
                <button onClick={() => loadPosts()} style={S.loadMore} className="dt-load-more">
                  Load more thoughts ↓
                </button>
              )}
              {loading && <p style={{ textAlign:'center', color:C.mutedSoft, padding:'16px', fontSize:13, fontFamily:"'Lora',serif" }}>Loading…</p>}
            </>
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

/* ─── Right Sidebar ──────────────────────────────────────── */
function RightSidebar() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isGuest   = !user;
  const suggested = [
    { name: 'Karla Manalo', sub: '34 thoughts this week', initial: 'K' },
    { name: 'Ben Cruz',     sub: 'Philosophy · Stoicism', initial: 'B' },
    { name: 'Lena Park',    sub: 'Mindfulness · Wellness', initial: 'L' },
  ];
  const [followed,     setFollowed]     = useState({});
  const [query,        setQuery]        = useState('');
  const [userResults,  setUserResults]  = useState([]);
  const [userLoading,  setUserLoading]  = useState(false);
  const [userError,    setUserError]    = useState('');
  const q = query.trim().toLowerCase();

  useEffect(() => {
    const text = query.trim();
    let ignore = false;
    const t = setTimeout(() => {
      if (!text) return;
      setUserLoading(true); setUserError('');
      userApi.search(text, { limit: 25 })
        .then(list => { if (!ignore) setUserResults(list); })
        .catch(e   => { if (!ignore) { setUserError(e?.message || 'Failed.'); setUserResults([]); } })
        .finally(()=> { if (!ignore) setUserLoading(false); });
    }, 250);
    return () => { ignore = true; clearTimeout(t); };
  }, [query]);

  const listUsers = q ? userResults : suggested;

  return (
    <aside style={S.rightBar}>
      {/* Search */}
      <div style={S.searchBox}>
        <span style={{ fontSize:13, opacity:0.5 }}>🔎</span>
        <input value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) { setUserResults([]); setUserLoading(false); setUserError(''); } }}
          placeholder="Search users"
          style={S.searchInput}
        />
      </div>

      {/* Who to follow widget */}
      <div style={S.widget}>
        <div style={S.widgetTitle}>👥 People to Follow</div>
        {userLoading ? (
          <p style={S.widgetEmpty}>Searching…</p>
        ) : userError ? (
          <p style={S.widgetEmpty}>{userError}</p>
        ) : listUsers.length === 0 ? (
          <p style={S.widgetEmpty}>No results.</p>
        ) : listUsers.map(u => {
          const id   = u?.id;
          const name = u?.firstName || u?.lastName
            ? `${u?.firstName || ''} ${u?.lastName || ''}`.trim()
            : (u?.name || u?.email || 'Unknown');
          const sub  = u?.sub || u?.email || '';
          const key  = id != null ? `u:${id}` : `s:${name}`;
          const fk   = id != null ? String(id) : name;
          return (
            <div key={key} style={S.suggestRow}>
              <div onClick={() => id != null && navigate(`/profile/${id}`)}
                style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0, cursor: id != null ? 'pointer' : 'default' }}>
                <Avatar name={name} src={u?.avatarUrl} size="sm" />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={S.suggestName}>{name}</p>
                  <p style={S.suggestSub}>{sub}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (id == null) return;
                  if (isGuest) { navigate('/login'); return; }
                  try {
                    const res = await userApi.toggleFollow(id, user?.id ?? null);
                    setFollowed(f => ({ ...f, [fk]: !!res.following }));
                  } catch (e) { alert(e?.message || 'Failed.'); }
                }}
                style={{
                  ...S.followBtn,
                  background: followed[fk] ? 'rgba(200,168,76,0.15)' : 'transparent',
                  color:      followed[fk] ? C.amberDark : C.amberDark,
                  borderColor: C.amber,
                }}>
                {followed[fk] ? '✓ Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background:C.card, borderRadius:16, padding:'18px', marginBottom:12, border:`1px solid ${C.border}`, boxShadow:'0 1px 8px rgba(61,38,0,0.04)' }}>
      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:C.surface }} />
        <div style={{ flex:1 }}>
          <div style={{ height:11, background:C.surface, borderRadius:4, width:'38%', marginBottom:7 }} />
          <div style={{ height:10, background:C.surface, borderRadius:4, width:'22%' }} />
        </div>
      </div>
      {[100,80,60].map(w => <div key={w} style={{ height:11, background:C.surface, borderRadius:4, width:`${w}%`, marginBottom:8 }} />)}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  shell: { minHeight:'100vh', background:C.bg, fontFamily:"'Lora','Georgia',serif" },
  layout: { width:'100%', maxWidth:1240, margin:'0 auto', padding:'28px 16px', display:'flex', alignItems:'flex-start', justifyContent:'center', gap:18 },
  main: { flex:'0 1 640px', minWidth:0 },

  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 },
  title: { fontFamily:"'Playfair Display','Georgia',serif", fontSize:26, fontWeight:700, color:C.ink, marginBottom:3 },
  headerSub: { fontSize:13, color:C.mutedSoft },
  newPostBtn: { padding:'10px 20px', background:`linear-gradient(135deg,${C.amber},${C.amberDark})`, border:'none', borderRadius:50, fontSize:13, fontWeight:700, color:C.ink, cursor:'pointer', boxShadow:`0 3px 14px rgba(200,160,60,0.3)`, transition:'all 0.2s', fontFamily:"'Lora',serif", whiteSpace:'nowrap' },

  tabs: { display:'flex', gap:2, background:C.surface, borderRadius:12, padding:3, marginBottom:20 },
  tab: { flex:1, padding:'8px 12px', borderRadius:10, border:'none', background:'transparent', color:C.mutedSoft, fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.2s', fontFamily:"'Lora',serif" },
  tabActive: { background:C.card, color:C.ink, fontWeight:700, boxShadow:'0 1px 8px rgba(61,38,0,0.07)', border:`1px solid ${C.border}` },

  errorBanner: { background:C.card, border:`1px solid rgba(192,57,43,0.2)`, borderRadius:14, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 },
  retryBtn: { padding:'6px 14px', border:`1px solid ${C.border}`, background:'transparent', borderRadius:8, fontFamily:"'DM Mono',monospace", fontSize:11.5, cursor:'pointer', color:C.muted },

  guestBanner: { background:C.surface, border:`1.5px solid rgba(197,162,100,0.35)`, borderRadius:18, padding:'18px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', boxShadow:'0 4px 18px rgba(61,38,0,0.06)' },
  guestBannerLeft: { display:'flex', alignItems:'center', gap:14, flex:1 },
  guestBannerIcon: { width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${C.surface},${C.surfaceHi})`, border:`1.5px solid rgba(197,162,100,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 },
  guestTitle: { fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:C.ink, marginBottom:3 },
  guestSub: { fontSize:12.5, color:C.mutedSoft, lineHeight:1.5 },
  guestCta: { flexShrink:0, padding:'10px 22px', background:`linear-gradient(135deg,${C.amber},${C.amberDark})`, border:'none', borderRadius:50, fontSize:13, fontWeight:700, color:C.ink, cursor:'pointer', boxShadow:`0 3px 12px rgba(200,160,60,0.25)`, fontFamily:"'Lora',serif" },

  compose: { background:C.card, borderRadius:18, padding:'14px 16px', marginBottom:16, border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(61,38,0,0.05)', display:'flex', gap:12, alignItems:'flex-start' },
  composeInput: { width:'100%', border:'none', background:'transparent', resize:'none', fontFamily:"'Lora','Georgia',serif", fontSize:15, color:C.ink, outline:'none', lineHeight:1.6 },
  composeActions: { display:'flex', gap:8, paddingTop:10, borderTop:`1px solid ${C.border}`, marginTop:8 },
  composeFull: { padding:'7px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, background:'transparent', color:C.mutedSoft, fontSize:12, cursor:'pointer', fontFamily:"'Lora',serif" },
  composePost: { marginLeft:'auto', padding:'8px 20px', background:`linear-gradient(135deg,${C.amber},${C.amberDark})`, border:'none', borderRadius:50, fontSize:13, fontWeight:700, color:C.ink, cursor:'pointer', fontFamily:"'Lora',serif" },

  empty: { textAlign:'center', padding:'60px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 },
  emptyText: { color:C.mutedSoft, fontSize:14, maxWidth:300, lineHeight:1.6 },
  emptyBtn: { padding:'12px 28px', background:`linear-gradient(135deg,${C.amber},${C.amberDark})`, border:'none', borderRadius:50, fontSize:14, fontWeight:700, color:C.ink, cursor:'pointer', boxShadow:`0 4px 16px rgba(200,160,60,0.3)`, fontFamily:"'Lora',serif" },
  loadMore: { width:'100%', padding:'13px', background:'transparent', border:`1.5px solid ${C.border}`, borderRadius:14, fontSize:13, color:C.muted, cursor:'pointer', marginTop:8, fontFamily:"'Lora',serif", transition:'all 0.2s' },

  rightBar: { width:280, flexShrink:0, position:'sticky', top:24, maxHeight:'calc(100vh - 48px)', overflowY:'auto' },
  searchBox: { background:C.card, borderRadius:50, border:`1px solid ${C.border}`, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10, boxShadow:'0 1px 8px rgba(61,38,0,0.04)' },
  searchInput: { width:'100%', border:'none', outline:'none', fontFamily:"'Lora',serif", fontSize:13, color:C.ink, background:'transparent' },
  widget: { background:C.card, borderRadius:18, padding:'16px', marginBottom:14, border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(61,38,0,0.05)' },
  widgetTitle: { fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1.5, marginBottom:14, fontFamily:"'DM Mono',monospace" },
  widgetEmpty: { color:C.mutedSoft, fontSize:12, fontFamily:"'Lora',serif" },
  suggestRow: { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:`1px solid rgba(197,162,100,0.12)` },
  suggestName: { fontSize:13, fontWeight:600, color:C.ink, fontFamily:"'Lora',serif" },
  suggestSub: { fontSize:11, color:C.mutedSoft, fontFamily:"'Lora',serif" },
  followBtn: { padding:'5px 14px', border:`1.5px solid ${C.amber}`, borderRadius:50, fontSize:11.5, fontWeight:600, cursor:'pointer', transition:'all 0.2s', fontFamily:"'Lora',serif", whiteSpace:'nowrap' },

  modalOverlay: { position:'fixed', inset:0, background:'rgba(61,38,0,0.35)', zIndex:20000, display:'flex', alignItems:'center', justifyContent:'center', padding:18, backdropFilter:'blur(4px)' },
  modalCard: { width:'100%', maxWidth:440, background:C.card, borderRadius:22, border:`1px solid ${C.border}`, boxShadow:'0 24px 80px rgba(61,38,0,0.2)', padding:'28px 28px 24px', fontFamily:"'Lora',serif" },
  modalIcon: { fontSize:32, marginBottom:14 },
  modalTitle: { fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.ink, marginBottom:8 },
  modalBody: { color:C.mutedSoft, fontSize:14, lineHeight:1.6, marginBottom:24 },
  modalActions: { display:'flex', justifyContent:'flex-end', gap:12 },
  modalCancel: { padding:'10px 20px', border:`1.5px solid ${C.border}`, borderRadius:12, background:'transparent', color:C.muted, fontWeight:600, cursor:'pointer', fontFamily:"'Lora',serif", fontSize:13 },
  modalDanger: { padding:'10px 24px', border:'none', borderRadius:12, background:C.ink, color:C.surface, fontWeight:700, cursor:'pointer', fontFamily:"'Lora',serif", fontSize:13, boxShadow:`0 3px 12px rgba(61,38,0,0.25)` },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
  .dt-new-post:hover { transform: translateY(-1px) !important; box-shadow: 0 6px 22px rgba(200,160,60,0.4) !important; }
  .dt-btn-primary:hover { transform: translateY(-1px) !important; }
  .dt-load-more:hover { background: #F5ECD4 !important; border-color: rgba(197,162,100,0.5) !important; color: #3D2600 !important; }
  textarea::placeholder { color: rgba(122,96,64,0.35) !important; }
  input::placeholder { color: rgba(122,96,64,0.3) !important; }
`;