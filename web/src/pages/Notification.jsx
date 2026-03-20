import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { quotesApi, userApi, notificationsApi } from '../utils/api';

const P = {
  bg:'#FFF8EE', card:'#ffffff', surface:'#F5ECD4', surfaceHi:'#EDE0C4',
  border:'rgba(197,162,100,0.28)', borderHov:'rgba(197,162,100,0.55)',
  amber:'#E8C97A', amberDark:'#C9A84C', amberPale:'rgba(232,201,122,0.18)',
  ink:'#3D2600', muted:'#7A6040', mutedSoft:'rgba(122,96,64,0.6)',
  rose:'#c0392b', rosePale:'rgba(192,57,43,0.07)',
  fHead:"'Playfair Display','Georgia',serif",
  fBody:"'Lora','Georgia',serif",
  fMono:"'DM Mono',monospace",
};

const TYPE_META = {
  LIKE:    { icon:'❤️', color:'#c0392b',  label:'liked your thought' },
  COMMENT: { icon:'💬', color:'#C9A84C',  label:'commented on your thought' },
  FOLLOW:  { icon:'👤', color:'#3B82F6',  label:'started following you' },
  POST:    { icon:'📝', color:'#5BAF7A',  label:'posted a new thought' },
  SYSTEM:  { icon:'📢', color:'#7A6040',  label:'' },
};

function groupLabel(ts) {
  if (!ts) return 'Earlier';
  const d = new Date(ts), now = new Date(), diff = (now - d) / 1000;
  if (diff < 3600)   return 'Just Now';
  if (diff < 86400)  return 'Today';
  if (diff < 172800) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month:'long', day:'numeric' });
}

function formatRelative(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return new Date(ts).toLocaleDateString('en-PH', { month:'short', day:'numeric' });
}

