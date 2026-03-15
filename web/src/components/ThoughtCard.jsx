import { useEffect, useMemo, useRef, useState } from 'react'
import Avatar from './Avatar'
import { useNavigate } from 'react-router-dom'
import { theme } from '../theme'
import { filesApi, postsApi } from '../utils/api'

function formatTimestamp(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function formatRelativeTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)

  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString()
}

export default function ThoughtCard({ post, onDelete, viewer = null, initialSaved = false, initialLiked = false }) {
  const name = post?.userName ?? 'Daily User'
  const createdAt = formatRelativeTime(post?.createdAt || post?.updatedAt) || formatTimestamp(post?.createdAt)
  const navigate = useNavigate()
  const postId = post?.id
  const isGuest = !viewer
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [saved, setSaved] = useState(!!initialSaved)
  const [liked, setLiked] = useState(!!initialLiked)
  const [likeCount, setLikeCount] = useState(Number(post?.likeCount) || 0)
  const [commentCount, setCommentCount] = useState(Number(post?.commentCount) || 0)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const moodLabel = post?.mood ?? null
  const handle = String(name).trim().toLowerCase().replace(/\s+/g, '')
  const moodEmoji = useMemo(() => {
    const m = String(moodLabel || '').toLowerCase()
    if (!m) return null
    if (m.includes('happy')) return '😊'
    if (m.includes('reflect')) return '🤔'
    if (m.includes('sad')) return '😢'
    if (m.includes('motiv')) return '💪'
    if (m.includes('peace')) return '😌'
    if (m.includes('frust')) return '😤'
    if (m.includes('excit')) return '🎉'
    if (m.includes('tired')) return '😴'
    return '🙂'
  }, [moodLabel])

  useEffect(() => {
    setLikeCount(Number(post?.likeCount) || 0)
    setCommentCount(Number(post?.commentCount) || 0)
  }, [post?.commentCount, post?.likeCount])

  useEffect(() => {
    setSaved(!!initialSaved)
  }, [initialSaved, postId])

  useEffect(() => {
    setLiked(!!initialLiked)
  }, [initialLiked, postId])

  useEffect(() => {
    if (!menuOpen) return
    const onMouseDown = (e) => {
      if (!menuRef.current) return
      if (menuRef.current.contains(e.target)) return
      setMenuOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const toggleLike = async (e) => {
    e.stopPropagation()
    if (!postId) return
    if (isGuest) { navigate('/login'); return }
    try {
      const res = await postsApi.toggleLike(postId, viewer?.id ?? null)
      setLiked(!!res.liked)
      setLikeCount(Number(res.likeCount) || 0)
    } catch {
      alert('Failed to like post.')
    }
  }

  const toggleSave = async (e) => {
    e.stopPropagation()
    if (!postId) return
    if (isGuest) { navigate('/login'); return }
    try {
      const res = await postsApi.toggleSave(postId, viewer?.id ?? null)
      setSaved(!!res.saved)
    } catch {
      alert('Failed to save post.')
    }
  }

  const openReply = (e) => {
    e.stopPropagation()
    if (!postId) return
    if (isGuest) { navigate('/login'); return }
    setReplyOpen(true)
  }

  const closeReply = () => {
    setReplyOpen(false)
    setReplyText('')
  }

  const submitReply = async () => {
    if (!postId) return
    if (isGuest) { navigate('/login'); return }
    const text = String(replyText || '').trim()
    if (!text) return
    setReplyLoading(true)
    try {
      await postsApi.addComment(postId, { userId: viewer?.id ?? null, content: text })
      setCommentCount((n) => n + 1)
      closeReply()
    } catch {
      alert('Failed to add comment.')
    } finally {
      setReplyLoading(false)
    }
  }

  const postUrl = postId ? `${window.location.origin}/post/${postId}` : window.location.href

  const replyModal = replyOpen && (
    <div
      style={styles.replyOverlay}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeReply()
      }}
    >
      <div style={styles.replyCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.replyTop}>
          <button type="button" onClick={closeReply} style={styles.replyClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={styles.replyContext}>
          <Avatar name={name} size="sm" src={filesApi.getUrl(post?.userAvatarUrl)} />
          <div style={{ minWidth: 0 }}>
            <div style={styles.replyAuthor}>
              {name} <span style={styles.replyHandle}>@{handle}</span>
            </div>
            <div style={styles.replyingTo}>Replying to @{handle}</div>
          </div>
        </div>

        <div style={styles.replyCompose}>
          <Avatar
            name={`${viewer?.firstName || ''} ${viewer?.lastName || ''}`.trim() || viewer?.email || 'User'}
            size="sm"
            src={filesApi.getUrl(viewer?.avatarUrl)}
          />
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Post your reply"
            rows={3}
            style={styles.replyInput}
          />
        </div>

        <div style={styles.replyBottom}>
          <div style={styles.replyActions}>
            <button type="button" style={styles.replyIconBtn} aria-label="Media" disabled>
              🖼️
            </button>
            <button type="button" style={styles.replyIconBtn} aria-label="Emoji" disabled>
              🙂
            </button>
          </div>
          <button
            type="button"
            onClick={submitReply}
            disabled={replyLoading || !replyText.trim()}
            style={{ ...styles.replyBtn, opacity: (replyLoading || !replyText.trim()) ? 0.6 : 1 }}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {replyModal}
      <article
        style={{ ...styles.card, cursor: postId ? 'pointer' : 'default' }}
        onClick={() => { if (postId) navigate(`/post/${postId}`) }}
        onKeyDown={(e) => {
          if (!postId) return
          if (e.key === 'Enter' || e.key === ' ') navigate(`/post/${postId}`)
        }}
        tabIndex={postId ? 0 : -1}
        role={postId ? 'button' : undefined}
      >
        <div style={styles.header}>
          <div
            style={styles.headerLeft}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              if (post?.userId != null) navigate(`/profile/${post.userId}`)
              else navigate('/profile')
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.stopPropagation()
              if (post?.userId != null) navigate(`/profile/${post.userId}`)
              else navigate('/profile')
            }}
          >
            <Avatar name={name} size="md" src={filesApi.getUrl(post?.userAvatarUrl)} />
            <div style={{ minWidth: 0 }}>
              <div style={styles.topRow}>
                <div style={styles.userName}>{name}</div>
                <div style={styles.metaRow}>
                  <span style={styles.metaText}>{createdAt}</span>
                  {moodLabel && (
                    <span style={styles.moodChip}>
                      {moodEmoji ? `${moodEmoji} ` : ''}{moodLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div ref={menuRef} style={styles.menuWrap}>
            <button
              type="button"
              aria-label="Post menu"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
              style={styles.menuBtn}
            >
              ⋯
            </button>
            {menuOpen && (
              <div style={styles.menu}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    if (post?.userId != null) navigate(`/profile/${post.userId}`)
                    else navigate('/profile')
                  }}
                  style={styles.menuItem}
                >
                  View profile
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onDelete(postId)
                    }}
                    style={{ ...styles.menuItem, color: theme.colors.rose }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={styles.body}>
          <p style={styles.text}>{post?.text ?? ''}</p>
          {post?.imagePath && (
            <div style={styles.imageWrap}>
              <img
                src={filesApi.getUrl(post.imagePath)}
                alt=""
                style={styles.image}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <button type="button" onClick={toggleLike} style={styles.iconBtn} aria-label="Like">
              <span style={{ color: liked ? theme.colors.rose : theme.colors.inkMuted }}>
                {liked ? '♥' : '♡'}
              </span>
              <span style={styles.iconLabel}>{likeCount}</span>
            </button>
            <button type="button" onClick={openReply} style={styles.iconBtn} aria-label="Comment">
              <span style={{ color: theme.colors.inkMuted }}>💬</span>
              <span style={styles.iconLabel}>{commentCount}</span>
            </button>
            <button type="button" onClick={toggleSave} style={styles.iconBtn} aria-label="Save">
              <span style={{ color: theme.colors.inkMuted }}>🔖</span>
              <span style={styles.iconLabel}>{saved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(postUrl)
            }}
            style={styles.shareBtn}
            aria-label="Share"
          >
            ↗ Share
          </button>
        </div>
      </article>
    </>
  )
}

const styles = {
  card: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.card,
    padding: '18px',
    marginBottom: '12px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '10px',
  },
  headerLeft: { display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 },
  topRow: { minWidth: 0 },
  userName: {
    fontFamily: theme.fonts.display,
    fontSize: '14px',
    fontWeight: 800,
    color: theme.colors.ink,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '360px',
  },
  metaRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' },
  metaText: { fontFamily: theme.fonts.body, fontSize: '12px', color: theme.colors.inkMuted },
  moodChip: {
    fontFamily: theme.fonts.body,
    fontSize: '12px',
    color: theme.colors.amberDark,
    background: theme.colors.amberPale,
    border: `1px solid ${theme.colors.amber}55`,
    borderRadius: theme.radius.full,
    padding: '2px 8px',
    lineHeight: 1.6,
  },
  body: { fontFamily: theme.fonts.body },
  text: { margin: 0, color: theme.colors.ink, fontSize: '14.5px', lineHeight: 1.6 },
  imageWrap: {
    marginTop: '12px',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.parchment,
  },
  image: { width: '100%', height: 'auto', display: 'block', objectFit: 'cover' },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: `1px solid ${theme.colors.border}`,
  },
  footerLeft: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' },
  iconBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: 0,
    fontFamily: theme.fonts.body,
    color: theme.colors.inkMuted,
    fontSize: '13px',
  },
  iconLabel: { fontWeight: 700 },
  shareBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    color: theme.colors.inkMuted,
    fontSize: '13px',
    fontWeight: 700,
    padding: 0,
    whiteSpace: 'nowrap',
  },
  menuWrap: { position: 'relative', flexShrink: 0 },
  menuBtn: {
    width: '34px',
    height: '34px',
    borderRadius: theme.radius.full,
    border: 'none',
    background: 'transparent',
    fontFamily: theme.fonts.body,
    fontSize: '18px',
    cursor: 'pointer',
    color: theme.colors.inkMuted,
    display: 'grid',
    placeItems: 'center',
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: '38px',
    background: theme.colors.warmWhite,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.md,
    padding: '6px',
    zIndex: 50,
    minWidth: '160px',
  },
  menuItem: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    padding: '10px 10px',
    borderRadius: theme.radius.md,
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    color: theme.colors.ink,
  },
  replyOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    zIndex: 30000,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
  },
  replyCard: {
    width: '100%',
    maxWidth: '620px',
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: '0 24px 80px rgba(0,0,0,0.30)',
    padding: '14px 16px 16px',
    fontFamily: theme.fonts.body,
  },
  replyTop: { display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' },
  replyClose: {
    width: '36px',
    height: '36px',
    borderRadius: theme.radius.full,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: theme.colors.inkMuted,
    fontSize: '16px',
    display: 'grid',
    placeItems: 'center',
  },
  replyContext: { display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '10px' },
  replyAuthor: { fontFamily: theme.fonts.display, fontSize: '14px', fontWeight: 800, color: theme.colors.ink },
  replyHandle: { fontFamily: theme.fonts.body, fontSize: '13px', fontWeight: 500, color: theme.colors.inkMuted, marginLeft: '6px' },
  replyingTo: { fontFamily: theme.fonts.body, fontSize: '13px', color: theme.colors.inkMuted, marginTop: '2px' },
  replyCompose: { display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '8px' },
  replyInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    background: 'transparent',
    fontFamily: theme.fonts.body,
    fontSize: '16px',
    color: theme.colors.ink,
    paddingTop: '6px',
    minHeight: '90px',
  },
  replyBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' },
  replyActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  replyIconBtn: {
    width: '36px',
    height: '36px',
    borderRadius: theme.radius.full,
    border: 'none',
    background: 'transparent',
    color: theme.colors.inkMuted,
    cursor: 'not-allowed',
    display: 'grid',
    placeItems: 'center',
    opacity: 0.7,
  },
  replyBtn: {
    border: 'none',
    borderRadius: theme.radius.full,
    background: theme.colors.inkMuted,
    color: theme.colors.warmWhite,
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    fontWeight: 800,
    padding: '10px 18px',
    cursor: 'pointer',
  },
}
