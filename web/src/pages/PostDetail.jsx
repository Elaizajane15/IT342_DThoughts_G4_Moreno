import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { postsApi, quotesApi, filesApi, userApi } from '../utils/api';
import { theme } from '../theme';

export default function PostDetailPage() {
  const { id }            = useParams();
  const navigate          = useNavigate();
  const location          = useLocation();
  const { user } = useAuth();
  const isGuest = !user;

  const [post,     setPost]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [quote,    setQuote]    = useState(null);
  const [liked,    setLiked]    = useState(false);
  const [likeCount,setLikeCount]= useState(0);
  const [comments, setComments] = useState([]);
  const [comment,  setComment]  = useState('');
  const [toast,    setToast]    = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const commentRef = useRef(null);

  const postId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError('');
      try {
        if (postId == null) throw new Error('Invalid post id');

        const initialPost = location.state?.post;
        if (initialPost && Number(initialPost.id) === postId) {
          setPost(initialPost);
          return;
        }

        let found = null;
        let page = 0;
        let totalPages = 1;

        while (!found && page < totalPages && page < 10) {
          const res = await postsApi.getAll(page, 50);
          totalPages = res.totalPages || 1;
          found = res.content.find(p => Number(p.id) === postId) || null;
          page += 1;
        }

        if (!found) throw new Error('Not found');
        setPost(found);
      } catch {
        setError('Could not load this post.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, location.state, postId]);
  
  useEffect(() => {
    quotesApi.getDailyQuote()
      .then(setQuote)
      .catch(() => setQuote(null));
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

  useEffect(() => {
    if (postId == null) return;
    let cancelled = false;

    const load = async () => {
      try {
        const userId = isGuest ? null : user?.id ?? null;
        const [likes, saves, list] = await Promise.all([
          postsApi.getLikeStatus(postId, userId),
          postsApi.getSaveStatus(postId, userId),
          postsApi.getComments(postId),
        ]);
        if (cancelled) return;
        setLiked(!!likes.liked);
        setLikeCount(likes.likeCount);
        setIsSaved(!!saves.saved);
        setComments(list);
      } catch {
        if (cancelled) return;
        setLiked(false);
        setLikeCount(0);
        setIsSaved(false);
        setComments([]);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isGuest, postId, user?.id]);

  useEffect(() => {
    if (isGuest) return
    if (post?.userId == null) return
    if (user?.id == null) return
    if (Number(user.id) === Number(post.userId)) return
    let cancelled = false
    userApi.getFollowStatus(post.userId, user.id)
      .then((res) => { if (!cancelled) setIsFollowing(!!res.following) })
      .catch(() => { if (!cancelled) setIsFollowing(false) })
    return () => { cancelled = true }
  }, [isGuest, post?.userId, user?.id])

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const toggleLike = async () => {
    if (isGuest) { navigate('/login'); return; }
    if (postId == null) return;
    try {
      const res = await postsApi.toggleLike(postId, user?.id ?? null);
      setLiked(!!res.liked);
      setLikeCount(res.likeCount);
    } catch {
      alert('Failed to like post.');
    }
  };

  const toggleSave = async () => {
    if (isGuest) { navigate('/login'); return; }
    if (postId == null) return;
    try {
      const res = await postsApi.toggleSave(postId, user?.id ?? null);
      setIsSaved(!!res.saved);
    } catch {
      alert('Failed to save post.');
    }
  };

  const toggleFollow = async () => {
    if (isGuest) { navigate('/login'); return; }
    if (post?.userId == null) return
    try {
      const res = await userApi.toggleFollow(post.userId, user?.id ?? null)
      setIsFollowing(!!res.following)
    } catch {
      alert('Failed to follow user.')
    }
  }

  const submitComment = async () => {
    if (isGuest) { navigate('/login'); return; }
    if (postId == null) return;
    const text = comment.trim();
    if (!text) return;
    try {
      const created = await postsApi.addComment(postId, { userId: user?.id ?? null, content: text });
      setComments((prev) => [created, ...prev]);
      setComment('');
    } catch {
      alert('Failed to add comment.');
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (postId == null) return;
    try {
      await postsApi.delete(postId);
      sessionStorage.removeItem('dt_after_publish_post_id');
      sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Post deleted.', type: 'success' }));
      navigate('/feed', { replace: true });
    } catch (e) {
      setToast({ message: e?.message || 'Failed to delete post.', type: 'error' });
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const toastEl = (
    <Toast message={toast?.message} type={toast?.type || 'success'} onClose={() => setToast(null)} />
  );

  const confirmEl = confirmDeleteOpen && (
    <div style={styles.modalOverlay} role="dialog" aria-modal="true">
      <div style={styles.modalCard}>
        <div style={styles.modalTitle}>Delete Post</div>
        <div style={styles.modalBody}>Are you sure you want to delete this post?</div>
        <div style={styles.modalActions}>
          <button type="button" onClick={() => setConfirmDeleteOpen(false)} style={styles.modalCancel}>
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} style={styles.modalDanger}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={styles.shell}>
      {toastEl}
      {confirmEl}
      <div style={styles.layout}>
        <Sidebar dailyQuote={quote} />
        <div style={styles.main}>
          <div style={styles.loading}>Loading…</div>
        </div>
        <aside style={styles.rightSpacer} />
      </div>
    </div>
  );

  if (error || !post) return (
    <div style={styles.shell}>
      {toastEl}
      {confirmEl}
      <div style={styles.layout}>
        <Sidebar dailyQuote={quote} />
        <div style={styles.main}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
          <div style={styles.errorMsg}>{error || 'Post not found.'}</div>
        </div>
        <aside style={styles.rightSpacer} />
      </div>
    </div>
  );

  const name = post.userName || 'Daily User';
  const isOwner = !isGuest && user?.id != null && post?.userId != null && Number(user.id) === Number(post.userId)
  const handle = String(name).trim().toLowerCase().replace(/\s+/g, '')

  return (
    <div style={styles.shell}>
      {toastEl}
      {confirmEl}
      <div style={styles.layout}>
        <Sidebar dailyQuote={quote} />
        <main style={styles.main}>
          <button onClick={() => navigate('/feed')} style={styles.backBtn}>← Back to Feed</button>

          <div style={styles.postCard}>
            <div style={styles.headerRow}>
              <div
                style={styles.authorRow}
                onClick={() => navigate(post?.userId != null ? `/profile/${post.userId}` : '/profile')}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  navigate(post?.userId != null ? `/profile/${post.userId}` : '/profile')
                }}
                tabIndex={0}
                role="button"
              >
                <Avatar name={name} size="md" src={filesApi.getUrl(post?.userAvatarUrl)} />
                <div style={{ minWidth: 0 }}>
                  <div style={styles.authorName}>{name}</div>
                  <div style={styles.authorMeta}>@{handle} · USER</div>
                </div>
              </div>

              {!isGuest && !isOwner && (
                <button
                  type="button"
                  onClick={toggleFollow}
                  style={styles.followBtn}
                >
                  {isFollowing ? 'Following ✓' : 'Follow'}
                </button>
              )}

              {!isGuest && isOwner && (
                <div style={styles.ownerActions}>
                  <button type="button" onClick={() => navigate(`/edit/${post.id}`, { state: { post } })} style={styles.ownerBtn}>
                    Edit
                  </button>
                  <button type="button" onClick={handleDelete} style={{ ...styles.ownerBtn, color: theme.colors.rose }}>
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div style={styles.postText}>{post.text}</div>

            {post.imagePath && (
              <div style={styles.heroImageWrap}>
                <img src={filesApi.getUrl(post.imagePath)} alt="" style={styles.heroImage} />
              </div>
            )}

            <div style={styles.metaRow}>
              <span style={styles.metaItem}>📅 {formatDate(post.createdAt)}</span>
            </div>

            <div style={styles.divider} />

            <div style={styles.actionRow}>
              <div style={styles.leftActions}>
                <button type="button" onClick={toggleLike} style={{ ...styles.pillBtn, ...(liked ? styles.pillBtnActive : {}) }}>
                  ❤️ {likeCount || 0} Likes
                </button>
                <button type="button" onClick={() => commentRef.current?.focus()} style={styles.pillBtn}>
                  💬 {comments.length || 0} Comments
                </button>
              </div>

              <div style={styles.rightActions}>
                <button type="button" onClick={toggleSave} style={styles.smallBtn}>
                  🔖 {isSaved ? 'Saved' : 'Save'}
                </button>
                <button type="button" onClick={() => navigator.clipboard.writeText(window.location.href)} style={styles.smallBtn}>
                  ↗️ Share
                </button>
              </div>
            </div>
          </div>

          <div style={styles.commentsSection}>
            <div style={styles.commentsTitle}>{comments.length || 0} Comments</div>

            {isGuest ? (
              <button type="button" onClick={() => navigate('/login')} style={styles.loginCta}>
                Login to like and comment
              </button>
            ) : (
              <div style={styles.commentCompose}>
                <Avatar
                  name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'}
                  src={filesApi.getUrl(user?.avatarUrl)}
                  size="sm"
                />
                <textarea
                  ref={commentRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a thoughtful comment…"
                  rows={1}
                  style={styles.commentInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitComment()
                    }
                  }}
                />
                <button type="button" onClick={submitComment} disabled={!comment.trim()} style={styles.postCommentBtn}>
                  Post
                </button>
              </div>
            )}

            {comments.length === 0 ? (
              <div style={styles.emptyComments}>No comments yet.</div>
            ) : (
              <div style={styles.commentList}>
                {comments.map((c) => (
                  <div key={c.id} style={styles.commentItem}>
                    <Avatar name={c.userName || 'User'} size="sm" src={filesApi.getUrl(c.userAvatarUrl)} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={styles.commentHeader}>
                        <div style={styles.commentName}>
                          {c.userName || 'User'}
                          <span style={styles.commentTime}> · {formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                      <div style={styles.commentText}>{c.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <aside style={styles.rightSpacer} />
      </div>
    </div>
  );
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
  rightSpacer: { width: '280px', flexShrink: 0 },
  loading: { padding: '32px', textAlign: 'center', color: theme.colors.inkMuted, fontFamily: theme.fonts.body },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: theme.colors.inkMuted,
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '20px',
    fontFamily: theme.fonts.body,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  errorMsg: {
    background: theme.colors.warmWhite,
    border: `1px solid ${theme.colors.rose}40`,
    borderRadius: theme.radius.lg,
    padding: '14px',
    color: theme.colors.rose,
    fontFamily: theme.fonts.body,
  },
  postCard: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.card,
    padding: '24px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '12px',
  },
  authorRow: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
  authorName: {
    fontFamily: theme.fonts.display,
    fontSize: '16px',
    fontWeight: 800,
    color: theme.colors.ink,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '360px',
  },
  authorMeta: { fontFamily: theme.fonts.body, fontSize: '12px', color: theme.colors.inkMuted, marginTop: '4px' },
  followBtn: {
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.full,
    padding: '8px 14px',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    color: theme.colors.ink,
    whiteSpace: 'nowrap',
  },
  ownerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  ownerBtn: {
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.full,
    padding: '8px 14px',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    color: theme.colors.inkMuted,
    whiteSpace: 'nowrap',
  },
  postText: { color: theme.colors.ink, fontFamily: theme.fonts.body, fontSize: '17px', lineHeight: 1.8 },
  heroImageWrap: {
    marginTop: '18px',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.parchment,
  },
  heroImage: { width: '100%', height: 'auto', display: 'block', objectFit: 'cover' },
  metaRow: { marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '14px', color: theme.colors.inkMuted },
  metaItem: { fontFamily: theme.fonts.body, fontSize: '12.5px' },
  divider: { height: '1px', background: theme.colors.border, opacity: 0.9, marginTop: '16px' },
  actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '14px' },
  leftActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  rightActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  pillBtn: {
    border: `1.5px solid ${theme.colors.border}`,
    background: 'transparent',
    borderRadius: theme.radius.md,
    padding: '10px 14px',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    color: theme.colors.inkMuted,
  },
  pillBtnActive: { borderColor: theme.colors.rose, background: theme.colors.rosePale, color: theme.colors.rose },
  smallBtn: {
    border: `1.5px solid ${theme.colors.border}`,
    background: 'transparent',
    borderRadius: theme.radius.md,
    padding: '10px 14px',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    color: theme.colors.inkMuted,
  },
  commentsSection: { marginTop: '22px' },
  commentsTitle: { fontFamily: theme.fonts.display, fontSize: '20px', fontWeight: 800, color: theme.colors.ink, marginBottom: '12px' },
  commentCompose: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    padding: '12px 12px',
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.warmWhite,
  },
  commentInput: {
    flex: 1,
    border: 'none',
    borderRadius: theme.radius.md,
    padding: '10px 10px',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    outline: 'none',
    resize: 'none',
    background: 'transparent',
    color: theme.colors.ink,
  },
  postCommentBtn: {
    padding: '9px 16px',
    borderRadius: theme.radius.lg,
    border: 'none',
    background: theme.colors.amberDark,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    fontWeight: 700,
    color: theme.colors.warmWhite,
  },
  emptyComments: { marginTop: '12px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body, fontSize: '13px' },
  commentList: { marginTop: '14px' },
  commentItem: {
    display: 'flex',
    gap: '10px',
    padding: '14px 0',
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  commentHeader: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' },
  commentName: { fontFamily: theme.fonts.body, fontSize: '13px', fontWeight: 800, color: theme.colors.ink },
  commentTime: { fontFamily: theme.fonts.body, fontSize: '12px', color: theme.colors.inkMuted, fontWeight: 400 },
  commentText: { marginTop: '2px', fontFamily: theme.fonts.body, fontSize: '13px', color: theme.colors.ink, lineHeight: 1.55 },
  loginCta: {
    marginTop: '14px',
    padding: '9px 14px',
    borderRadius: theme.radius.sm,
    border: 'none',
    background: theme.colors.amber,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    fontWeight: 600,
    color: theme.colors.ink,
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
