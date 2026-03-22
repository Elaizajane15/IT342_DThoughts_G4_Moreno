import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import Toast from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { draftsApi, quotesApi, userApi } from '../utils/api'

const P={bg:'#FFF8EE',card:'#ffffff',surface:'#F5ECD4',surfaceHi:'#EDE0C4',border:'rgba(197,162,100,0.28)',amber:'#E8C97A',amberDark:'#C9A84C',amberPale:'rgba(232,201,122,0.18)',ink:'#3D2600',muted:'#7A6040',rose:'#c0392b',rosePale:'rgba(192,57,43,0.07)',fH:"'Playfair Display','Georgia',serif",fB:"'Lora','Georgia',serif",fM:"'DM Mono',monospace"};

export default function DraftsPage(){
  const navigate=useNavigate();const{user}=useAuth();const isGuest=!user;
  const[quote,setQuote]=useState(null);const[draft,setDraft]=useState(null);const[loading,setLoading]=useState(true);const[toast,setToast]=useState(null);const[error,setError]=useState('');
  useEffect(()=>{if(isGuest)navigate('/login',{replace:true});},[isGuest,navigate]);
  useEffect(()=>{quotesApi.getDailyQuote().then(setQuote).catch(()=>setQuote(null));},[]);
  useEffect(()=>{const raw=sessionStorage.getItem('dt_toast');if(!raw)return;sessionStorage.removeItem('dt_toast');let next=null;try{const p=JSON.parse(raw);if(p?.message)next={message:String(p.message),type:p.type==='error'?'error':'success'};}catch{next={message:String(raw),type:'success'};};if(!next)return;Promise.resolve().then(()=>setToast(next));},[]);
  useEffect(()=>{if(!user?.id)return;let c=false;Promise.resolve().then(()=>{if(!c){setLoading(true);setError('');}});draftsApi.getMy(user.id).then(d=>{if(!c)setDraft(d);}).catch(e=>{if(!c){setDraft(null);setError(e?.message||'Failed.');}}).finally(()=>{if(!c)setLoading(false);});return()=>{c=true};},[user?.id]);
  const handleDelete=async()=>{if(!draft?.id)return;try{await draftsApi.delete(draft.id);setDraft(null);setToast({message:'Draft deleted.',type:'success'});}catch(e){setToast({message:e?.message||'Failed.',type:'error'});}};
  const subtitle=(()=>{if(!draft?.updatedAt&&!draft?.createdAt)return null;const raw=draft.updatedAt||draft.createdAt;const d=new Date(raw);if(Number.isNaN(d.getTime()))return null;return d.toLocaleString();})();

  return(
    <div style={{minHeight:'100vh',background:P.bg,fontFamily:P.fB}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:ital,wght@0,400;0,600&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <Toast message={toast?.message} type={toast?.type||'success'} onClose={()=>setToast(null)} />
      <div style={{width:'100%',maxWidth:1240,margin:'0 auto',padding:'28px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center',gap:18}}>
        <Sidebar dailyQuote={quote} />
        <main style={{flex:'0 1 640px',minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:16}}>
            <h1 style={{fontFamily:P.fH,fontSize:24,fontWeight:700,color:P.ink}}>Your Drafts</h1>
            <button type="button" onClick={()=>navigate('/create')} style={{padding:'10px 18px',borderRadius:50,background:`linear-gradient(135deg,${P.amber},${P.amberDark})`,border:'none',cursor:'pointer',fontFamily:P.fB,fontWeight:700,color:P.ink,boxShadow:`0 2px 12px rgba(200,160,60,0.25)`,fontSize:13}}>✏️ New Thought</button>
          </div>
          {error&&<div style={{background:P.rosePale,border:`1px solid rgba(192,57,43,0.22)`,borderRadius:12,padding:'10px 14px',fontSize:13,color:P.rose,marginBottom:14,fontFamily:P.fB}}>⚠️ {error}</div>}
          {loading?<p style={{padding:'22px 0',color:P.muted,fontFamily:P.fB}}>Loading…</p>
          :!draft?<div style={{background:P.card,borderRadius:20,padding:'36px 28px',border:`1px solid ${P.border}`,boxShadow:'0 2px 16px rgba(61,38,0,0.06)',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:10}}>📄</div>
            <h3 style={{fontFamily:P.fH,fontSize:18,fontWeight:700,color:P.ink,marginBottom:6}}>No saved drafts yet</h3>
            <p style={{fontFamily:P.fB,fontSize:13,color:P.muted,marginBottom:20}}>Save a draft from Feed or New Thought — it will show here.</p>
            <button type="button" onClick={()=>navigate('/create')} style={{padding:'11px 24px',borderRadius:50,background:'transparent',border:`1.5px solid ${P.border}`,cursor:'pointer',fontFamily:P.fB,fontWeight:700,color:P.muted}}>Continue Writing</button>
          </div>
          :<div style={{background:P.card,borderRadius:20,border:`1px solid ${P.border}`,boxShadow:'0 4px 24px rgba(61,38,0,0.08)',overflow:'hidden'}}>
            <div style={{height:4,background:`linear-gradient(90deg,transparent,${P.amber},${P.amberDark},transparent)`}} />
            <div style={{padding:'24px 28px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:16}}>
                <div style={{minWidth:0}}>
                  <p style={{fontFamily:P.fH,fontSize:17,fontWeight:700,color:P.ink,marginBottom:4}}>{draft.title||'Untitled draft'}</p>
                  {subtitle&&<p style={{fontFamily:P.fM,fontSize:11,color:P.muted}}>Last saved: {subtitle}</p>}
                </div>
                {draft.mood&&<span style={{padding:'5px 12px',borderRadius:50,border:`1px solid ${P.border}`,fontFamily:P.fB,fontSize:12,color:P.muted,background:P.surface,whiteSpace:'nowrap'}}>😊 {draft.mood}</span>}
              </div>
              <div style={{whiteSpace:'pre-wrap',fontFamily:P.fB,fontSize:14,color:P.ink,lineHeight:1.75,padding:'14px 16px',borderRadius:12,border:`1px solid ${P.border}`,background:P.surface,marginBottom:20}}>{draft.content}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                <button type="button" onClick={()=>navigate('/create')} style={{padding:'10px 18px',borderRadius:12,background:'transparent',border:`1.5px solid ${P.border}`,cursor:'pointer',fontFamily:P.fB,fontWeight:600,color:P.muted}}>Continue Writing</button>
                <button type="button" onClick={handleDelete} style={{padding:'10px 18px',borderRadius:12,background:P.rosePale,border:`1.5px solid rgba(192,57,43,0.2)`,cursor:'pointer',fontFamily:P.fB,fontWeight:700,color:P.rose}}>Delete Draft</button>
              </div>
            </div>
          </div>}
        </main>
        <RightSidebarDrafts />
      </div>
    </div>
  );
}

function RightSidebarDrafts(){
  const navigate=useNavigate();const{user}=useAuth();const isGuest=!user;
  const trending=[{name:'Morning Routine',count:'142 thoughts today'},{name:'Gratitude Journal',count:'98 thoughts today'},{name:'Mindfulness',count:'76 thoughts today'}];
  const suggested=[{name:'Karla Manalo',sub:'34 thoughts'},{name:'Ben Cruz',sub:'Philosophy'},{name:'Lena Park',sub:'Mindfulness'}];
  const[followed,setFollowed]=useState({});const[query,setQuery]=useState('');const[ur,setUr]=useState([]);const[uL,setUL]=useState(false);const[uE,setUE]=useState('');
  const q=query.trim().toLowerCase();
  useEffect(()=>{const t=query.trim();let ig=false;const id=setTimeout(()=>{if(!t)return;setUL(true);setUE('');userApi.search(t,{limit:25}).then(l=>{if(!ig)setUr(l);}).catch(e=>{if(!ig){setUE(e?.message||'Failed.');setUr([]);}}).finally(()=>{if(!ig)setUL(false);});},250);return()=>{ig=true;clearTimeout(id);};},[query]);
  const lu=q?ur:suggested;
  return(
    <aside style={{width:280,flexShrink:0,position:'sticky',top:24,maxHeight:'calc(100vh - 48px)',overflowY:'auto',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{background:P.card,borderRadius:50,border:`1px solid ${P.border}`,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 1px 8px rgba(61,38,0,0.04)'}}>
        <span style={{fontSize:13,opacity:0.4}}>🔎</span>
        <input value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value.trim()){setUr([]);setUL(false);setUE('');}}} placeholder="Search" style={{width:'100%',border:'none',outline:'none',fontFamily:P.fB,fontSize:13,color:P.ink,background:'transparent'}} />
      </div>
      <div style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:18,padding:16,boxShadow:'0 2px 12px rgba(61,38,0,0.05)'}}>
        <p style={{fontFamily:P.fM,fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:1.5,marginBottom:12}}>📈 Trending Topics</p>
        {trending.map((t,i)=><div key={t.name} style={{display:'flex',gap:10,padding:'9px 0',borderTop:`1px solid ${P.border}`}}><span style={{fontFamily:P.fH,color:P.amberDark,width:18,fontWeight:700}}>{i+1}</span><div><p style={{fontFamily:P.fB,fontWeight:600,color:P.ink,fontSize:13}}>{t.name}</p><p style={{fontFamily:P.fB,color:P.muted,fontSize:11.5}}>{t.count}</p></div></div>)}
      </div>
      <div style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:18,padding:16,boxShadow:'0 2px 12px rgba(61,38,0,0.05)'}}>
        <p style={{fontFamily:P.fM,fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:1.5,marginBottom:12}}>👥 People to Follow</p>
        {uL?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>Searching…</p>:uE?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>{uE}</p>:lu.length===0?<p style={{color:P.muted,fontSize:12,fontFamily:P.fB}}>No results.</p>:lu.map(u=>{const id=u?.id;const name=u?.firstName||u?.lastName?`${u?.firstName||''} ${u?.lastName||''}`.trim():(u?.name||u?.email||'Unknown');const sub=u?.sub||u?.email||'';const key=id!=null?`u:${id}`:`s:${name}`;const fk=id!=null?String(id):name;return(<div key={key} style={{display:'flex',gap:10,alignItems:'center',padding:'9px 0',borderTop:`1px solid ${P.border}`}}><div onClick={()=>id!=null&&navigate(`/profile/${id}`)} style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0,cursor:id!=null?'pointer':'default'}}><Avatar name={name} src={u?.avatarUrl} size="sm" /><div><p style={{fontFamily:P.fH,fontSize:13,color:P.ink,fontWeight:700}}>{name}</p><p style={{fontFamily:P.fB,color:P.muted,fontSize:11.5}}>{sub}</p></div></div><button onClick={async()=>{if(id==null)return;if(isGuest){navigate('/login');return;}try{const r=await userApi.toggleFollow(id,user?.id??null);setFollowed(f=>({...f,[fk]:!!r.following}));}catch(e){alert(e?.message||'Failed.');}}} style={{border:`1.5px solid ${P.amber}`,borderRadius:50,padding:'5px 12px',fontFamily:P.fB,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',background:followed[fk]?P.amberPale:'transparent',color:P.amberDark}}>{followed[fk]?'✓ Following':'Follow'}</button></div>);})}
      </div>
    </aside>
  );
}
