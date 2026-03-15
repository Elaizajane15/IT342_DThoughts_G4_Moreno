import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { postsApi, filesApi, draftsApi, userApi } from '../utils/api';
import { theme } from '../theme';

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🤔', label: 'Reflective' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '💪', label: 'Motivated' },
  { emoji: '😌', label: 'Peaceful' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🎉', label: 'Excited' },
  { emoji: '😴', label: 'Tired' },
];

const MAX_CHARS = 500;

export default function CreatePostPage() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useAuth();
  const fileInputRef = useRef(null);

  const [content,    setContent]    = useState(location.state?.prefill || '');
  const [mood,       setMood]       = useState(null);
  const [imageFile,  setImageFile]  = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

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

  const handlePublish = async (e) => {
    e?.preventDefault?.();
    if (!content.trim()) { setError('Please write something before posting.'); return; }
    if (isOverLimit) { setError(`Content exceeds ${MAX_CHARS} characters.`); return; }
    setLoading(true);
    setError('');
    try {
      // 1. Create post
      let post = await postsApi.create({
        userId: user?.id ?? null,
        content: content.trim(),
      });

      // 2. Upload image if selected
      if (imageFile) {
        console.log(imageFile);
        post = await filesApi.upload(post.id, imageFile);
      }

      sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Post uploaded successfully.', type: 'success' }));
      navigate(`/post/${post.id}`, { replace: true, state: { post, fromCreate: true } });
    } catch (err) {
      setError(err.message || 'Failed to publish. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = async () => {
    const text = String(content || '').trim();
    if (!text && !mood) return;
    if (!user?.id) return;
    try {
      await draftsApi.save({
        userId: user.id,
        title: null,
        content: text,
        mood: mood?.label ?? null,
        status: 'draft',
      });
      sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Draft saved.', type: 'success' }));
      navigate('/feed');
    } catch (e) {
      setError(e?.message || 'Failed to save draft. Please try again.');
    }
  };

  // Load saved draft on mount
  useEffect(() => {
    if (!user?.id) return;
    if (location.state?.prefill) return;

    let cancelled = false;
    const load = async () => {
      try {
        const draft = await draftsApi.getMy(user.id);
        if (cancelled) return;
        if (!draft) return;
        setContent(draft.content || '');
        const nextMood = draft.mood ? MOODS.find(m => m.label === draft.mood) : null;
        setMood(nextMood || null);
      } catch {
        if (cancelled) return;
      }
    };

    load();
    return () => { cancelled = true; };
  }, [location.state?.prefill, user?.id]);

  return (
    <div style={styles.shell}>
      <div style={styles.layout}>
        <Sidebar />

        <main style={styles.main}>
          <button type="button" onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>

          <div style={styles.card}>
            {/* Header */}
            <div style={styles.titleRow}>
              <h1 style={styles.title}>Share a Thought</h1>
              <div style={{
                ...styles.charCount,
                color: isOverLimit ? theme.colors.rose : charsLeft < 50 ? theme.colors.amber : theme.colors.inkMuted,
              }}>
                <span style={{ fontWeight: isOverLimit ? '700' : '400' }}>{content.length}</span> / {MAX_CHARS}
              </div>
            </div>

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            {/* Compose area */}
            <div style={styles.composeArea}>
              <Avatar name={`${user?.firstName} ${user?.lastName}`} src={filesApi.getUrl(user?.avatarUrl)} size="md" />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's been on your mind today?....... "
                style={{
                  ...styles.textarea,
                  borderColor: isOverLimit ? theme.colors.rose : 'transparent',
                }}
                autoFocus 
              />
            </div>

            {/* Mood selector */}
            <div style={styles.section}>
              <div style={styles.sectionLabel}>How are you feeling?</div>
              <div style={styles.moodGrid}>
                {MOODS.map(m => (
                  <button
                    key={m.label}
                    onClick={() => setMood(mood?.label === m.label ? null : m)}
                    style={{
                      ...styles.moodChip,
                      background: mood?.label === m.label ? theme.colors.amberPale : 'transparent',
                      border: `1.5px solid ${mood?.label === m.label ? theme.colors.amber : theme.colors.border}`,
                      color: mood?.label === m.label ? theme.colors.amberDark : theme.colors.inkMuted,
                    }}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image upload */}
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
              ) : (
                <div
                  style={styles.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDropzone}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = theme.colors.amber;
                    e.currentTarget.style.background   = theme.colors.amberPale;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.background   = 'transparent';
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

            {/* Footer */}
            <div style={styles.footer}>
              <button
                type="button"
                onClick={handleDraft}
                disabled={!content.trim() && !mood}
                style={{
                  ...styles.draftBtn,
                  opacity: (!content.trim() && !mood) ? 0.6 : 1,
                  cursor: (!content.trim() && !mood) ? 'not-allowed' : 'pointer',
                }}
              >
                💾 Save Draft
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>Cancel</button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={loading || isOverLimit || !content.trim()}
                  style={{
                    ...styles.publishBtn,
                    opacity: (loading || isOverLimit || !content.trim()) ? 0.6 : 1,
                    cursor: (loading || isOverLimit || !content.trim()) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Publishing…' : 'Publish Thought →'}
                </button>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div style={styles.tips}>
            <div style={styles.tipsTitle}>✨ Writing Tips</div>
            <ul style={styles.tipsList}>
              <li>Be authentic — the most resonant thoughts come from the heart.</li>
              <li>Reflect before you post. Quality over quantity.</li>
              <li>Use <strong>Ctrl + Enter</strong> (or ⌘ + Enter) to quickly submit.</li>
            </ul>
          </div>
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
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: theme.colors.inkMuted, fontSize: '13px', fontWeight: '500',
    marginBottom: '20px', fontFamily: theme.fonts.body,
    display: 'flex', alignItems: 'center', gap: '6px',
  },
  card: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '28px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.md,
    marginBottom: '16px',
  },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  title: { fontFamily: theme.fonts.display, fontSize: '22px', fontWeight: '700', color: theme.colors.ink },
  charCount: { fontFamily: theme.fonts.mono, fontSize: '12px', transition: theme.transition },
  errorBox: {
    background: theme.colors.rosePale,
    border: `1px solid ${theme.colors.rose}40`,
    borderRadius: theme.radius.sm,
    padding: '10px 14px', fontSize: '13px',
    color: theme.colors.rose, marginBottom: '16px',
    fontFamily: theme.fonts.body,
  },
  composeArea: {
    display: 'flex', gap: '14px', marginBottom: '20px',
    paddingBottom: '20px', borderBottom: `1px solid ${theme.colors.border}`,
  },
  textarea: {
    flex: 1, border: '2px solid transparent',
    borderRadius: theme.radius.md,
    background: theme.colors.cream,
    padding: '12px', resize: 'none',
    fontFamily: theme.fonts.display,
    fontSize: '18px', color: theme.colors.ink,
    outline: 'none', minHeight: '140px', lineHeight: 1.7,
    transition: theme.transition,
  },
  section: { marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${theme.colors.border}` },
  sectionLabel: {
    fontSize: '12px', fontWeight: '700',
    color: theme.colors.inkMuted, textTransform: 'uppercase',
    letterSpacing: '0.5px', marginBottom: '12px',
    fontFamily: theme.fonts.mono,
  },
  moodGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  moodChip: {
    padding: '7px 14px', borderRadius: theme.radius.full,
    cursor: 'pointer', fontSize: '13px',
    transition: theme.transition, fontFamily: theme.fonts.body,
  },
  dropzone: {
    border: `2px dashed ${theme.colors.border}`,
    borderRadius: theme.radius.xl,
    padding: '36px', textAlign: 'center',
    cursor: 'pointer', transition: theme.transition,
  },
  dropzoneIcon: { fontSize: '36px', marginBottom: '10px' },
  dropzoneText: { fontSize: '14px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body, marginBottom: '4px' },
  dropzoneHint: { fontSize: '12px', color: theme.colors.border, fontFamily: theme.fonts.mono },
  previewWrap: { position: 'relative', borderRadius: theme.radius.lg, overflow: 'hidden', maxHeight: '300px' },
  preview: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  removeImg: {
    position: 'absolute', top: '12px', right: '12px',
    background: 'rgba(26,18,8,0.8)', border: 'none',
    color: '#fff', padding: '6px 12px', borderRadius: theme.radius.full,
    cursor: 'pointer', fontSize: '12px', fontFamily: theme.fonts.body,
  },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '4px' },
  draftBtn: {
    padding: '10px 18px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    background: 'transparent', fontSize: '13px',
    fontWeight: '600', color: theme.colors.inkMuted,
    cursor: 'pointer', fontFamily: theme.fonts.body,
  },
  cancelBtn: {
    padding: '10px 18px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    background: 'transparent', fontSize: '14px',
    fontWeight: '600', color: theme.colors.inkMuted,
    cursor: 'pointer', fontFamily: theme.fonts.body,
  },
  publishBtn: {
    padding: '11px 26px',
    background: theme.colors.amber, border: 'none',
    borderRadius: theme.radius.md,
    fontSize: '14px', fontWeight: '700',
    color: theme.colors.ink,
    fontFamily: theme.fonts.body, transition: theme.transition,
  },
  tips: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '20px 24px',
    border: `1px solid ${theme.colors.border}`,
  },
  tipsTitle: {
    fontSize: '13px', fontWeight: '700',
    color: theme.colors.inkMuted, marginBottom: '10px',
    fontFamily: theme.fonts.mono,
  },
  tipsList: {
    paddingLeft: '18px', color: theme.colors.inkMuted,
    fontSize: '13px', lineHeight: 1.8,
    fontFamily: theme.fonts.body,
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
  },
};
