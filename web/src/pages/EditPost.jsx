import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { postsApi, filesApi } from '../utils/api';
import { theme } from '../theme';

const MAX_CHARS = 500;

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isGuest = !user;
  const fileInputRef = useRef(null);

  const postId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  const [post, setPost] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (isGuest) return;
    if (postId == null) {
      setLoading(false);
      setError('Invalid post id.');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const initialPost = location.state?.post;
        if (initialPost && Number(initialPost.id) === postId) {
          if (cancelled) return;
          setPost(initialPost);
          setContent(String(initialPost.text ?? initialPost.content ?? ''));
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

        if (!found) throw new Error('Post not found.');
        if (cancelled) return;
        setPost(found);
        setContent(String(found.text ?? ''));
      } catch (e) {
        if (cancelled) return;
        const msg = e?.message || 'Could not load this post.';
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isGuest, location.state, postId]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDropzone = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } };
      handleImageSelect(fakeEvent);
    }
  };

  const handleUpdate = async (e) => {
    e?.preventDefault?.();
    if (isGuest) { navigate('/login'); return; }
    if (postId == null) return;
    const text = content.trim();
    if (!text) { setError('Please write something before saving.'); return; }
    if (isOverLimit) { setError(`Content exceeds ${MAX_CHARS} characters.`); return; }

    setSaving(true);
    setError('');
    try {
      let updated = await postsApi.update(postId, { content: text });
      if (imageFile) {
        updated = await filesApi.upload(postId, imageFile);
      }
      sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Post updated successfully.', type: 'success' }));
      navigate(`/post/${postId}`, { replace: true, state: { post: updated } });
    } catch (e2) {
      const msg = e2?.message || 'Failed to update post.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.shell}>
      <Toast message={toast?.message} type={toast?.type || 'success'} onClose={() => setToast(null)} />
      <div style={styles.layout}>
        <Sidebar />

        <main style={styles.main}>
          <button type="button" onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>

          <div style={styles.card}>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>Edit Thought</h1>
              <div
                style={{
                  ...styles.charCount,
                  color: isOverLimit ? theme.colors.rose : charsLeft < 50 ? theme.colors.amber : theme.colors.inkMuted,
                }}
              >
                <span style={{ fontWeight: isOverLimit ? '700' : '400' }}>{content.length}</span> / {MAX_CHARS}
              </div>
            </div>

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            {loading ? (
              <div style={styles.loading}>Loading…</div>
            ) : (
              <form onSubmit={handleUpdate}>
                <div style={styles.composeArea}>
                  <Avatar name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'} src={filesApi.getUrl(user?.avatarUrl)} size="md" />
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Update your thought…"
                    style={{
                      ...styles.textarea,
                      borderColor: isOverLimit ? theme.colors.rose : 'transparent',
                    }}
                    autoFocus
                  />
                </div>

                <div style={styles.section}>
                  <div style={styles.sectionLabel}>Attach an image (optional)</div>

                  {imagePreview ? (
                    <div style={styles.previewWrap}>
                      <img src={imagePreview} alt="Preview" style={styles.preview} />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        style={styles.removeImg}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : post?.imagePath ? (
                    <div style={styles.previewWrap}>
                      <img src={filesApi.getUrl(post.imagePath)} alt="Current" style={styles.preview} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={styles.replaceImg}
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <div
                      style={styles.dropzone}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleDropzone}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = theme.colors.amber;
                        e.currentTarget.style.background = theme.colors.amberPale;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = theme.colors.border;
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={styles.dropzoneIcon}>🖼️</div>
                      <div style={styles.dropzoneText}>
                        Drop an image here or <span style={{ color: theme.colors.amberDark, fontWeight: 600 }}>browse files</span>
                      </div>
                      <div style={styles.dropzoneHint}>JPG, PNG, WebP · Max 5MB</div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />
                </div>

                <div style={styles.footer}>
                  <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !content.trim() || isOverLimit} style={styles.saveBtn}>
                    {saving ? 'Saving…' : 'Save Changes →'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div style={styles.tips}>
            <div style={styles.tipsTitle}>✨ Writing Tips</div>
            <ul style={styles.tipsList}>
              <li>Keep it clear and authentic.</li>
              <li>Short edits can make your thought stronger.</li>
              <li>Read it once before saving.</li>
            </ul>
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
  card: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '28px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.card,
    marginBottom: '16px',
  },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' },
  title: { fontFamily: theme.fonts.display, fontSize: '22px', fontWeight: '700', color: theme.colors.ink, margin: 0 },
  charCount: { fontFamily: theme.fonts.mono, fontSize: '12px', transition: theme.transition, whiteSpace: 'nowrap' },
  errorBox: {
    background: theme.colors.rosePale,
    border: `1px solid ${theme.colors.rose}40`,
    borderRadius: theme.radius.sm,
    padding: '10px 14px',
    fontSize: '13px',
    color: theme.colors.rose,
    marginBottom: '16px',
    fontFamily: theme.fonts.body,
  },
  loading: { padding: '32px', textAlign: 'center', color: theme.colors.inkMuted, fontFamily: theme.fonts.body },
  composeArea: {
    display: 'flex',
    gap: '14px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  textarea: {
    flex: 1,
    border: '2px solid transparent',
    borderRadius: theme.radius.md,
    background: theme.colors.cream,
    padding: '12px',
    resize: 'vertical',
    fontFamily: theme.fonts.display,
    fontSize: '18px',
    color: theme.colors.ink,
    outline: 'none',
    minHeight: '160px',
    lineHeight: 1.7,
    transition: theme.transition,
  },
  section: { marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${theme.colors.border}` },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: theme.colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    fontFamily: theme.fonts.mono,
  },
  dropzone: {
    border: `2px dashed ${theme.colors.border}`,
    borderRadius: theme.radius.xl,
    padding: '36px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: theme.transition,
  },
  dropzoneIcon: { fontSize: '36px', marginBottom: '10px' },
  dropzoneText: { fontSize: '14px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body, marginBottom: '4px' },
  dropzoneHint: { fontSize: '12px', color: theme.colors.border, fontFamily: theme.fonts.mono },
  previewWrap: { position: 'relative', borderRadius: theme.radius.lg, overflow: 'hidden', maxHeight: '300px' },
  preview: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  removeImg: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(26,18,8,0.8)',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: theme.radius.full,
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: theme.fonts.body,
  },
  replaceImg: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(15, 23, 42, 0.85)',
    border: 'none',
    color: theme.colors.warmWhite,
    padding: '6px 12px',
    borderRadius: theme.radius.full,
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: theme.fonts.body,
    fontWeight: 700,
  },
  footer: { display: 'flex', justifyContent: 'space-between', gap: '12px' },
  cancelBtn: {
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
  saveBtn: {
    padding: '10px 22px',
    border: 'none',
    borderRadius: theme.radius.md,
    background: theme.colors.amber,
    color: theme.colors.ink,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    minWidth: '120px',
  },
  tips: {
    background: theme.colors.parchment,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.xl,
    padding: '18px 18px',
  },
  tipsTitle: {
    fontFamily: theme.fonts.display,
    fontSize: '14px',
    fontWeight: 800,
    color: theme.colors.ink,
    marginBottom: '10px',
  },
  tipsList: {
    margin: 0,
    paddingLeft: '18px',
    color: theme.colors.inkMuted,
    fontSize: '13px',
    lineHeight: 1.7,
    fontFamily: theme.fonts.body,
  },
};