export default function NotificationsPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isGuest   = !user;

  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [quote,   setQuote]   = useState(null);

  useEffect(() => {
    if (isGuest) { navigate('/login'); return; }
    if (!user?.id) return;
    notificationsApi.listMine(user.id)
      .then(d => setNotifs(Array.isArray(d) ? d : []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, [isGuest, navigate, user?.id]);

  useEffect(() => {
    quotesApi.getDailyQuote().then(setQuote).catch(() => setQuote({ quoteText:'Every day is a new page in your story.', author:'DailyThoughts' }));
  }, []);

  const handleMarkAll = async () => {
    setNotifs(p => p.map(n => ({ ...n, read:true })));
    await notificationsApi.markAllRead(user.id).catch(console.error);
  };

  const handleMarkOne = id => {
    setNotifs(p => p.map(n => n.id === id ? { ...n, read:true } : n));
    if (user?.id) notificationsApi.markRead(user.id, id).catch(() => {});
  };

  const filtered    = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;
  const unreadCount = notifs.filter(n => !n.read).length;
  const grouped     = filtered.reduce((acc, n) => {
    const k = groupLabel(n.createdAt);
    if (!acc[k]) acc[k] = [];
    acc[k].push(n); return acc;
  }, {});

  return (
    <div style={S.shell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
        .dt-mi:hover { background: #F5ECD4 !important; }
        .dt-notif-item:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(61,38,0,0.1) !important; }
        .dt-fp:hover { background: #EDE0C4 !important; color: #3D2600 !important; }
      `}</style>

      <div style={S.layout}>
        <Sidebar dailyQuote={quote} notifCount={unreadCount} />

        <main style={S.main}>
          {/* Header */}
          <div style={S.header}>
            <div>
              <h1 style={S.title}>Notifications</h1>
              {unreadCount > 0 && <p style={S.subtitle}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>}
            </div>
            <div style={S.headerActions}>
              <div style={S.filterPills}>
                {['all','unread'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={f !== filter ? 'dt-fp' : ''}
                    style={{ ...S.filterPill, ...(filter===f ? S.filterPillActive : {}) }}>
                    {f.charAt(0).toUpperCase()+f.slice(1)}
                    {f==='unread' && unreadCount>0 && <span style={S.pillBadge}>{unreadCount}</span>}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} style={S.markAllBtn}>✓ Mark all read</button>
              )}
            </div>
          </div>

          {loading ? (
            <p style={{ padding:32, textAlign:'center', color: P.muted, fontFamily: P.fBody }}>Loading notifications…</p>
          ) : filtered.length === 0 ? (
            <div style={S.empty}>
              <span style={{ fontSize:48 }}>🔔</span>
              <p style={{ color: P.muted, fontFamily: P.fBody }}>
                {filter==='unread' ? 'All caught up! No unread notifications.' : 'No notifications yet.'}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div style={S.groupLabel}>{group}</div>
                {items.map(notif => (
                  <NotifItem key={notif.id} notif={notif} onRead={handleMarkOne}
                    onClick={() => { handleMarkOne(notif.id); if (notif.refPostId) navigate(`/post/${notif.refPostId}`); }} />
                ))}
              </div>
            ))
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

function NotifItem({ notif, onRead, onClick }) {
  const [hov, setHov] = useState(false);
  const meta = TYPE_META[notif.type] || TYPE_META.SYSTEM;
  return (
    <div onClick={onClick}
      className="dt-notif-item"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...S.item,
        background: !notif.read ? 'rgba(232,201,122,0.08)' : P.card,
        border: `1px solid ${!notif.read ? 'rgba(197,162,100,0.4)' : P.border}`,
        boxShadow: hov ? '0 6px 24px rgba(61,38,0,0.1)' : '0 1px 6px rgba(61,38,0,0.04)',
        cursor: notif.refPostId ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}>
      {!notif.read && <div style={S.unreadDot} />}
      <div style={{ position:'relative', flexShrink:0 }}>
        <Avatar name={notif.actorName || 'System'} src={notif.actorAvatar} size="sm" />
        <div style={{ ...S.typeIcon, borderColor:`${meta.color}40` }}>{meta.icon}</div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={S.itemText}>
          <strong style={{ color: P.ink }}>{notif.actorName || 'DailyThoughts'}</strong>
          {' '}{meta.label || notif.message}
        </p>
        {notif.postPreview && (
          <div style={S.preview}>
            {notif.postPreview.length > 80 ? notif.postPreview.slice(0,80)+'…' : notif.postPreview}
          </div>
        )}
        <p style={S.itemTime}>{formatRelative(notif.createdAt)}</p>
      </div>
      {!notif.read && (
        <button onClick={e => { e.stopPropagation(); onRead(notif.id) }} style={S.markBtn} title="Mark as read">✓</button>
      )}
    </div>
  );
}

function RightSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest  = !user;
  const trending = [
    { name:'Morning Routine', count:'142 thoughts today' },
    { name:'Gratitude Journal', count:'98 thoughts today' },
    { name:'Mindfulness', count:'76 thoughts today' },
    { name:'Self Reflection', count:'61 thoughts today' },
  ];
  const suggested = [
    { name:'Karla Manalo', sub:'34 thoughts this week' },
    { name:'Ben Cruz', sub:'Philosophy · Stoicism' },
    { name:'Lena Park', sub:'Mindfulness · Wellness' },
  ];
  const [followed, setFollowed]   = useState({});
  const [query, setQuery]         = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const q = query.trim().toLowerCase();

  useEffect(() => {
    const text = query.trim(); let ignore = false;
    const t = setTimeout(() => {
      if (!text) return; setUserLoading(true); setUserError('');
      userApi.search(text, { limit:25 })
        .then(l => { if (!ignore) setUserResults(l) })
        .catch(e => { if (!ignore) { setUserError(e?.message||'Failed.'); setUserResults([]) } })
        .finally(() => { if (!ignore) setUserLoading(false) });
    }, 250);
    return () => { ignore=true; clearTimeout(t) };
  }, [query]);

  const listUsers = q ? userResults : suggested;

  return (
    <aside style={S.rightBar}>
      <div style={S.searchBox}>
        <span style={{ fontSize:13, opacity:0.4 }}>🔎</span>
        <input value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) { setUserResults([]); setUserLoading(false); setUserError('') } }}
          placeholder="Search trending or users" style={S.searchInput} />
      </div>
      <div style={S.widget}>
        <p style={S.widgetTitle}>📈 Trending Topics</p>
        {trending.map((t,i) => (
          <div key={t.name} style={S.trendRow}>
            <span style={S.trendNum}>{i+1}</span>
            <div><p style={S.trendName}>{t.name}</p><p style={S.trendCount}>{t.count}</p></div>
          </div>
        ))}
      </div>
      <div style={S.widget}>
        <p style={S.widgetTitle}>👥 People to Follow</p>
        {userLoading ? <p style={S.empty2}>Searching…</p>
          : userError ? <p style={S.empty2}>{userError}</p>
          : listUsers.length===0 ? <p style={S.empty2}>No results.</p>
          : listUsers.map(u => {
            const id = u?.id;
            const name = u?.firstName||u?.lastName ? `${u?.firstName||''} ${u?.lastName||''}`.trim() : (u?.name||u?.email||'Unknown');
            const sub = u?.sub||u?.email||'';
            const key = id!=null ? `u:${id}` : `s:${name}`;
            const fk  = id!=null ? String(id) : name;
            return (
              <div key={key} style={S.suggestRow}>
                <div onClick={() => id!=null && navigate(`/profile/${id}`)} style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0, cursor: id!=null?'pointer':'default' }}>
                  <Avatar name={name} src={u?.avatarUrl} size="sm" />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={S.suggestName}>{name}</p>
                    <p style={S.suggestSub}>{sub}</p>
                  </div>
                </div>
                <button onClick={async () => {
                  if (id==null) return; if (isGuest) { navigate('/login'); return; }
                  try { const r=await userApi.toggleFollow(id,user?.id??null); setFollowed(f=>({...f,[fk]:!!r.following})) }
                  catch(e) { alert(e?.message||'Failed.') }
                }} style={{ ...S.followBtn, background: followed[fk]?P.amberPale:'transparent', color: P.amberDark }}>
                  {followed[fk]?'✓ Following':'Follow'}
                </button>
              </div>
            );
          })
        }
      </div>
    </aside>
  );
}

const S = {
  shell: { minHeight:'100vh', background: P.bg, fontFamily: P.fBody },
  layout: { width:'100%', maxWidth:1240, margin:'0 auto', padding:'28px 16px', display:'flex', alignItems:'flex-start', justifyContent:'center', gap:18 },
  main: { flex:'0 1 640px', minWidth:0 },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' },
  title: { fontFamily: P.fHead, fontSize:28, fontWeight:700, color: P.ink, marginBottom:4 },
  subtitle: { color: P.muted, fontSize:13 },
  headerActions: { display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  filterPills: { display:'flex', gap:3, background: P.surface, borderRadius:12, padding:3 },
  filterPill: { padding:'7px 16px', borderRadius:10, border:'none', background:'transparent', fontSize:12.5, fontWeight:600, color: P.muted, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily: P.fBody, transition:'all 0.2s' },
  filterPillActive: { background: P.card, color: P.ink, boxShadow:'0 1px 6px rgba(61,38,0,0.07)', border:`1px solid ${P.border}` },
  pillBadge: { background: P.amberDark, color: P.card, fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:8, fontFamily: P.fMono },
  markAllBtn: { background:'none', border:'none', color: P.amberDark, fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily: P.fBody },
  groupLabel: { fontSize:11, fontWeight:700, color: P.muted, textTransform:'uppercase', letterSpacing:1.5, fontFamily: P.fMono, margin:'20px 0 8px' },
  item: { display:'flex', alignItems:'flex-start', gap:12, borderRadius:16, padding:'14px 16px', marginBottom:8, position:'relative' },
  unreadDot: { position:'absolute', top:16, right:16, width:8, height:8, borderRadius:'50%', background: P.amberDark },
  typeIcon: { position:'absolute', bottom:-2, right:-2, width:18, height:18, borderRadius:'50%', background: P.card, border:`1px solid ${P.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 },
  itemText: { fontSize:13.5, color: P.ink, lineHeight:1.55, margin:0, fontFamily: P.fBody },
  preview: { marginTop:6, padding:'7px 12px', background: P.surface, borderRadius:8, fontSize:12, color: P.muted, fontStyle:'italic', borderLeft:`3px solid ${P.amber}`, fontFamily: P.fBody },
  itemTime: { fontSize:11, color: P.muted, marginTop:5, fontFamily: P.fMono },
  markBtn: { background:'none', border:'none', color: P.muted, cursor:'pointer', fontSize:14, flexShrink:0, padding:'2px 6px', borderRadius:'50%', transition:'all 0.2s' },
  empty: { textAlign:'center', padding:'64px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 },
  rightBar: { flex:'0 0 300px', display:'flex', flexDirection:'column', gap:12 },
  searchBox: { background: P.card, borderRadius:50, border:`1px solid ${P.border}`, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10, boxShadow:'0 1px 8px rgba(61,38,0,0.04)' },
  searchInput: { width:'100%', border:'none', outline:'none', fontFamily: P.fBody, fontSize:13, color: P.ink, background:'transparent' },
  widget: { background: P.card, border:`1px solid ${P.border}`, borderRadius:18, padding:'16px', boxShadow:'0 2px 12px rgba(61,38,0,0.05)' },
  widgetTitle: { fontFamily: P.fMono, fontSize:11, fontWeight:700, color: P.muted, textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 },
  trendRow: { display:'flex', gap:10, padding:'9px 0', borderTop:`1px solid ${P.border}` },
  trendNum: { fontFamily: P.fHead, color: P.amberDark, width:18, fontWeight:700 },
  trendName: { fontFamily: P.fBody, fontWeight:600, color: P.ink, fontSize:13 },
  trendCount: { fontFamily: P.fBody, color: P.muted, fontSize:11.5 },
  suggestRow: { display:'flex', gap:10, alignItems:'center', padding:'9px 0', borderTop:`1px solid ${P.border}` },
  suggestName: { fontFamily: P.fHead, fontSize:13, color: P.ink, fontWeight:700 },
  suggestSub: { fontFamily: P.fBody, color: P.muted, fontSize:11.5 },
  followBtn: { border:`1.5px solid ${P.amber}`, borderRadius:50, padding:'5px 14px', fontFamily: P.fBody, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s' },
  empty2: { color: P.muted, fontSize:12, fontFamily: P.fBody },
};