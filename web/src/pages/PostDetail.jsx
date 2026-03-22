import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { postsApi, quotesApi, filesApi, userApi } from '../utils/api';

const P = {
  bg:'#FFF8EE', card:'#ffffff', surface:'#F5ECD4',
  border:'rgba(197,162,100,0.28)', amber:'#E8C97A', amberDark:'#C9A84C',
  amberPale:'rgba(232,201,122,0.18)', ink:'#3D2600', muted:'#7A6040',
  rose:'#c0392b', rosePale:'rgba(192,57,43,0.07)',
  fH:"'Playfair Display','Georgia',serif",
  fB:"'Lora','Georgia',serif",
  fM:"'DM Mono',monospace",
};

const MOODS=[{emoji:'😊',label:'Happy'},{emoji:'🤔',label:'Reflective'},{emoji:'😢',label:'Sad'},{emoji:'💪',label:'Motivated'},{emoji:'😌',label:'Peaceful'},{emoji:'😤',label:'Frustrated'},{emoji:'🎉',label:'Excited'},{emoji:'😴',label:'Tired'}];

export default function PostDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isGuest  = !user;
  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [quote,   setQuote]   = useState(null);
  const [liked,   setLiked]   = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments,  setComments]  = useState([]);
  const [comment,   setComment]   = useState('');
  const [toast,     setToast]     = useState(null);
  const [delOpen,   setDelOpen]   = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [editText, setEditText] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const commentRef = useRef(null);
  const moodRef = useRef(null);
  const [moodOpen, setMoodOpen] = useState(false);
  const postId = useMemo(() => { const n=Number(id); return Number.isFinite(n)?n:null }, [id]);

  useEffect(() => {
    const go = async () => {
      setLoading(true); setError('');
      try {
        if (postId==null) throw new Error('Invalid');
        const init = location.state?.post;
        if (init && Number(init.id)===postId) { setPost(init); return; }
        let found=null, page=0, tp=1;
        while (!found && page<tp && page<10) {
          const r=await postsApi.getAll(page,50); tp=r.totalPages||1;
          found=r.content.find(p=>Number(p.id)===postId)||null; page++;
        }
        if (!found) throw new Error('Not found');
        setPost(found);
      } catch { setError('Could not load this post.') }
      finally { setLoading(false) }
    };
    go();
  }, [id, location.state, postId]);

  useEffect(() => { quotesApi.getDailyQuote().then(setQuote).catch(()=>null) }, []);

  useEffect(() => {
    const raw=sessionStorage.getItem('dt_toast'); if (!raw) return;
    sessionStorage.removeItem('dt_toast');
    try { const p=JSON.parse(raw); if (p?.message) setToast({message:String(p.message),type:p.type==='error'?'error':'success'}) } catch { setToast({message:String(raw),type:'success'}) }
  }, []);

  useEffect(() => {
    if (postId==null) return; let dead=false;
    (async()=>{
      try {
        const uid=isGuest?null:user?.id??null;
        const [lk,sv,ls]=await Promise.all([postsApi.getLikeStatus(postId,uid),postsApi.getSaveStatus(postId,uid),postsApi.getComments(postId)]);
        if (dead) return; setLiked(!!lk.liked); setLikeCount(lk.likeCount); setIsSaved(!!sv.saved); setComments(ls);
      } catch { if (!dead) { setLiked(false); setLikeCount(0); setIsSaved(false); setComments([]) } }
    })();
    return ()=>{dead=true};
  }, [isGuest, postId, user?.id]);

  useEffect(() => {
    if (isGuest||post?.userId==null||user?.id==null||Number(user.id)===Number(post.userId)) return;
    let dead=false;
    userApi.getFollowStatus(post.userId,user.id).then(r=>{if(!dead)setIsFollowing(!!r.following)}).catch(()=>{});
    return()=>{dead=true};
  }, [isGuest, post?.userId, user?.id]);

  const fmtDate = ts => !ts?'':new Date(ts).toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const toggleLike = async()=>{ if(isGuest){navigate('/login');return} try{const r=await postsApi.toggleLike(postId,user?.id??null);setLiked(!!r.liked);setLikeCount(r.likeCount)}catch{alert('Failed')} };
  const toggleSave = async()=>{ if(isGuest){navigate('/login');return} try{const r=await postsApi.toggleSave(postId,user?.id??null);setIsSaved(!!r.saved)}catch{alert('Failed')} };
  const toggleFollow = async()=>{ if(isGuest){navigate('/login');return} try{const r=await userApi.toggleFollow(post.userId,user?.id??null);setIsFollowing(!!r.following)}catch{alert('Failed')} };
  const submitComment = async()=>{ if(isGuest){navigate('/login');return} const t=comment.trim(); if(!t) return; try{const c=await postsApi.addComment(postId,{userId:user?.id??null,content:t});setComments(p=>[c,...p]);setComment('')}catch{alert('Failed')} };
  const confirmDelete = async()=>{ try{await postsApi.delete(postId);sessionStorage.setItem('dt_toast',JSON.stringify({message:'Post deleted.',type:'success'}));navigate('/feed',{replace:true})}catch(e){setToast({message:e?.message||'Failed.',type:'error'})}finally{setDelOpen(false)} };

  const name=post?.userName||'Daily User';
  const isOwner=!isGuest&&user?.id!=null&&post?.userId!=null&&Number(user.id)===Number(post.userId);
  const handle=String(name).trim().toLowerCase().replace(/\s+/g,'');
  const moodLabel = post?.mood ?? null;
  const moodEmoji = useMemo(() => {
    const m = String(moodLabel || '').toLowerCase();
    if (!m) return null;
    if (m.includes('happy'))   return '😊';
    if (m.includes('reflect')) return '🤔';
    if (m.includes('sad'))     return '😢';
    if (m.includes('motiv'))   return '💪';
    if (m.includes('peace'))   return '😌';
    if (m.includes('frust'))   return '😤';
    if (m.includes('excit'))   return '🎉';
    if (m.includes('tired'))   return '😴';
    return '🙂';
  }, [moodLabel]);

  useEffect(() => {
    if (!moodOpen) return;
    const onMD = e => { if (!moodRef.current?.contains(e.target)) setMoodOpen(false); };
    const onKD = e => { if (e.key === 'Escape') setMoodOpen(false); };
    document.addEventListener('mousedown', onMD);
    document.addEventListener('keydown', onKD);
    return () => { document.removeEventListener('mousedown', onMD); document.removeEventListener('keydown', onKD); };
  }, [moodOpen]);

  return (
    <div style={{minHeight:'100vh',background:P.bg,fontFamily:P.fB}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:ital,wght@0,400;0,600&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <Toast message={toast?.message} type={toast?.type||'success'} onClose={()=>setToast(null)} />
      {delOpen && (
        <div style={S.ov} onMouseDown={e=>{if(e.target===e.currentTarget)setDelOpen(false)}}>
          <div style={S.modal}>
            <div style={{fontSize:32,marginBottom:12}}>🗑️</div>
            <h3 style={S.mTitle}>Delete Post?</h3>
            <p style={S.mBody}>This cannot be undone.</p>
            <div style={{display:'flex',justifyContent:'center',gap:12}}>
              <button type="button" onClick={()=>setDelOpen(false)} style={S.btnC}>Cancel</button>
              <button type="button" onClick={confirmDelete} style={S.btnD}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.layout}>
        <Sidebar dailyQuote={quote} />
        <main style={S.main}>
          <button onClick={()=>navigate('/feed')} style={S.back}>← Back to Feed</button>
          {loading ? <p style={{padding:32,textAlign:'center',color:P.muted,fontFamily:P.fB}}>Loading…</p>
          : error||!post ? <div style={S.errBox}>⚠ {error||'Post not found.'}</div>
          : <>
            <div style={S.pCard}>
              <div style={S.topLine} />
              <div style={{padding:'24px 28px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0,cursor:'pointer'}} onClick={()=>navigate(post?.userId!=null?`/profile/${post.userId}`:'/profile')}>
                    <Avatar name={name} size="md" src={filesApi.getUrl(post?.userAvatarUrl)} />
                    <div>
                      <p style={{fontFamily:P.fH,fontSize:16,fontWeight:700,color:P.ink,marginBottom:2,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                        {name}
                        {moodLabel && (
                          <span ref={moodRef} style={S.moodWrap} onClick={e=>e.stopPropagation()}>
                            <button type="button" onClick={()=>setMoodOpen(v=>!v)} style={S.moodChipBtn} aria-label="Emotions">
                              {moodEmoji ? `${moodEmoji} ` : ''}{moodLabel}
                            </button>
                            {moodOpen && (
                              <div style={S.moodPopover} role="dialog" aria-modal="false" onClick={e=>e.stopPropagation()}>
                                {MOODS.map(m => (
                                  <button
                                    key={m.label}
                                    type="button"
                                    style={{...S.moodItem,...(String(moodLabel).toLowerCase()===String(m.label).toLowerCase()?S.moodItemActive:null)}}
                                    onClick={()=>setMoodOpen(false)}
                                  >
                                    {m.emoji} {m.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </span>
                        )}
                      </p>
                      <p style={{fontFamily:P.fM,fontSize:11.5,color:P.muted}}>@{handle} · USER</p>
                    </div>
                  </div>
                  {!isGuest&&!isOwner&&<button type="button" onClick={toggleFollow} style={{...S.pBtn,background:isFollowing?P.amberPale:'transparent',color:P.amberDark,borderColor:isFollowing?P.amberDark:P.border}}>{isFollowing?'Following ✓':'Follow'}</button>}
                  {!isGuest&&isOwner&&<div style={{display:'flex',gap:10}}>
                    <button type="button" onClick={()=>navigate(`/edit/${post.id}`,{state:{post}})} style={S.oBtn}>Edit</button>
                    <button type="button" onClick={()=>setDelOpen(true)} style={{...S.oBtn,color:P.rose,borderColor:'rgba(192,57,43,0.3)'}}>Delete</button>
                  </div>}
                </div>
                <p style={{color:P.ink,fontFamily:P.fB,fontSize:17,lineHeight:1.8}}>{post.text}</p>
                {post.imagePath&&<div style={{marginTop:16,borderRadius:14,overflow:'hidden',border:`1px solid ${P.border}`,background:P.surface}}><img src={filesApi.getUrl(post.imagePath)} alt="" style={{width:'100%',height:'auto',display:'block',objectFit:'cover'}} /></div>}
                <p style={{fontFamily:P.fM,fontSize:12,color:P.muted,marginTop:14}}>📅 {fmtDate(post.createdAt)}</p>
                <div style={{height:1,background:P.border,margin:'16px 0'}} />
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    <button type="button" onClick={toggleLike} style={{...S.aBtn,background:liked?P.rosePale:'transparent',borderColor:liked?P.rose:P.border,color:liked?P.rose:P.muted}}>❤️ {likeCount||0} Likes</button>
                    <button type="button" onClick={()=>commentRef.current?.focus()} style={S.aBtn}>💬 {comments.length||0} Comments</button>
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button type="button" onClick={toggleSave} style={{...S.aBtn,color:isSaved?P.amberDark:P.muted,borderColor:isSaved?P.amberDark:P.border}}>🔖 {isSaved?'Saved':'Save'}</button>
                    <button type="button" onClick={()=>navigator.clipboard.writeText(window.location.href)} style={S.aBtn}>↗️ Share</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{marginTop:0}}>
              <h2 style={{fontFamily:P.fH,fontSize:22,fontWeight:700,color:P.ink,marginBottom:14}}>{comments.length||0} Comments</h2>
              {isGuest ? <button type="button" onClick={()=>navigate('/login')} style={S.ctaBtn}>Login to like and comment</button>
              : <div style={{display:'flex',gap:10,alignItems:'center',padding:'12px 14px',borderRadius:14,border:`1px solid ${P.border}`,background:P.card,marginBottom:14,boxShadow:'0 1px 8px rgba(61,38,0,0.04)'}}>
                  <Avatar name={`${user?.firstName||''} ${user?.lastName||''}`.trim()||user?.email||'User'} src={filesApi.getUrl(user?.avatarUrl)} size="sm" />
                  <textarea ref={commentRef} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Write a thoughtful comment…" rows={1} style={{flex:1,border:'none',borderRadius:10,padding:'8px 10px',fontFamily:P.fB,fontSize:13,outline:'none',resize:'none',background:'transparent',color:P.ink}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitComment()}}} />
                  <button type="button" onClick={submitComment} disabled={!comment.trim()} style={{...S.ctaBtn,opacity:!comment.trim()?0.6:1,marginTop:0,padding:'9px 18px'}}>Post</button>
                </div>}
              {comments.length===0 ? <p style={{color:P.muted,fontFamily:P.fB,fontSize:13}}>No comments yet.</p>
              : <div style={{marginTop:8}}>{comments.map(c=>(
                <div key={c.id} style={{display:'flex',gap:10,padding:'14px 0',borderBottom:`1px solid ${P.border}`}}>
                  <Avatar name={c.userName||'User'} size="sm" src={filesApi.getUrl(c.userAvatarUrl)} />
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:10}}>
                      <p style={{fontFamily:P.fH,fontSize:13,fontWeight:700,color:P.ink}}>{c.userName||'User'} <span style={{fontFamily:P.fB,fontSize:11.5,color:P.muted,fontWeight:400}}>· {fmtDate(c.createdAt)}</span></p>
                      {!isGuest&&c.userId!=null&&user?.id!=null&&Number(c.userId)===Number(user.id)&&<button type="button" onClick={()=>{setEditId(c.id);setEditText(c.content||'')}} style={{border:'none',background:'transparent',color:P.muted,cursor:'pointer',fontFamily:P.fM,fontSize:11,fontWeight:700,padding:0}}>Edit</button>}
                    </div>
                    {editId===c.id ? <div>
                      <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} style={{width:'100%',marginTop:8,borderRadius:10,border:`1px solid ${P.border}`,background:P.surface,padding:'10px 12px',fontFamily:P.fB,fontSize:13,color:P.ink,outline:'none',resize:'vertical'}} />
                      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
                        <button type="button" disabled={editSaving} onClick={()=>{setEditId(null);setEditText('')}} style={{padding:'7px 14px',borderRadius:10,border:`1px solid ${P.border}`,background:'transparent',cursor:'pointer',fontFamily:P.fB,fontSize:12,fontWeight:600,color:P.muted}}>Cancel</button>
                        <button type="button" disabled={!editText.trim()||editSaving} onClick={async()=>{
                          if(editSaving||isGuest||postId==null||user?.id==null) return;
                          const t=editText.trim(); if(!t) return; setEditSaving(true);
                          try{const u=await postsApi.updateComment(postId,c.id,{userId:user.id,content:t});setComments(p=>p.map(x=>x.id===c.id?{...x,content:u.content}:x));setEditId(null);setEditText('')}
                          catch(e2){setToast({message:e2?.message||'Failed.',type:'error'})}finally{setEditSaving(false)}
                        }} style={{padding:'7px 14px',borderRadius:10,border:'none',background:P.ink,cursor:'pointer',fontFamily:P.fB,fontSize:12,fontWeight:700,color:P.surface,opacity:(!editText.trim()||editSaving)?0.6:1}}>{editSaving?'Saving…':'Save'}</button>
                      </div>
                    </div> : <p style={{marginTop:3,fontFamily:P.fB,fontSize:13,color:P.ink,lineHeight:1.6}}>{c.content}</p>}
                  </div>
                </div>
              ))}</div>}
            </div>
          </>}
        </main>
        <aside style={{width:280,flexShrink:0}} />
      </div>
    </div>
  );
}

const S = {
  layout:{width:'100%',maxWidth:1240,margin:'0 auto',padding:'28px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center',gap:18},
  main:{flex:'0 1 640px',minWidth:0},
  back:{background:'none',border:'none',cursor:'pointer',color:P.muted,fontSize:13,fontWeight:600,marginBottom:20,fontFamily:P.fB,display:'flex',alignItems:'center',gap:6},
  errBox:{background:P.rosePale,border:`1px solid rgba(192,57,43,0.22)`,borderRadius:12,padding:14,color:P.rose,fontFamily:P.fB,fontSize:13},
  pCard:{background:P.card,borderRadius:20,border:`1px solid ${P.border}`,boxShadow:'0 4px 24px rgba(61,38,0,0.08)',overflow:'hidden',marginBottom:20},
  topLine:{height:4,background:`linear-gradient(90deg,transparent,${P.amber},${P.amberDark},transparent)`},
  pBtn:{border:'1.5px solid',borderRadius:50,padding:'8px 16px',fontFamily:P.fB,fontSize:13,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.2s'},
  oBtn:{border:`1.5px solid ${P.border}`,borderRadius:50,padding:'7px 14px',fontFamily:P.fB,fontSize:13,fontWeight:600,cursor:'pointer',background:'transparent',color:P.muted},
  aBtn:{border:`1.5px solid ${P.border}`,background:'transparent',borderRadius:10,padding:'9px 14px',fontFamily:P.fB,fontSize:13,fontWeight:700,cursor:'pointer',color:P.muted,transition:'all 0.2s'},
  ctaBtn:{padding:'10px 20px',borderRadius:50,border:'none',background:`linear-gradient(135deg,${P.amber},${P.amberDark})`,cursor:'pointer',fontFamily:P.fB,fontSize:13,fontWeight:700,color:P.ink,boxShadow:`0 2px 10px rgba(200,160,60,0.25)`,marginTop:0},
  ov:{position:'fixed',inset:0,background:'rgba(61,38,0,0.3)',zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',padding:18,backdropFilter:'blur(3px)'},
  modal:{width:'100%',maxWidth:420,background:P.card,borderRadius:22,border:`1px solid ${P.border}`,boxShadow:'0 24px 80px rgba(61,38,0,0.18)',padding:'28px 28px 24px',textAlign:'center',fontFamily:P.fB},
  mTitle:{fontFamily:P.fH,fontSize:20,fontWeight:700,color:P.ink,marginBottom:8},
  mBody:{color:P.muted,fontSize:14,lineHeight:1.65,marginBottom:22},
  btnC:{padding:'10px 22px',border:`1.5px solid ${P.border}`,borderRadius:12,background:'transparent',color:P.muted,fontWeight:600,cursor:'pointer',fontFamily:P.fB},
  btnD:{padding:'10px 24px',border:'none',borderRadius:12,background:P.ink,color:P.surface,fontWeight:700,cursor:'pointer',fontFamily:P.fB},
  moodWrap:{position:'relative',display:'inline-flex'},
  moodChipBtn:{fontFamily:P.fB,fontSize:12,color:P.amberDark,background:P.amberPale,border:`1px solid rgba(197,162,100,0.35)`,borderRadius:50,padding:'3px 10px',lineHeight:1.5,cursor:'pointer'},
  moodPopover:{position:'absolute',top:'calc(100% + 6px)',left:0,background:P.card,border:`1px solid ${P.border}`,borderRadius:14,boxShadow:'0 8px 32px rgba(61,38,0,0.1)',padding:6,zIndex:80,minWidth:170},
  moodItem:{width:'100%',background:'transparent',border:'none',cursor:'pointer',textAlign:'left',padding:'8px 10px',borderRadius:10,fontFamily:P.fB,fontSize:12.5,color:P.ink},
  moodItemActive:{background:P.amberPale,color:P.amberDark},
};
