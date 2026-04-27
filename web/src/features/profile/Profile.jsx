import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '@/core/components/Sidebar';
import ThoughtCard from '@/features/post/ThoughtCard';
import Avatar from '@/core/components/Avatar';
import Toast from '@/core/components/Toast';
import { useAuth } from '@/features/auth/useAuth';
import { userApi, filesApi, quotesApi, postsApi } from '@/core/api';

const P={bg:'#FFF8EE',card:'#ffffff',surface:'#F5ECD4',surfaceHi:'#EDE0C4',border:'rgba(197,162,100,0.28)',amber:'#E8C97A',amberDark:'#C9A84C',amberPale:'rgba(232,201,122,0.18)',ink:'#3D2600',muted:'#7A6040',rose:'#c0392b',rosePale:'rgba(192,57,43,0.07)',fH:"'Playfair Display','Georgia',serif",fB:"'Lora','Georgia',serif",fM:"'DM Mono',monospace"};
const CSS=`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:ital,wght@0,400;0,600&family=DM+Mono:wght@400;500&display=swap');`;
const TABS=['Thoughts','Liked','Saved'];
function fmt(v){if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return d.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});}
function fmtMY(v){if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return d.toLocaleDateString(undefined,{year:'numeric',month:'long'});}
const sx={label:{display:'block',marginBottom:6,fontFamily:P.fM,fontSize:10,fontWeight:500,letterSpacing:1.5,textTransform:'uppercase',color:P.muted},input:{width:'100%',padding:'11px 14px',background:P.surface,border:`1.5px solid ${P.border}`,borderRadius:12,outline:'none',fontSize:13,color:P.ink,fontFamily:P.fB,transition:'border-color 0.2s',boxSizing:'border-box'}};

