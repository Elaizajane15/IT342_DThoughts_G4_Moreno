import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { postsApi, filesApi } from '../utils/api';

const P={bg:'#FFF8EE',card:'#ffffff',surface:'#F5ECD4',border:'rgba(197,162,100,0.28)',amber:'#E8C97A',amberDark:'#C9A84C',amberPale:'rgba(232,201,122,0.18)',ink:'#3D2600',muted:'#7A6040',rose:'#c0392b',rosePale:'rgba(192,57,43,0.07)',fH:"'Playfair Display','Georgia',serif",fB:"'Lora','Georgia',serif",fM:"'DM Mono',monospace"};
const MAX=500;

export default function EditPostPage(){
  const{id}=useParams();const navigate=useNavigate();const location=useLocation();const{user}=useAuth();const isGuest=!user;const fileInputRef=useRef(null);
  const postId=useMemo(()=>{const n=Number(id);return Number.isFinite(n)?n:null;},[id]);
  const[post,setPost]=useState(null);const[content,setContent]=useState('');const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[error,setError]=useState('');const[toast,setToast]=useState(null);const[imageFile,setImageFile]=useState(null);const[imagePreview,setImagePreview]=useState(null);
  const left=MAX-content.length;const over=left<0;
  useEffect(()=>{if(!user)navigate('/login',{replace:true});},[user,navigate]);
  useEffect(()=>{if(isGuest||postId==null){setLoading(false);if(postId==null)setError('Invalid post id.');return;}let c=false;
    (async()=>{setLoading(true);setError('');try{const init=location.state?.post;if(init&&Number(init.id)===postId){if(c)return;setPost(init);setContent(String(init.text??init.content??''));return;}let found=null,page=0,tp=1;while(!found&&page<tp&&page<10){const r=await postsApi.getAll(page,50);tp=r.totalPages||1;found=r.content.find(p=>Number(p.id)===postId)||null;page++;}if(!found)throw new Error('Not found.');if(c)return;setPost(found);setContent(String(found.text??''));}catch(e){if(!c)setError(e?.message||'Could not load this post.');}finally{if(!c)setLoading(false);}})();
    return()=>{c=true};
  },[isGuest,location.state,postId]);
  const handleImageSelect=e=>{const f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024){setError('Image must be under 5MB.');return;}setImageFile(f);const r=new FileReader();r.onload=ev=>setImagePreview(ev.target.result);r.readAsDataURL(f);};
  const handleDropzone=e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/')){const fe={target:{files:[f]}};handleImageSelect(fe);}};
  const handleUpdate=async e=>{e?.preventDefault?.();if(isGuest){navigate('/login');return;}if(postId==null)return;const t=content.trim();if(!t){setError('Please write something.');return;}if(over){setError(`Exceeds ${MAX} characters.`);return;}setSaving(true);setError('');try{let u=await postsApi.update(postId,{content:t});if(imageFile)u=await filesApi.upload(postId,imageFile);sessionStorage.setItem('dt_toast',JSON.stringify({message:'Post updated.',type:'success'}));navigate(`/post/${postId}`,{replace:true,state:{post:u}});}catch(e2){const m=e2?.message||'Failed.';setError(m);setToast({message:m,type:'error'});}finally{setSaving(false);};};

  return(
    <div style={{minHeight:'100vh',background:P.bg,fontFamily:P.fB}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:ital,wght@0,400;0,600&family=DM+Mono:wght@400;500&display=swap');.dt-dz:hover{border-color:${P.amberDark}!important;background:${P.amberPale}!important;}`}</style>
      <Toast message={toast?.message} type={toast?.type||'success'} onClose={()=>setToast(null)} />
      <div style={{width:'100%',maxWidth:1240,margin:'0 auto',padding:'28px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center',gap:18}}>
        <Sidebar />
        <main style={{flex:'0 1 640px',minWidth:0}}>
          <button type="button" onClick={()=>navigate(-1)} style={{background:'none',border:'none',cursor:'pointer',color:P.muted,fontSize:13,fontWeight:600,marginBottom:20,fontFamily:P.fB,display:'flex',alignItems:'center',gap:6}}>← Back</button>
          <div style={{background:P.card,borderRadius:20,border:`1px solid ${P.border}`,boxShadow:'0 4px 24px rgba(61,38,0,0.08)',overflow:'hidden',marginBottom:16}}>
            <div style={{height:4,background:`linear-gradient(90deg,transparent,${P.amber},${P.amberDark},transparent)`}} />
            <div style={{padding:'24px 28px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,gap:12}}>
                <h1 style={{fontFamily:P.fH,fontSize:22,fontWeight:700,color:P.ink,margin:0}}>Edit Thought</h1>
                <div style={{fontFamily:P.fM,fontSize:12,color:over?P.rose:left<50?P.amberDark:P.muted,whiteSpace:'nowrap'}}><span style={{fontWeight:over?700:400}}>{content.length}</span> / {MAX}</div>
              </div>
              {error&&<div style={{background:P.rosePale,border:`1px solid rgba(192,57,43,0.22)`,borderRadius:12,padding:'10px 14px',fontSize:13,color:P.rose,marginBottom:16,fontFamily:P.fB}}>⚠️ {error}</div>}
              {loading?<p style={{padding:32,textAlign:'center',color:P.muted,fontFamily:P.fB}}>Loading…</p>:(
                <form onSubmit={handleUpdate}>
                  <div style={{display:'flex',gap:14,marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${P.border}`}}>
                    <Avatar name={`${user?.firstName||''} ${user?.lastName||''}`.trim()||user?.email||'User'} src={filesApi.getUrl(user?.avatarUrl)} size="md" />
                    <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Update your thought…" style={{flex:1,border:`2px solid ${over?P.rose:'transparent'}`,borderRadius:12,background:P.surface,padding:12,resize:'vertical',fontFamily:P.fB,fontSize:17,color:P.ink,outline:'none',minHeight:160,lineHeight:1.7}} autoFocus />
                  </div>
                  <div style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${P.border}`}}>
                    <p style={{fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:1.2,marginBottom:12,fontFamily:P.fM}}>Attach an image (optional)</p>
                    {imagePreview?<div style={{position:'relative',borderRadius:12,overflow:'hidden',maxHeight:300}}><img src={imagePreview} alt="Preview" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} /><button type="button" onClick={()=>{setImageFile(null);setImagePreview(null);if(fileInputRef.current)fileInputRef.current.value='';}} style={{position:'absolute',top:12,right:12,background:'rgba(61,38,0,0.75)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:50,cursor:'pointer',fontSize:12,fontFamily:P.fB}}>✕ Remove</button></div>
                    :post?.imagePath?<div style={{position:'relative',borderRadius:12,overflow:'hidden',maxHeight:300}}><img src={filesApi.getUrl(post.imagePath)} alt="Current" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} /><button type="button" onClick={()=>fileInputRef.current?.click()} style={{position:'absolute',top:12,right:12,background:'rgba(61,38,0,0.75)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:50,cursor:'pointer',fontSize:12,fontFamily:P.fB,fontWeight:700}}>Replace</button></div>
                    :<div className="dt-dz" onClick={()=>fileInputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={handleDropzone} style={{border:`2px dashed ${P.border}`,borderRadius:16,padding:36,textAlign:'center',cursor:'pointer',transition:'all 0.2s'}}><div style={{fontSize:36,marginBottom:10}}>🖼️</div><p style={{fontSize:14,color:P.muted,fontFamily:P.fB,marginBottom:4}}>Drop an image here or <span style={{color:P.amberDark,fontWeight:600}}>browse files</span></p><p style={{fontSize:12,color:P.border,fontFamily:P.fM}}>JPG, PNG, WebP · Max 5MB</p></div>}
                    <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImageSelect} />
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',gap:12}}>
                    <button type="button" onClick={()=>navigate(-1)} style={{padding:'10px 18px',border:`1.5px solid ${P.border}`,borderRadius:12,background:'transparent',color:P.muted,fontWeight:600,cursor:'pointer',fontFamily:P.fB}}>Cancel</button>
                    <button type="submit" disabled={saving||!content.trim()||over} style={{padding:'10px 26px',border:'none',borderRadius:12,background:`linear-gradient(135deg,${P.amber},${P.amberDark})`,color:P.ink,fontWeight:700,cursor:(saving||!content.trim()||over)?'not-allowed':'pointer',fontFamily:P.fB,opacity:(saving||!content.trim()||over)?0.6:1,boxShadow:`0 3px 14px rgba(200,160,60,0.3)`}}>{saving?'Saving…':'Save Changes →'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
          <div style={{background:P.surface,borderRadius:16,padding:'18px 20px',border:`1px solid ${P.border}`}}>
            <p style={{fontFamily:P.fH,fontSize:14,fontWeight:700,color:P.ink,marginBottom:10}}>✨ Writing Tips</p>
            <ul style={{margin:0,paddingLeft:18,color:P.muted,fontSize:13,lineHeight:1.8,fontFamily:P.fB}}><li>Keep it clear and authentic.</li><li>Short edits can make your thought stronger.</li><li>Read it once before saving.</li></ul>
          </div>
        </main>
        <aside style={{width:280,flexShrink:0}} />
      </div>
    </div>
  );
}