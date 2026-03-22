import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { postsApi, filesApi, draftsApi, userApi } from '../utils/api';

const P={bg:'#FFF8EE',card:'#ffffff',surface:'#F5ECD4',surfaceHi:'#EDE0C4',border:'rgba(197,162,100,0.28)',amber:'#E8C97A',amberDark:'#C9A84C',amberPale:'rgba(232,201,122,0.18)',ink:'#3D2600',muted:'#7A6040',rose:'#c0392b',rosePale:'rgba(192,57,43,0.07)',fH:"'Playfair Display','Georgia',serif",fB:"'Lora','Georgia',serif",fM:"'DM Mono',monospace"};
const CSS=`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:ital,wght@0,400;0,600&family=DM+Mono:wght@400;500&display=swap');.dt-dz:hover{border-color:${P.amberDark}!important;background:${P.amberPale}!important;}`;
const MOODS=[{emoji:'😊',label:'Happy'},{emoji:'🤔',label:'Reflective'},{emoji:'😢',label:'Sad'},{emoji:'💪',label:'Motivated'},{emoji:'😌',label:'Peaceful'},{emoji:'😤',label:'Frustrated'},{emoji:'🎉',label:'Excited'},{emoji:'😴',label:'Tired'}];
const MAX=500;

export default function CreatePostPage(){
  const navigate=useNavigate();const location=useLocation();const{user}=useAuth();const fileInputRef=useRef(null);
  const[content,setContent]=useState(location.state?.prefill||'');const[mood,setMood]=useState(null);const[imageFile,setImageFile]=useState(null);const[imagePreview,setImagePreview]=useState(null);const[loading,setLoading]=useState(false);const[error,setError]=useState('');
  const left=MAX-content.length;const over=left<0;
  useEffect(()=>{if(!user)navigate('/login',{replace:true});},[user,navigate]);
  const handleImageSelect=e=>{const f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024){setError('Image must be under 5MB.');return;}setImageFile(f);const r=new FileReader();r.onload=ev=>setImagePreview(ev.target.result);r.readAsDataURL(f);};
  const handleDropzone=e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/')){const fe={target:{files:[f]}};handleImageSelect(fe);}};
  const handlePublish=async e=>{e?.preventDefault?.();if(!content.trim()){setError('Please write something.');return;}if(over){setError(`Exceeds ${MAX} characters.`);return;}setLoading(true);setError('');try{let p=await postsApi.create({userId:user?.id??null,content:content.trim(),mood:mood?.label??null});if(imageFile)p=await filesApi.upload(p.id,imageFile);sessionStorage.setItem('dt_toast',JSON.stringify({message:'Post uploaded.',type:'success'}));navigate(`/post/${p.id}`,{replace:true,state:{post:p,fromCreate:true}});}catch(err){setError(err.message||'Failed.');}finally{setLoading(false);};};
  const handleDraft=async()=>{const t=String(content||'').trim();if(!t&&!mood)return;if(!user?.id)return;try{await draftsApi.save({userId:user.id,title:null,content:t,mood:mood?.label??null,status:'draft'});sessionStorage.setItem('dt_toast',JSON.stringify({message:'Draft saved.',type:'success'}));navigate('/feed');}catch(e){setError(e?.message||'Failed to save draft.');};};
  useEffect(()=>{if(!user?.id||location.state?.prefill)return;let c=false;const load=async()=>{try{const d=await draftsApi.getMy(user.id);if(c||!d)return;setContent(d.content||'');const nm=d.mood?MOODS.find(m=>m.label===d.mood):null;setMood(nm||null);}catch{return null;}};load();return()=>{c=true};},[location.state?.prefill,user?.id]);

  return(
    <div style={{minHeight:'100vh',background:P.bg,fontFamily:P.fB}}>
      <style>{CSS}</style>
      <div style={{width:'100%',maxWidth:1240,margin:'0 auto',padding:'28px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center',gap:18}}>
        <Sidebar />
        <main style={{flex:'0 1 640px',minWidth:0}}>
          <button type="button" onClick={()=>navigate(-1)} style={{background:'none',border:'none',cursor:'pointer',color:P.muted,fontSize:13,fontWeight:600,marginBottom:20,fontFamily:P.fB,display:'flex',alignItems:'center',gap:6}}>← Back</button>

          <div style={{background:P.card,borderRadius:20,padding:'0 0 0 0',border:`1px solid ${P.border}`,boxShadow:'0 4px 24px rgba(61,38,0,0.08)',overflow:'hidden',marginBottom:16}}>
            <div style={{height:4,background:`linear-gradient(90deg,transparent,${P.amber},${P.amberDark},transparent)`}} />
            <div style={{padding:'24px 28px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <h1 style={{fontFamily:P.fH,fontSize:22,fontWeight:700,color:P.ink}}>Share a Thought</h1>
                <div style={{fontFamily:P.fM,fontSize:12,color:over?P.rose:left<50?P.amberDark:P.muted,transition:'color 0.2s'}}><span style={{fontWeight:over?700:400}}>{content.length}</span> / {MAX}</div>
              </div>
              {error&&<div style={{background:P.rosePale,border:`1px solid rgba(192,57,43,0.22)`,borderRadius:12,padding:'10px 14px',fontSize:13,color:P.rose,marginBottom:16,fontFamily:P.fB}}>⚠️ {error}</div>}
              <div style={{display:'flex',gap:14,marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${P.border}`}}>
                <Avatar name={`${user?.firstName} ${user?.lastName}`} src={filesApi.getUrl(user?.avatarUrl)} size="md" />
                <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="What's been on your mind today?…" style={{flex:1,border:`2px solid ${over?P.rose:'transparent'}`,borderRadius:12,background:P.surface,padding:12,resize:'none',fontFamily:P.fB,fontSize:17,color:P.ink,outline:'none',minHeight:140,lineHeight:1.7,transition:'border-color 0.2s'}} autoFocus />
              </div>

              {/* Mood */}
              <div style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${P.border}`}}>
                <p style={{fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:1.2,marginBottom:12,fontFamily:P.fM}}>How are you feeling?</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {MOODS.map(m=><button key={m.label} onClick={()=>setMood(mood?.label===m.label?null:m)} style={{padding:'7px 14px',borderRadius:50,cursor:'pointer',fontSize:13,fontFamily:P.fB,background:mood?.label===m.label?P.amberPale:'transparent',border:`1.5px solid ${mood?.label===m.label?P.amber:P.border}`,color:mood?.label===m.label?P.amberDark:P.muted,transition:'all 0.2s'}}>{m.emoji} {m.label}</button>)}
                </div>
              </div>

              {/* Image */}
              <div style={{marginBottom:20}}>
                <p style={{fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:1.2,marginBottom:12,fontFamily:P.fM}}>Attach an image (optional)</p>
                {imagePreview?<div style={{position:'relative',borderRadius:12,overflow:'hidden',maxHeight:300}}><img src={imagePreview} alt="Preview" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} /><button type="button" onClick={()=>{setImageFile(null);setImagePreview(null);if(fileInputRef.current)fileInputRef.current.value='';}} style={{position:'absolute',top:12,right:12,background:'rgba(61,38,0,0.75)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:50,cursor:'pointer',fontSize:12,fontFamily:P.fB}}>✕ Remove</button></div>
                :<div className="dt-dz" onClick={()=>fileInputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={handleDropzone} style={{border:`2px dashed ${P.border}`,borderRadius:16,padding:36,textAlign:'center',cursor:'pointer',transition:'all 0.2s'}}><div style={{fontSize:36,marginBottom:10}}>🖼️</div><p style={{fontSize:14,color:P.muted,fontFamily:P.fB,marginBottom:4}}>Drop an image here or <span style={{color:P.amberDark,fontWeight:600}}>browse files</span></p><p style={{fontSize:12,color:P.border,fontFamily:P.fM}}>JPG, PNG, WebP · Max 5MB</p></div>}
                <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImageSelect} />
              </div>

              {/* Footer */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                <button type="button" onClick={handleDraft} disabled={!content.trim()&&!mood} style={{padding:'10px 18px',border:`1.5px solid ${P.border}`,borderRadius:12,background:'transparent',fontSize:13,fontWeight:600,color:P.muted,cursor:(!content.trim()&&!mood)?'not-allowed':'pointer',fontFamily:P.fB,opacity:(!content.trim()&&!mood)?0.6:1}}>💾 Save Draft</button>
                <div style={{display:'flex',gap:10}}>
                  <button type="button" onClick={()=>navigate(-1)} style={{padding:'10px 18px',border:`1.5px solid ${P.border}`,borderRadius:12,background:'transparent',fontSize:13,fontWeight:600,color:P.muted,cursor:'pointer',fontFamily:P.fB}}>Cancel</button>
                  <button type="button" onClick={handlePublish} disabled={loading||over||!content.trim()} style={{padding:'11px 26px',background:`linear-gradient(135deg,${P.amber},${P.amberDark})`,border:'none',borderRadius:12,fontSize:14,fontWeight:700,color:P.ink,cursor:(loading||over||!content.trim())?'not-allowed':'pointer',fontFamily:P.fB,opacity:(loading||over||!content.trim())?0.6:1,boxShadow:`0 3px 14px rgba(200,160,60,0.3)`,transition:'all 0.2s'}}>{loading?'Publishing…':'Publish Thought →'}</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{background:P.surface,borderRadius:16,padding:'18px 20px',border:`1px solid ${P.border}`}}>
            <p style={{fontSize:12,fontWeight:700,color:P.muted,marginBottom:10,fontFamily:P.fM}}>✨ Writing Tips</p>
            <ul style={{paddingLeft:18,color:P.muted,fontSize:13,lineHeight:1.8,fontFamily:P.fB}}>
              <li>Be authentic — the most resonant thoughts come from the heart.</li>
              <li>Reflect before you post. Quality over quantity.</li>
              <li>Use Ctrl+Enter to quickly submit.</li>
            </ul>
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

function RightSidebar(){
  const navigate=useNavigate();const{user}=useAuth();const isGuest=!user;
  const suggested=[{name:'Karla Manalo',sub:'34 thoughts'},{name:'Ben Cruz',sub:'Philosophy'},{name:'Lena Park',sub:'Mindfulness'}];
  const[followed,setFollowed]=useState({});const[query,setQuery]=useState('');const[userResults,setUserResults]=useState([]);const[uL,setUL]=useState(false);const[uE,setUE]=useState('');
  const q=query.trim().toLowerCase();
  useEffect(()=>{const t=query.trim();let ig=false;const id=setTimeout(()=>{if(!t)return;setUL(true);setUE('');userApi.search(t,{limit:25}).then(l=>{if(!ig)setUserResults(l);}).catch(e=>{if(!ig){setUE(e?.message||'Failed.');setUserResults([]);}}).finally(()=>{if(!ig)setUL(false);});},250);return()=>{ig=true;clearTimeout(id);};},[query]);
  const lu=q?userResults:suggested;
  return(
    <aside style={{flex:'0 0 280px',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{background:P.card,borderRadius:50,border:`1px solid ${P.border}`,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 1px 8px rgba(61,38,0,0.04)'}}>
        <span style={{fontSize:13,opacity:0.4}}>🔎</span>
        <input value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value.trim()){setUserResults([]);setUL(false);setUE('');}}} placeholder="Search users" style={{width:'100%',border:'none',outline:'none',fontFamily:P.fB,fontSize:13,color:P.ink,background:'transparent'}} />
      </div>
      <div style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:18,padding:16,boxShadow:'0 2px 12px rgba(61,38,0,0.05)'}}>
        <p style={{fontFamily:P.fM,fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:1.5,marginBottom:12}}>👥 People to Follow</p>
        {uL?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>Searching…</p>:uE?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>{uE}</p>:lu.length===0?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>No results.</p>:lu.map(u=>{const id=u?.id;const name=u?.firstName||u?.lastName?`${u?.firstName||''} ${u?.lastName||''}`.trim():(u?.name||u?.email||'Unknown');const sub=u?.sub||u?.email||'';const key=id!=null?`u:${id}`:`s:${name}`;const fk=id!=null?String(id):name;return(<div key={key} style={{display:'flex',gap:10,alignItems:'center',padding:'9px 0',borderTop:`1px solid ${P.border}`}}><div onClick={()=>id!=null&&navigate(`/profile/${id}`)} style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0,cursor:id!=null?'pointer':'default'}}><Avatar name={name} src={u?.avatarUrl} size="sm" /><div><p style={{fontFamily:P.fH,fontSize:13,color:P.ink,fontWeight:700}}>{name}</p><p style={{fontFamily:P.fB,color:P.muted,fontSize:11.5}}>{sub}</p></div></div><button onClick={async()=>{if(id==null)return;if(isGuest){navigate('/login');return;}try{const r=await userApi.toggleFollow(id,user?.id??null);setFollowed(f=>({...f,[fk]:!!r.following}));}catch(e){alert(e?.message||'Failed.');}}} style={{border:`1.5px solid ${P.amber}`,borderRadius:50,padding:'5px 12px',fontFamily:P.fB,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',background:followed[fk]?P.amberPale:'transparent',color:P.amberDark}}>{followed[fk]?'✓ Following':'Follow'}</button></div>);})}
      </div>
    </aside>
  );
}