export default function ProfilePage(){
  const navigate=useNavigate();const{userId}=useParams();const{user,login}=useAuth();
  const fileInputRef=useRef(null);const coverInputRef=useRef(null);
  const viewedUserId=userId!=null?Number(userId):null;
  const isMe=viewedUserId==null||(user?.id!=null&&Number(user.id)===viewedUserId);
  const[profileUser,setProfileUser]=useState(null);const[posts,setPosts]=useState([]);
  const[likedPosts,setLikedPosts]=useState([]);const[savedPosts,setSavedPosts]=useState([]);
  const[likedLoading,setLikedLoading]=useState(false);const[savedLoading,setSavedLoading]=useState(false);
  const[isFollowing,setIsFollowing]=useState(false);const[followBusy,setFollowBusy]=useState(false);
  const[pendingAvatarFile,setPendingAvatarFile]=useState(null);const[pendingCoverFile,setPendingCoverFile]=useState(null);
  const[avatarPreviewUrl,setAvatarPreviewUrl]=useState('');const[coverPreviewUrl,setCoverPreviewUrl]=useState('');
  const[quote,setQuote]=useState(null);const[tab,setTab]=useState(0);const[editing,setEditing]=useState(false);
  const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);
  const[editForm,setEditForm]=useState({firstName:user?.firstName||'',lastName:user?.lastName||'',bio:user?.bio||'',birthDate:user?.birthDate||''});
  const[error,setError]=useState('');const[toast,setToast]=useState(null);const[confirmDeleteId,setConfirmDeleteId]=useState(null);

  useEffect(()=>{if(!user){navigate('/login');return;}let c=false;const tid=viewedUserId!=null?viewedUserId:user?.id;if(tid==null){setLoading(false);return;}setLoading(true);setError('');setEditing(false);
    (async()=>{try{const[u,pp]=await Promise.all([userApi.getById(tid),postsApi.getAll(0,50)]);if(c)return;setProfileUser(u);const cont=Array.isArray(pp?.content)?pp.content:[];setPosts(cont.filter(p=>p?.userId!=null&&Number(p.userId)===Number(tid)));}catch(e){if(c)return;setProfileUser(null);setPosts([]);setError(e?.message||'Failed.');}finally{if(!c)setLoading(false);}})();
    return()=>{c=true};
  },[user,navigate,viewedUserId,isMe]);

  useEffect(()=>{const tid=viewedUserId!=null?viewedUserId:user?.id;if(tid==null)return;let c=false;setLikedLoading(true);userApi.getLikedPosts(tid).then(l=>{if(!c)setLikedPosts(Array.isArray(l)?l:[]);}).catch(()=>{if(!c)setLikedPosts([]);}).finally(()=>{if(!c)setLikedLoading(false);});return()=>{c=true};},[user?.id,viewedUserId]);
  useEffect(()=>{const tid=viewedUserId!=null?viewedUserId:user?.id;if(tid==null)return;let c=false;setSavedLoading(true);userApi.getSavedPosts(tid).then(l=>{if(!c)setSavedPosts(Array.isArray(l)?l:[]);}).catch(()=>{if(!c)setSavedPosts([]);}).finally(()=>{if(!c)setSavedLoading(false);});return()=>{c=true};},[user?.id,viewedUserId]);
  useEffect(()=>{if(!user?.id||isMe||viewedUserId==null)return;let c=false;userApi.getFollowStatus(viewedUserId,user.id).then(r=>{if(!c)setIsFollowing(!!r.following);}).catch(()=>{});return()=>{c=true};},[isMe,user?.id,viewedUserId]);
  useEffect(()=>{if(!isMe)return;setEditForm({firstName:user?.firstName||'',lastName:user?.lastName||'',bio:user?.bio||'',birthDate:user?.birthDate||''});},[isMe,user?.firstName,user?.lastName,user?.bio,user?.birthDate]);
  useEffect(()=>{quotesApi.getDailyQuote().then(setQuote).catch(()=>setQuote({quoteText:'Every day is a new page.',author:'DailyThoughts'}));},[]);
  useEffect(()=>{const u=avatarPreviewUrl;return()=>{if(u&&u.startsWith('blob:'))URL.revokeObjectURL(u)};},[avatarPreviewUrl]);
  useEffect(()=>{const u=coverPreviewUrl;return()=>{if(u&&u.startsWith('blob:'))URL.revokeObjectURL(u)};},[coverPreviewUrl]);

  const startEditing=()=>{setEditing(true);setError('');setPendingAvatarFile(null);setPendingCoverFile(null);setAvatarPreviewUrl('');setCoverPreviewUrl('');};
  const cancelEditing=()=>{setEditing(false);setError('');setPendingAvatarFile(null);setPendingCoverFile(null);setAvatarPreviewUrl('');setCoverPreviewUrl('');setEditForm({firstName:user?.firstName||'',lastName:user?.lastName||'',bio:user?.bio||'',birthDate:user?.birthDate||''});};
  const handleDelete=id=>setConfirmDeleteId(id);
  const confirmDelete=async()=>{const id=confirmDeleteId;if(id==null)return;try{await postsApi.delete(id);setPosts(p=>p.filter(x=>x.id!==id));setToast({message:'Post deleted.',type:'success'});}catch(e){setToast({message:e?.message||'Failed.',type:'error'});}finally{setConfirmDeleteId(null);}};
  const handleSaveProfile=async()=>{setSaving(true);setError('');try{let u=await userApi.updateProfile(editForm);if(pendingAvatarFile)u=await filesApi.uploadProfileImage(pendingAvatarFile);if(pendingCoverFile)u=await filesApi.uploadCoverImage(pendingCoverFile);login(localStorage.getItem('token'),{...user,...u});setProfileUser(u);setPendingAvatarFile(null);setPendingCoverFile(null);setAvatarPreviewUrl('');setCoverPreviewUrl('');setEditing(false);setToast({message:'Profile updated.',type:'success'});}catch(e){const m=e.message||'Failed.';setError(m);setToast({message:m,type:'error'});}finally{setSaving(false);}};
  const handleAvatarUpload=async e=>{const f=e.target.files[0];if(!f)return;const u=URL.createObjectURL(f);setPendingAvatarFile(f);setAvatarPreviewUrl(u);e.target.value='';};
  const handleCoverUpload=async e=>{const f=e.target.files[0];if(!f)return;const u=URL.createObjectURL(f);setPendingCoverFile(f);setCoverPreviewUrl(u);e.target.value='';};
  const toggleFollow=async()=>{if(!user?.id){navigate('/login');return;}if(viewedUserId==null||followBusy)return;setFollowBusy(true);try{const r=await userApi.toggleFollow(viewedUserId,user.id);setIsFollowing(!!r.following);setProfileUser(p=>p?{...p,followerCount:r.followerCount,followingCount:r.followingCount}:p);const me=await userApi.getById(user.id);login(localStorage.getItem('token'),{...user,...me});}catch(e){setToast({message:e?.message||'Failed.',type:'error'});}finally{setFollowBusy(false);};};

  if(!user)return null;
  const du=profileUser||user;
  const canEdit=isMe;
  const coverUrl=filesApi.getUrl(coverPreviewUrl||du?.coverImageUrl);
  const stats=[{num:posts.length,label:'THOUGHTS'},{num:du?.followerCount??0,label:'FOLLOWERS'},{num:du?.followingCount??0,label:'FOLLOWING'},{num:du?.totalLikes??0,label:'LIKES'}];

  return(
    <div style={{minHeight:'100vh',background:P.bg,fontFamily:P.fB}}>
      <style>{CSS}</style>
      <Toast message={toast?.message} type={toast?.type||'success'} onClose={()=>setToast(null)} />
      {confirmDeleteId!=null&&(
        <div style={{position:'fixed',inset:0,background:'rgba(61,38,0,0.3)',zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',padding:18,backdropFilter:'blur(3px)'}} onMouseDown={e=>{if(e.target===e.currentTarget)setConfirmDeleteId(null)}}>
          <div style={{width:'100%',maxWidth:420,background:P.card,borderRadius:22,border:`1px solid ${P.border}`,boxShadow:'0 24px 80px rgba(61,38,0,0.18)',padding:'28px',textAlign:'center',fontFamily:P.fB}}>
            <div style={{fontSize:32,marginBottom:12}}>🗑️</div>
            <h3 style={{fontFamily:P.fH,fontSize:20,fontWeight:700,color:P.ink,marginBottom:8}}>Delete Post?</h3>
            <p style={{color:P.muted,fontSize:14,marginBottom:22}}>This cannot be undone.</p>
            <div style={{display:'flex',justifyContent:'center',gap:12}}>
              <button type="button" onClick={()=>setConfirmDeleteId(null)} style={{padding:'10px 20px',border:`1.5px solid ${P.border}`,borderRadius:12,background:'transparent',color:P.muted,fontWeight:600,cursor:'pointer',fontFamily:P.fB}}>Cancel</button>
              <button type="button" onClick={confirmDelete} style={{padding:'10px 22px',border:'none',borderRadius:12,background:P.ink,color:P.surface,fontWeight:700,cursor:'pointer',fontFamily:P.fB}}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div style={{width:'100%',maxWidth:1240,margin:'0 auto',padding:'28px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center',gap:18}}>
        <Sidebar dailyQuote={quote} />
        <main style={{flex:'0 1 640px',minWidth:0,paddingBottom:60}}>
          {/* Cover */}
          <div style={{height:200,background:`linear-gradient(145deg,${P.amberPale},${P.surface},${P.surfaceHi})`,borderRadius:'0 0 20px 20px',marginBottom:-40,position:'relative',overflow:'hidden',...(coverUrl?{backgroundImage:`url(${coverUrl})`,backgroundSize:'cover',backgroundPosition:'center'}:{})}}>
            <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 20% 80%,rgba(232,201,122,0.3) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(197,162,100,0.2) 0%,transparent 50%)`}} />
            {canEdit&&editing&&<>
              <button onClick={()=>coverInputRef.current?.click()} style={{position:'absolute',top:12,right:12,width:34,height:34,borderRadius:50,border:`1.5px solid ${P.border}`,background:P.card,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,boxShadow:'0 2px 8px rgba(61,38,0,0.1)'}}>📷</button>
              <input ref={coverInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleCoverUpload} />
            </>}
          </div>

          <div style={{background:P.card,borderRadius:18,border:`1px solid ${P.border}`,boxShadow:'0 4px 24px rgba(61,38,0,0.08)',padding:'24px 28px',position:'relative',zIndex:2,marginBottom:0}}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16}}>
              <div style={{position:'relative'}}>
                <Avatar name={`${du?.firstName} ${du?.lastName}`} src={filesApi.getUrl(avatarPreviewUrl||du?.avatarUrl)} size="xl" style={{border:`4px solid ${P.card}`,marginTop:-52,cursor:canEdit&&editing?'pointer':'default'}} />
                {canEdit&&editing&&<><button onClick={()=>fileInputRef.current?.click()} style={{position:'absolute',bottom:-4,right:-4,width:26,height:26,background:P.card,border:`1.5px solid ${P.border}`,borderRadius:50,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12,boxShadow:'0 1px 6px rgba(61,38,0,0.08)'}}>📷</button><input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload} /></>}
              </div>
              {canEdit&&(!editing?<button onClick={startEditing} style={{padding:'8px 18px',border:`1.5px solid ${P.border}`,borderRadius:50,background:'transparent',fontSize:13,fontWeight:600,color:P.ink,cursor:'pointer',fontFamily:P.fB}}>✏️ Edit Profile</button>
              :<div style={{display:'flex',gap:8}}>
                <button onClick={cancelEditing} style={{padding:'8px 14px',border:`1.5px solid ${P.border}`,borderRadius:12,background:'transparent',fontSize:13,fontWeight:600,color:P.muted,cursor:'pointer',fontFamily:P.fB}}>Cancel</button>
                <button onClick={handleSaveProfile} disabled={saving} style={{padding:'8px 18px',background:`linear-gradient(135deg,${P.amber},${P.amberDark})`,border:'none',borderRadius:12,fontSize:13,fontWeight:700,color:P.ink,cursor:'pointer',fontFamily:P.fB,boxShadow:`0 2px 12px rgba(200,160,60,0.25)`}}>{saving?'Saving…':'✓ Save'}</button>
              </div>)}
              {!canEdit&&<button type="button" onClick={toggleFollow} disabled={followBusy} style={{border:`1.5px solid ${P.amber}`,borderRadius:50,padding:'10px 20px',fontSize:13,fontFamily:P.fB,fontWeight:700,background:isFollowing?P.amberPale:'transparent',color:P.amberDark,cursor:followBusy?'not-allowed':'pointer',opacity:followBusy?0.7:1}}>{isFollowing?'✓ Following':'Follow'}</button>}
            </div>

            {error&&<div style={{background:P.rosePale,border:`1px solid rgba(192,57,43,0.22)`,borderRadius:12,padding:'10px 14px',fontSize:13,color:P.rose,marginBottom:14,fontFamily:P.fB}}>⚠️ {error}</div>}

            {canEdit&&editing?(<div style={{marginBottom:16}}>
              <div style={{display:'flex',gap:12,marginBottom:12}}>
                {[['firstName','First Name'],['lastName','Last Name']].map(([k,l])=><div key={k} style={{flex:1}}><label style={sx.label}>{l}</label><input style={sx.input} value={editForm[k]} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))} onFocus={e=>e.target.style.borderColor=P.amberDark} onBlur={e=>e.target.style.borderColor=P.border} /></div>)}
              </div>
              <div style={{marginBottom:12}}><label style={sx.label}>Bio</label><textarea style={{...sx.input,minHeight:80,resize:'vertical'}} value={editForm.bio} onChange={e=>setEditForm(f=>({...f,bio:e.target.value}))} onFocus={e=>e.target.style.borderColor=P.amberDark} onBlur={e=>e.target.style.borderColor=P.border} /></div>
              <div><label style={sx.label}>Birth Date</label><input type="date" style={sx.input} value={editForm.birthDate} onChange={e=>setEditForm(f=>({...f,birthDate:e.target.value}))} onFocus={e=>e.target.style.borderColor=P.amberDark} onBlur={e=>e.target.style.borderColor=P.border} /></div>
            </div>):(<>
              <h1 style={{fontFamily:P.fH,fontSize:26,fontWeight:700,color:P.ink,marginBottom:4}}>{du?.firstName} {du?.lastName}</h1>
              <p style={{fontFamily:P.fM,fontSize:12.5,color:P.muted,marginBottom:10}}>{du?.email}</p>
              {du?.bio&&<p style={{fontSize:13.5,color:P.ink,fontFamily:P.fB,lineHeight:1.6,marginBottom:10}}>{du?.bio}</p>}
              {(du?.birthDate||du?.joinedAt)&&<div style={{display:'flex',gap:16,marginBottom:12}}>
                {du?.birthDate&&<span style={{fontSize:12,color:P.muted,fontFamily:P.fB}}>🎂 Born {fmt(du?.birthDate)}</span>}
                {du?.joinedAt&&<span style={{fontSize:12,color:P.muted,fontFamily:P.fB}}>📅 Joined {fmtMY(du?.joinedAt)}</span>}
              </div>}
            </>)}

            <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 14px',background:P.amberPale,borderRadius:50,fontSize:11,fontWeight:700,color:P.amberDark,fontFamily:P.fM,marginBottom:16}}>✦ ROLE: {du?.role||'USER'}</div>

            <div style={{display:'flex',gap:32}}>
              {stats.map(s=><div key={s.label}><div style={{fontFamily:P.fH,fontSize:24,fontWeight:700,color:P.ink}}>{s.num.toLocaleString()}</div><div style={{fontFamily:P.fM,fontSize:10,color:P.muted,letterSpacing:1}}>{s.label}</div></div>)}
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:'flex',borderBottom:`2px solid ${P.border}`,margin:'22px 0 18px'}}>
            {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'11px 20px',border:'none',background:'transparent',fontSize:14,fontWeight:600,color:tab===i?P.amberDark:P.muted,cursor:'pointer',borderBottom:`2px solid ${tab===i?P.amber:'transparent'}`,marginBottom:-2,fontFamily:P.fB,transition:'all 0.2s'}}>{t}</button>)}
          </div>

          {tab===0&&(loading?<p style={{textAlign:'center',color:P.muted,padding:32,fontFamily:P.fB}}>Loading…</p>:posts.length===0?<div style={{textAlign:'center',padding:'56px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}><span style={{fontSize:48}}>📓</span><p style={{color:P.muted,fontFamily:P.fB}}>{canEdit?"You haven't shared any thoughts yet.":'No thoughts yet.'}</p>{canEdit&&<button onClick={()=>navigate('/create')} style={{padding:'12px 28px',background:`linear-gradient(135deg,${P.amber},${P.amberDark})`,border:'none',borderRadius:50,fontSize:14,fontWeight:700,color:P.ink,cursor:'pointer',fontFamily:P.fB,boxShadow:`0 3px 14px rgba(200,160,60,0.3)`}}>Share Your First Thought</button>}</div>:posts.map(post=><ThoughtCard key={post.id} post={post} viewer={user} onDelete={canEdit?handleDelete:undefined} />))}
          {tab===1&&(likedLoading?<p style={{textAlign:'center',color:P.muted,padding:32,fontFamily:P.fB}}>Loading…</p>:likedPosts.length===0?<div style={{textAlign:'center',padding:'48px 20px',color:P.muted,fontFamily:P.fB}}><div style={{fontSize:40,marginBottom:12}}>❤️</div><p>Your liked thoughts will appear here.</p></div>:likedPosts.map(post=><ThoughtCard key={post.id} post={post} viewer={user} initialLiked />))}
          {tab===2&&(savedLoading?<p style={{textAlign:'center',color:P.muted,padding:32,fontFamily:P.fB}}>Loading…</p>:savedPosts.length===0?<div style={{textAlign:'center',padding:'48px 20px',color:P.muted,fontFamily:P.fB}}><div style={{fontSize:40,marginBottom:12}}>🔖</div><p>Your saved thoughts will appear here.</p></div>:savedPosts.map(post=><ThoughtCard key={post.id} post={post} viewer={user} initialSaved />))}
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

function RightSidebar(){
  const navigate=useNavigate();const{user}=useAuth();const isGuest=!user;
  const trending=[{name:'Morning Routine',count:'142 thoughts today'},{name:'Gratitude Journal',count:'98 thoughts today'},{name:'Mindfulness',count:'76 thoughts today'},{name:'Self Reflection',count:'61 thoughts today'}];
  const suggested=[{name:'Karla Manalo',sub:'34 thoughts this week'},{name:'Ben Cruz',sub:'Philosophy · Stoicism'},{name:'Lena Park',sub:'Mindfulness · Wellness'}];
  const[followed,setFollowed]=useState({});const[query,setQuery]=useState('');const[userResults,setUserResults]=useState([]);const[userLoading,setUserLoading]=useState(false);const[userError,setUserError]=useState('');
  const q=query.trim().toLowerCase();
  useEffect(()=>{const t=query.trim();let ig=false;const id=setTimeout(()=>{if(!t)return;setUserLoading(true);setUserError('');userApi.search(t,{limit:25}).then(l=>{if(!ig)setUserResults(l);}).catch(e=>{if(!ig){setUserError(e?.message||'Failed.');setUserResults([]);}}).finally(()=>{if(!ig)setUserLoading(false);});},250);return()=>{ig=true;clearTimeout(id);};},[query]);
  const lu=q?userResults:suggested;
  return(
    <aside style={{flex:'0 0 300px',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{background:P.card,borderRadius:50,border:`1px solid ${P.border}`,padding:'10px 14px',marginBottom:0,display:'flex',alignItems:'center',gap:10,boxShadow:'0 1px 8px rgba(61,38,0,0.04)'}}>
        <span style={{fontSize:13,opacity:0.4}}>🔎</span>
        <input value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value.trim()){setUserResults([]);setUserLoading(false);setUserError('');}}} placeholder="Search" style={{width:'100%',border:'none',outline:'none',fontFamily:P.fB,fontSize:13,color:P.ink,background:'transparent'}} />
      </div>
      {[['📈 Trending Topics',trending.map((t,i)=>(<div key={t.name} style={{display:'flex',gap:10,padding:'9px 0',borderTop:`1px solid ${P.border}`}}><span style={{fontFamily:P.fH,color:P.amberDark,width:18,fontWeight:700}}>{i+1}</span><div><p style={{fontFamily:P.fB,fontWeight:600,color:P.ink,fontSize:13}}>{t.name}</p><p style={{fontFamily:P.fB,color:P.muted,fontSize:11.5}}>{t.count}</p></div></div>))],['👥 People to Follow',userLoading?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>Searching…</p>:userError?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>{userError}</p>:lu.length===0?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>No results.</p>:lu.map(u=>{const id=u?.id;const name=u?.firstName||u?.lastName?`${u?.firstName||''} ${u?.lastName||''}`.trim():(u?.name||u?.email||'Unknown');const sub=u?.sub||u?.email||'';const key=id!=null?`u:${id}`:`s:${name}`;const fk=id!=null?String(id):name;return(<div key={key} style={{display:'flex',gap:10,alignItems:'center',padding:'9px 0',borderTop:`1px solid ${P.border}`}}><div onClick={()=>id!=null&&navigate(`/profile/${id}`)} style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0,cursor:id!=null?'pointer':'default'}}><Avatar name={name} src={u?.avatarUrl} size="sm" /><div><p style={{fontFamily:P.fH,fontSize:13,color:P.ink,fontWeight:700}}>{name}</p><p style={{fontFamily:P.fB,color:P.muted,fontSize:11.5}}>{sub}</p></div></div><button onClick={async()=>{if(id==null)return;if(isGuest){navigate('/login');return;}try{const r=await userApi.toggleFollow(id,user?.id??null);setFollowed(f=>({...f,[fk]:!!r.following}));}catch(e){alert(e?.message||'Failed.');}}} style={{border:`1.5px solid ${P.amber}`,borderRadius:50,padding:'5px 14px',fontFamily:P.fB,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',background:followed[fk]?P.amberPale:'transparent',color:P.amberDark}}>{followed[fk]?'✓ Following':'Follow'}</button></div>);})]].map(([title,content])=>(
        <div key={title} style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:18,padding:'16px',boxShadow:'0 2px 12px rgba(61,38,0,0.05)'}}>
          <p style={{fontFamily:P.fM,fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:1.5,marginBottom:12}}>{title}</p>
          {content}
        </div>
      ))}
    </aside>
  );
}