import { useEffect, useMemo, useRef, useState } from 'react'
import Avatar from './Avatar'
import { useNavigate } from 'react-router-dom'
import { filesApi, postsApi } from '../utils/api'

/* ── Warm Parchment ─────────────────────────────── */
const P = {
  bg: '#FFF8EE', card: '#ffffff', surface: '#F5ECD4', surfaceHi: '#EDE0C4',
  border: 'rgba(197,162,100,0.28)', borderHov: 'rgba(197,162,100,0.55)',
  amber: '#E8C97A', amberDark: '#C9A84C', amberPale: 'rgba(232,201,122,0.18)',
  ink: '#3D2600', muted: '#7A6040', mutedSoft: 'rgba(122,96,64,0.6)',
  rose: '#c0392b', rosePale: 'rgba(192,57,43,0.07)',
  fHead: "'Playfair Display','Georgia',serif",
  fBody: "'Lora','Georgia',serif",
  fMono: "'DM Mono',monospace",
};

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🤔', label: 'Reflective' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '💪', label: 'Motivated' },
  { emoji: '😌', label: 'Peaceful' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🎉', label: 'Excited' },
  { emoji: '😴', label: 'Tired' },
]

function formatRelativeTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const dy = Math.floor(h / 24)
  if (dy < 7) return `${dy}d ago`
  return d.toLocaleDateString()
}

