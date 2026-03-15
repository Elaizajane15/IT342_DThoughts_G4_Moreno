import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ThoughtCard from '../components/ThoughtCard';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { userApi, filesApi, quotesApi, postsApi } from '../utils/api';
import { theme, sx } from '../theme';

const TABS = ['Thoughts', 'Liked', 'Saved'];

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatMonthYear(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

export default function ProfilePage() {
  const navigate         = useNavigate();
  const { userId }       = useParams();
  const { user, login }  = useAuth();
  const fileInputRef     = useRef(null);
  const coverInputRef    = useRef(null);

  const viewedUserId = userId != null ? Number(userId) : null;
  const isMe = viewedUserId == null || (user?.id != null && Number(user.id) === viewedUserId);

  const [profileUser, setProfileUser] = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [likedPosts, setLikedPosts] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [likedLoading, setLikedLoading] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)
  const [pendingCoverFile, setPendingCoverFile] = useState(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('')
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('')
  const [quote,     setQuote]     = useState(null);
  const [tab,       setTab]       = useState(0);
  const [editing,   setEditing]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [editForm,  setEditForm]  = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    bio:       user?.bio       || '',
    birthDate: user?.birthDate || '',
  });
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    let cancelled = false;

    const targetId = viewedUserId != null ? viewedUserId : user?.id;
    if (targetId == null) { setLoading(false); return; }

    setLoading(true);
    setError('');
    setEditing(false);

    const load = async () => {
      try {
        const [u, postPage] = await Promise.all([
          userApi.getById(targetId),
          postsApi.getAll(0, 50),
        ]);
        if (cancelled) return;

        setProfileUser(u);

        const content = Array.isArray(postPage?.content) ? postPage.content : [];
        setPosts(content.filter(p => p?.userId != null && Number(p.userId) === Number(targetId)));
      } catch (e) {
        if (cancelled) return;
        setProfileUser(null);
        setPosts([]);
        setError(e?.message || 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user, navigate, viewedUserId, isMe]);

  useEffect(() => {
    const targetId = viewedUserId != null ? viewedUserId : user?.id;
    if (targetId == null) return;
    let cancelled = false;
    setLikedLoading(true);
    userApi.getLikedPosts(targetId)
      .then((list) => { if (!cancelled) setLikedPosts(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setLikedPosts([]); })
      .finally(() => { if (!cancelled) setLikedLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, viewedUserId]);

  useEffect(() => {
    const targetId = viewedUserId != null ? viewedUserId : user?.id;
    if (targetId == null) return;
    let cancelled = false;
    setSavedLoading(true);
    userApi.getSavedPosts(targetId)
      .then((list) => { if (!cancelled) setSavedPosts(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setSavedPosts([]); })
      .finally(() => { if (!cancelled) setSavedLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, viewedUserId]);

  useEffect(() => {
    if (!user?.id) return;
    if (isMe) return;
    if (viewedUserId == null) return;
    let cancelled = false;
    userApi.getFollowStatus(viewedUserId, user.id)
      .then((res) => { if (!cancelled) setIsFollowing(!!res.following); })
      .catch(() => { if (!cancelled) setIsFollowing(false); });
    return () => { cancelled = true; };
  }, [isMe, user?.id, viewedUserId]);

  useEffect(() => {
    if (!isMe) return;
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      birthDate: user?.birthDate || '',
    });
  }, [isMe, user?.firstName, user?.lastName, user?.bio, user?.birthDate]);

  useEffect(() => {
    quotesApi.getDailyQuote()
      .then(setQuote)
      .catch(() => setQuote({ quoteText: 'Every day is a new page in your story.', author: 'DailyThoughts' }));
  }, []);

  useEffect(() => {
    const url = avatarPreviewUrl
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [avatarPreviewUrl])

  useEffect(() => {
    const url = coverPreviewUrl
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [coverPreviewUrl])

  const startEditing = () => {
    setEditing(true)
    setError('')
    setPendingAvatarFile(null)
    setPendingCoverFile(null)
    setAvatarPreviewUrl('')
    setCoverPreviewUrl('')
  }

  const cancelEditing = () => {
    setEditing(false)
    setError('')
    setPendingAvatarFile(null)
    setPendingCoverFile(null)
    setAvatarPreviewUrl('')
    setCoverPreviewUrl('')
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      birthDate: user?.birthDate || '',
    })
  }

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

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      let updated = await userApi.updateProfile(editForm);
      if (pendingAvatarFile) {
        updated = await filesApi.uploadProfileImage(pendingAvatarFile);
      }
      if (pendingCoverFile) {
        updated = await filesApi.uploadCoverImage(pendingCoverFile);
      }
      login(localStorage.getItem('token'), { ...user, ...updated });
      setProfileUser(updated);
      setPendingAvatarFile(null);
      setPendingCoverFile(null);
      setAvatarPreviewUrl('');
      setCoverPreviewUrl('');
      setEditing(false);
      setToast({ message: 'Profile edit successfully.', type: 'success' });
    } catch (err) {
      const msg = err.message || 'Failed to update profile.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file)
      setPendingAvatarFile(file)
      setAvatarPreviewUrl(url)
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file)
      setPendingCoverFile(file)
      setCoverPreviewUrl(url)
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = '';
    }
  };

  if (!user) return null;

  const displayedUser = profileUser || user;
  const canEdit = isMe;
  if (!displayedUser) {
    return (
      <div style={styles.shell}>
        <Toast message={toast?.message} type={toast?.type || 'success'} onClose={() => setToast(null)} />
        <div style={styles.layout}>
          <Sidebar dailyQuote={quote} />
          <main style={styles.main}>
            <div style={styles.profileCard}>
              {loading ? (
                <div style={{ textAlign: 'center', color: theme.colors.inkMuted, padding: '32px', fontFamily: theme.fonts.body }}>
                  Loading profile…
                </div>
              ) : (
                <>
                  <div style={styles.errorBox}>⚠️ {error || 'Profile not found.'}</div>
                  <button type="button" onClick={() => navigate('/feed')} style={styles.newBtn}>
                    Back to Feed
                  </button>
                </>
              )}
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    )
  }

  const coverUrl = filesApi.getUrl(coverPreviewUrl || displayedUser.coverImageUrl);
  const stats = [
    { num: posts.length,        label: 'THOUGHTS' },
    { num: displayedUser.followerCount ?? 0,  label: 'FOLLOWERS' },
    { num: displayedUser.followingCount ?? 0, label: 'FOLLOWING' },
    { num: displayedUser.totalLikes ?? 0,     label: 'LIKES' },
  ];

  const toggleFollow = async () => {
    if (!user?.id) { navigate('/login'); return; }
    if (viewedUserId == null) return;
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const res = await userApi.toggleFollow(viewedUserId, user.id);
      setIsFollowing(!!res.following);
      setProfileUser((prev) => (prev ? ({ ...prev, followerCount: res.followerCount, followingCount: res.followingCount }) : prev));
      const me = await userApi.getById(user.id);
      login(localStorage.getItem('token'), { ...user, ...me });
    } catch (e) {
      setToast({ message: e?.message || 'Failed to follow user.', type: 'error' });
    } finally {
      setFollowBusy(false);
    }
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
          <div
            style={{
              ...styles.cover,
              ...(coverUrl
                ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : null),
            }}
          >
            <div style={styles.coverPattern} />
            {canEdit && editing && (
              <>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  style={styles.coverEditBtn}
                  title="Change header"
                >
                  📷
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleCoverUpload}
                />
              </>
            )}
          </div>

          <div style={styles.profileCard}>
            <div style={styles.avatarRow}>
              <div style={{ position: 'relative' }}>
                <Avatar
                  name={`${displayedUser.firstName} ${displayedUser.lastName}`}
                  src={filesApi.getUrl(avatarPreviewUrl || displayedUser.avatarUrl)}
                  size="xl"
                  style={{
                    border: `4px solid ${theme.colors.warmWhite}`,
                    marginTop: '-52px',
                    cursor: canEdit && editing ? 'pointer' : 'default',
                  }}
                />
                {canEdit && editing && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={styles.avatarEditBtn}
                      title="Change photo"
                    >
                      📷
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarUpload}
                    />
                  </>
                )}
              </div>

              {canEdit && (
                !editing ? (
                  <button onClick={startEditing} style={styles.editBtn}>
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={cancelEditing} style={styles.cancelBtn}>Cancel</button>
                    <button onClick={handleSaveProfile} disabled={saving} style={styles.saveBtn}>
                      {saving ? 'Saving…' : '✓ Save'}
                    </button>
                  </div>
                )
              )}
              {!canEdit && (
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={followBusy}
                  style={{
                    ...styles.followProfileBtn,
                    background: isFollowing ? theme.colors.amberPale : theme.colors.warmWhite,
                    color: isFollowing ? theme.colors.amberDark : theme.colors.amberDark,
                    opacity: followBusy ? 0.7 : 1,
                    cursor: followBusy ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isFollowing ? '✓ Following' : 'Follow'}
                </button>
              )}
            </div>

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            {canEdit && editing ? (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={sx.label}>First Name</label>
                    <input
                      style={sx.input}
                      value={editForm.firstName}
                      onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                      onFocus={e => e.target.style.borderColor = theme.colors.amber}
                      onBlur={e  => e.target.style.borderColor = theme.colors.border}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={sx.label}>Last Name</label>
                    <input
                      style={sx.input}
                      value={editForm.lastName}
                      onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                      onFocus={e => e.target.style.borderColor = theme.colors.amber}
                      onBlur={e  => e.target.style.borderColor = theme.colors.border}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={sx.label}>Bio</label>
                  <textarea
                    style={{ ...sx.input, minHeight: '80px', resize: 'vertical' }}
                    value={editForm.bio}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = theme.colors.amber}
                    onBlur={e  => e.target.style.borderColor = theme.colors.border}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={sx.label}>Birth Date</label>
                    <input
                      type="date"
                      style={sx.input}
                      value={editForm.birthDate}
                      onChange={e => setEditForm(f => ({ ...f, birthDate: e.target.value }))}
                      onFocus={e => e.target.style.borderColor = theme.colors.amber}
                      onBlur={e  => e.target.style.borderColor = theme.colors.border}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 style={styles.name}>{displayedUser.firstName} {displayedUser.lastName}</h1>
                <p style={styles.email}>{displayedUser.email}</p>
                {displayedUser.bio && <p style={styles.bio}>{displayedUser.bio}</p>}
                {(displayedUser.birthDate || displayedUser.joinedAt) && (
                  <div style={styles.metaRow}>
                    {displayedUser.birthDate && (
                      <span style={styles.metaItem}>🎂 Born {formatDate(displayedUser.birthDate)}</span>
                    )}
                    {displayedUser.joinedAt && (
                      <span style={styles.metaItem}>📅 Joined {formatMonthYear(displayedUser.joinedAt)}</span>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={styles.roleBadge}>
              ✦ ROLE: {displayedUser.role || 'USER'}
            </div>

            <div style={styles.stats}>
              {stats.map(s => (
                <div key={s.label} style={styles.stat}>
                  <div style={styles.statNum}>{s.num.toLocaleString()}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        {/* Tabs */}
        <div style={styles.tabsRow}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              style={{ ...styles.tabBtn, ...(tab === i ? styles.tabBtnActive : {}) }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 0 && (
          loading ? (
            <div style={{ textAlign: 'center', color: theme.colors.inkMuted, padding: '32px', fontFamily: theme.fonts.body }}>
              Loading thoughts…
            </div>
          ) : posts.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '48px' }}>📓</span>
              <p style={{ color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>
                {canEdit ? "You haven't shared any thoughts yet." : 'No thoughts yet.'}
              </p>
              {canEdit && (
                <button onClick={() => navigate('/create')} style={styles.newBtn}>
                  Share Your First Thought
                </button>
              )}
            </div>
          ) : (
            posts.map(post => (
              <ThoughtCard
                key={post.id}
                post={post}
                viewer={user}
                onDelete={canEdit ? handleDelete : undefined}
              />
            ))
          )
        )}

        {tab === 1 && (
          likedLoading ? (
            <div style={{ textAlign: 'center', color: theme.colors.inkMuted, padding: '32px', fontFamily: theme.fonts.body }}>
              Loading liked thoughts…
            </div>
          ) : likedPosts.length === 0 ? (
            <EmptyTab label="liked" icon="❤️" />
          ) : (
            likedPosts.map((post) => (
              <ThoughtCard key={post.id} post={post} viewer={user} initialLiked />
            ))
          )
        )}

        {tab === 2 && (
          savedLoading ? (
            <div style={{ textAlign: 'center', color: theme.colors.inkMuted, padding: '32px', fontFamily: theme.fonts.body }}>
              Loading saved thoughts…
            </div>
          ) : savedPosts.length === 0 ? (
            <EmptyTab label="saved" icon="🔖" />
          ) : (
            savedPosts.map((post) => (
              <ThoughtCard key={post.id} post={post} viewer={user} initialSaved />
            ))
          )
        )}

        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function EmptyTab({ label, icon }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      <p>Your {label} thoughts will appear here.</p>
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
                    setFollowed(prev => ({ ...prev, [followKey]: !!res.following }))
                  } catch (e) {
                    alert(e?.message || 'Failed to follow user.')
                  }
                }}
                style={{
                  ...styles.followBtn,
                  background: followed[followKey] ? theme.colors.amber : 'transparent',
                }}
              >
                {followed[followKey] ? 'Following' : 'Follow'}
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
  main: { flex: '0 1 640px', minWidth: 0, padding: '0 0 60px' },
  cover: {
    height: '200px',
    background: `linear-gradient(135deg, ${theme.colors.ink} 0%, #3d2a08 50%, #1a0f00 100%)`,
    borderRadius: '0 0 20px 20px',
    marginBottom: '-40px',
    position: 'relative',
    overflow: 'hidden',
  },
  coverPattern: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 20% 80%, rgba(217,119,6,0.10) 0%, transparent 40%), radial-gradient(ellipse at 80% 20%, rgba(217,119,6,0.07) 0%, transparent 40%)',
  },
  profileCard: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '24px 28px',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.md,
    position: 'relative',
    zIndex: 2,
    marginBottom: '0',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  avatarEditBtn: {
    position: 'absolute', bottom: '-4px', right: '-4px',
    width: '26px', height: '26px',
    background: theme.colors.warmWhite,
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '12px',
    boxShadow: theme.shadows.sm,
  },
  coverEditBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '34px',
    height: '34px',
    borderRadius: theme.radius.full,
    border: `1.5px solid ${theme.colors.border}`,
    background: theme.colors.warmWhite,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    boxShadow: theme.shadows.sm,
  },
  editBtn: {
    padding: '8px 18px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.full,
    background: 'transparent',
    fontSize: '13px', fontWeight: '600',
    color: theme.colors.ink, cursor: 'pointer',
    fontFamily: theme.fonts.body, transition: theme.transition,
  },
  cancelBtn: {
    padding: '8px 14px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    background: 'transparent',
    fontSize: '13px', fontWeight: '600',
    color: theme.colors.inkMuted, cursor: 'pointer',
    fontFamily: theme.fonts.body,
  },
  saveBtn: {
    padding: '8px 18px',
    background: theme.colors.amber, border: 'none',
    borderRadius: theme.radius.md,
    fontSize: '13px', fontWeight: '700',
    color: theme.colors.ink, cursor: 'pointer',
    fontFamily: theme.fonts.body,
  },
  errorBox: {
    background: theme.colors.rosePale,
    border: `1px solid ${theme.colors.rose}40`,
    borderRadius: theme.radius.sm,
    padding: '10px 14px', fontSize: '13px',
    color: theme.colors.rose, marginBottom: '14px',
    fontFamily: theme.fonts.body,
  },
  name: {
    fontFamily: theme.fonts.display,
    fontSize: '26px', fontWeight: '700',
    color: theme.colors.ink, marginBottom: '4px',
  },
  email: { fontSize: '13px', color: theme.colors.inkMuted, fontFamily: theme.fonts.mono, marginBottom: '10px' },
  bio: { fontSize: '13.5px', color: theme.colors.ink, fontFamily: theme.fonts.body, lineHeight: 1.6, marginBottom: '10px' },
  metaRow: { display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' },
  metaItem: { fontSize: '12px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body },
  roleBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 12px',
    background: theme.colors.amberPale,
    borderRadius: theme.radius.full,
    fontSize: '11px', fontWeight: '700',
    color: theme.colors.amberDark,
    fontFamily: theme.fonts.mono,
    marginBottom: '16px',
  },
  stats: { display: 'flex', gap: '32px' },
  stat: { },
  statNum: { fontFamily: theme.fonts.display, fontSize: '24px', fontWeight: '700', color: theme.colors.ink },
  statLabel: { fontSize: '10px', color: theme.colors.inkMuted, fontFamily: theme.fonts.mono },
  tabsRow: {
    display: 'flex',
    borderBottom: `2px solid ${theme.colors.border}`,
    margin: '24px 0 20px',
  },
  tabBtn: {
    padding: '12px 20px',
    border: 'none', background: 'transparent',
    fontSize: '14px', fontWeight: '600',
    color: theme.colors.inkMuted, cursor: 'pointer',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    transition: theme.transition,
    fontFamily: theme.fonts.body,
  },
  tabBtnActive: {
    color: theme.colors.amberDark,
    borderBottomColor: theme.colors.amber,
  },
  emptyState: {
    textAlign: 'center', padding: '60px 20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '16px',
  },
  newBtn: {
    padding: '12px 24px',
    background: theme.colors.amber, border: 'none',
    borderRadius: theme.radius.md,
    fontSize: '14px', fontWeight: '600',
    color: theme.colors.ink, cursor: 'pointer',
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
  followProfileBtn: {
    border: `1px solid ${theme.colors.amber}`,
    borderRadius: theme.radius.full,
    padding: '10px 14px',
    fontSize: '13px',
    fontFamily: theme.fonts.body,
    fontWeight: 700,
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