export default function ThoughtCard({ post, onDelete, viewer = null, initialSaved = false, initialLiked = false }) {
  const name      = post?.userName ?? 'Daily User'
  const createdAt = formatRelativeTime(post?.createdAt || post?.updatedAt)
  const navigate  = useNavigate()
  const postId    = post?.id
  const isGuest   = !viewer

  const [menuOpen,      setMenuOpen]      = useState(false)
  const [cardHov,       setCardHov]       = useState(false)
  const menuRef = useRef(null)
  const [saved,         setSaved]         = useState(!!initialSaved)
  const [liked,         setLiked]         = useState(!!initialLiked)
  const [likeCount,     setLikeCount]     = useState(Number(post?.likeCount) || 0)
  const [commentCount,  setCommentCount]  = useState(Number(post?.commentCount) || 0)
  const [replyOpen,     setReplyOpen]     = useState(false)
  const [replyText,     setReplyText]     = useState('')
  const [replyLoading,  setReplyLoading]  = useState(false)

  const moodLabel = post?.mood ?? null
  const [moodOpen, setMoodOpen] = useState(false)
  const moodRef = useRef(null)
  const handle    = String(name).trim().toLowerCase().replace(/\s+/g, '')
  const moodEmoji = useMemo(() => {
    const m = String(moodLabel || '').toLowerCase()
    if (!m) return null
    if (m.includes('happy'))   return '😊'
    if (m.includes('reflect')) return '🤔'
    if (m.includes('sad'))     return '😢'
    if (m.includes('motiv'))   return '💪'
    if (m.includes('peace'))   return '😌'
    if (m.includes('frust'))   return '😤'
    if (m.includes('excit'))   return '🎉'
    if (m.includes('tired'))   return '😴'
    return '🙂'
  }, [moodLabel])

  useEffect(() => { setLikeCount(Number(post?.likeCount) || 0); setCommentCount(Number(post?.commentCount) || 0) }, [post?.likeCount, post?.commentCount])
  useEffect(() => { setSaved(!!initialSaved) }, [initialSaved, postId])
  useEffect(() => { setLiked(!!initialLiked) }, [initialLiked, postId])

  useEffect(() => {
    if (!menuOpen) return
    const onMD = e => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    const onKD = e => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onMD)
    document.addEventListener('keydown', onKD)
    return () => { document.removeEventListener('mousedown', onMD); document.removeEventListener('keydown', onKD) }
  }, [menuOpen])

  useEffect(() => {
    if (!moodOpen) return
    const onMD = e => { if (!moodRef.current?.contains(e.target)) setMoodOpen(false) }
    const onKD = e => { if (e.key === 'Escape') setMoodOpen(false) }
    document.addEventListener('mousedown', onMD)
    document.addEventListener('keydown', onKD)
    return () => { document.removeEventListener('mousedown', onMD); document.removeEventListener('keydown', onKD) }
  }, [moodOpen])

  const toggleLike = async e => {
    e.stopPropagation()
    if (!postId) return
    if (isGuest) { navigate('/login'); return }
    try { const r = await postsApi.toggleLike(postId, viewer?.id ?? null); setLiked(!!r.liked); setLikeCount(Number(r.likeCount) || 0) }
    catch { alert('Failed to like post.') }
  }

  const toggleSave = async e => {
    e.stopPropagation()
    if (!postId) return
    if (isGuest) { navigate('/login'); return }
    try { const r = await postsApi.toggleSave(postId, viewer?.id ?? null); setSaved(!!r.saved) }
    catch { alert('Failed to save post.') }
  }

  const openReply = e => {
    e.stopPropagation()
    if (!postId) return
    if (isGuest) { navigate('/login'); return }
    setReplyOpen(true)
  }

  const closeReply = () => { setReplyOpen(false); setReplyText('') }

  const submitReply = async () => {
    if (!postId || isGuest) return
    const text = String(replyText || '').trim()
    if (!text) return
    setReplyLoading(true)
    try {
      await postsApi.addComment(postId, { userId: viewer?.id ?? null, content: text })
      setCommentCount(n => n + 1)
      closeReply()
    } catch { alert('Failed to add comment.') }
    finally { setReplyLoading(false) }
  }

  const postUrl = postId ? `${window.location.origin}/post/${postId}` : window.location.href

  const replyModal = replyOpen && (
    <div style={S.replyOverlay} role="dialog" aria-modal="true"
      onMouseDown={e => { if (e.target === e.currentTarget) closeReply() }}>
      <div style={S.replyCard} onMouseDown={e => e.stopPropagation()}>
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:12 }}>
          <button type="button" onClick={closeReply} style={S.replyClose} aria-label="Close">✕</button>
        </div>
        {/* Original post context */}
        <div style={S.replyContext}>
          <Avatar name={name} size="sm" src={filesApi.getUrl(post?.userAvatarUrl)} />
          <div style={{ minWidth:0 }}>
            <p style={S.replyAuthor}>{name} <span style={S.replyHandle}>@{handle}</span></p>
            <p style={S.replyingTo}>Replying to @{handle}</p>
          </div>
        </div>
        {/* Compose */}
        <div style={S.replyCompose}>
          <Avatar name={`${viewer?.firstName||''} ${viewer?.lastName||''}`.trim() || viewer?.email || 'User'} size="sm" src={filesApi.getUrl(viewer?.avatarUrl)} />
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
            placeholder="Post your reply…" rows={3} style={S.replyInput} />
        </div>
        {/* Bottom */}
        <div style={S.replyBottom}>
          <div style={{ display:'flex', gap:8 }}>
            {['🖼️','🙂'].map(ic => <button key={ic} type="button" style={S.replyIconBtn} disabled>{ic}</button>)}
          </div>
          <button type="button" onClick={submitReply} disabled={replyLoading || !replyText.trim()}
            style={{ ...S.replyBtn, opacity: (replyLoading || !replyText.trim()) ? 0.6 : 1 }}>
            {replyLoading ? 'Posting…' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {replyModal}
      <article
        style={{ ...S.card, cursor: postId ? 'pointer' : 'default', boxShadow: cardHov ? '0 6px 28px rgba(61,38,0,0.1)' : '0 2px 12px rgba(61,38,0,0.05)', transform: cardHov ? 'translateY(-1px)' : 'none' }}
        onClick={() => { if (postId) navigate(`/post/${postId}`) }}
        onMouseEnter={() => setCardHov(true)}
        onMouseLeave={() => setCardHov(false)}
        tabIndex={postId ? 0 : -1}
        role={postId ? 'button' : undefined}
      >
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}
            role="button" tabIndex={0}
            onClick={e => { e.stopPropagation(); navigate(post?.userId != null ? `/profile/${post.userId}` : '/profile') }}
            onKeyDown={e => { if (e.key !== 'Enter' && e.key !== ' ') return; e.stopPropagation(); navigate(post?.userId != null ? `/profile/${post.userId}` : '/profile') }}>
            <Avatar name={name} size="md" src={filesApi.getUrl(post?.userAvatarUrl)} />
            <div style={{ minWidth:0 }}>
              <p style={S.userName}>{name}</p>
              <div style={S.metaRow}>
                <span style={S.metaText}>{createdAt}</span>
                {moodLabel && (
                  <span ref={moodRef} style={S.moodWrap}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setMoodOpen(v => !v) }}
                      onKeyDown={e => { if (e.key !== 'Enter' && e.key !== ' ') return; e.stopPropagation(); setMoodOpen(v => !v) }}
                      style={S.moodChipBtn}
                      aria-label="Emotions"
                    >
                      {moodEmoji ? `${moodEmoji} ` : ''}{moodLabel}
                    </button>
                    {moodOpen && (
                      <div style={S.moodPopover} onClick={e => e.stopPropagation()} role="dialog" aria-modal="false">
                        {MOODS.map(m => (
                          <button
                            key={m.label}
                            type="button"
                            style={{ ...S.moodItem, ...(String(moodLabel).toLowerCase() === String(m.label).toLowerCase() ? S.moodItemActive : null) }}
                            onClick={() => setMoodOpen(false)}
                          >
                            {m.emoji} {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div ref={menuRef} style={{ position:'relative', flexShrink:0 }}>
            <button type="button" aria-label="Post menu"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              style={{ ...S.menuBtn, background: menuOpen ? P.surface : 'transparent' }}>⋯</button>
            {menuOpen && (
              <div style={S.menu}>
                <button type="button" onClick={e => { e.stopPropagation(); setMenuOpen(false); navigate(post?.userId != null ? `/profile/${post.userId}` : '/profile') }}
                  style={S.menuItem} className="dt-mi">View profile</button>
                {onDelete && (
                  <button type="button" onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(postId) }}
                    style={{ ...S.menuItem, color: P.rose }} className="dt-mi">Delete</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>
          <p style={S.text}>{post?.text ?? ''}</p>
          {post?.imagePath && (
            <div style={S.imageWrap}>
              <img src={filesApi.getUrl(post.imagePath)} alt="" style={S.image} onClick={e => e.stopPropagation()} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <div style={S.footerLeft}>
            <button type="button" onClick={toggleLike} style={S.iconBtn} aria-label="Like">
              <span style={{ color: liked ? P.rose : P.muted, fontSize:16 }}>{liked ? '♥' : '♡'}</span>
              <span style={S.iconLabel}>{likeCount}</span>
            </button>
            <button type="button" onClick={openReply} style={S.iconBtn} aria-label="Comment">
              <span style={{ fontSize:14 }}>💬</span>
              <span style={S.iconLabel}>{commentCount}</span>
            </button>
            <button type="button" onClick={toggleSave} style={S.iconBtn} aria-label="Save">
              <span style={{ fontSize:14, color: saved ? P.amberDark : P.muted }}>{saved ? '🔖' : '🔖'}</span>
              <span style={{ ...S.iconLabel, color: saved ? P.amberDark : P.muted }}>{saved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
          <button type="button" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(postUrl) }}
            style={S.shareBtn} aria-label="Share">↗ Share</button>
        </div>
      </article>
    </>
  )
}

const S = {
  card: { background: P.card, borderRadius:16, border:`1px solid ${P.border}`, padding:'18px', marginBottom:12, transition:'all 0.2s', fontFamily: P.fBody },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:10 },
  headerLeft: { display:'flex', gap:12, alignItems:'center', minWidth:0, flex:1, cursor:'pointer' },
  userName: { fontFamily: P.fHead, fontSize:14, fontWeight:700, color: P.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:360, marginBottom:0 },
  metaRow: { display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' },
  metaText: { fontFamily: P.fMono, fontSize:11, color: P.muted },
  moodWrap: { position:'relative', display:'inline-flex' },
  moodChipBtn: { fontFamily: P.fBody, fontSize:11.5, color: P.amberDark, background: P.amberPale, border:`1px solid rgba(197,162,100,0.35)`, borderRadius:50, padding:'2px 10px', lineHeight:1.6, cursor:'pointer' },
  moodPopover: { position:'absolute', top:'calc(100% + 6px)', left:0, background: P.card, border:`1px solid ${P.border}`, borderRadius:14, boxShadow:'0 8px 32px rgba(61,38,0,0.1)', padding:6, zIndex:60, minWidth:170 },
  moodItem: { width:'100%', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', padding:'8px 10px', borderRadius:10, fontFamily: P.fBody, fontSize:12.5, color: P.ink },
  moodItemActive: { background: P.amberPale, color: P.amberDark },
  body: { fontFamily: P.fBody },
  text: { margin:0, color: P.ink, fontSize:14.5, lineHeight:1.7 },
  imageWrap: { marginTop:12, borderRadius:12, overflow:'hidden', border:`1px solid ${P.border}`, background: P.surface },
  image: { width:'100%', height:'auto', display:'block', objectFit:'cover' },
  footer: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginTop:12, paddingTop:12, borderTop:`1px solid ${P.border}` },
  footerLeft: { display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' },
  iconBtn: { border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:6, padding:0, fontFamily: P.fBody, color: P.muted, fontSize:13 },
  iconLabel: { fontWeight:700, color: P.muted, fontSize:12 },
  shareBtn: { border:'none', background:'transparent', cursor:'pointer', fontFamily: P.fBody, color: P.muted, fontSize:13, fontWeight:700, padding:0, whiteSpace:'nowrap' },
  menuBtn: { width:34, height:34, borderRadius:50, border:'none', fontFamily: P.fBody, fontSize:18, cursor:'pointer', color: P.muted, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s' },
  menu: { position:'absolute', right:0, top:38, background: P.card, border:`1px solid ${P.border}`, borderRadius:14, boxShadow:'0 8px 32px rgba(61,38,0,0.1)', padding:6, zIndex:50, minWidth:160 },
  menuItem: { width:'100%', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', padding:'9px 12px', borderRadius:10, fontFamily: P.fBody, fontSize:13, color: P.ink, transition:'background 0.15s' },
  replyOverlay: { position:'fixed', inset:0, background:'rgba(61,38,0,0.3)', zIndex:30000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px', backdropFilter:'blur(3px)' },
  replyCard: { width:'100%', maxWidth:580, background: P.card, borderRadius:20, border:`1px solid ${P.border}`, boxShadow:'0 24px 80px rgba(61,38,0,0.16)', padding:'16px 18px 18px', fontFamily: P.fBody },
  replyClose: { width:34, height:34, borderRadius:50, border:`1px solid ${P.border}`, background: P.surface, cursor:'pointer', color: P.muted, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: P.fMono },
  replyContext: { display:'flex', gap:10, alignItems:'flex-start', paddingBottom:10, borderBottom:`1px solid ${P.border}` },
  replyAuthor: { fontFamily: P.fHead, fontSize:14, fontWeight:700, color: P.ink, marginBottom:2 },
  replyHandle: { fontFamily: P.fBody, fontSize:13, color: P.muted, marginLeft:6 },
  replyingTo: { fontFamily: P.fBody, fontSize:12, color: P.muted },
  replyCompose: { display:'flex', gap:10, alignItems:'flex-start', marginTop:12 },
  replyInput: { flex:1, border:'none', outline:'none', resize:'none', background:'transparent', fontFamily: P.fBody, fontSize:15, color: P.ink, paddingTop:4, minHeight:80 },
  replyBottom: { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, paddingTop:10, borderTop:`1px solid ${P.border}` },
  replyIconBtn: { width:34, height:34, borderRadius:50, border:'none', background:'transparent', color: P.muted, cursor:'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.5 },
  replyBtn: { border:'none', borderRadius:50, background:`linear-gradient(135deg,#E8C97A,#C9A84C)`, color: P.ink, fontFamily: P.fBody, fontSize:13, fontWeight:700, padding:'9px 22px', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 10px rgba(200,160,60,0.25)' },
};
