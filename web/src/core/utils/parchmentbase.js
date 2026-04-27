/* ─────────────────────────────────────────────────────────────
   WARM PARCHMENT — Shared style tokens for all inner pages
   Import P from this or copy into each file.
   ───────────────────────────────────────────────────────────── */

export const P = {
  bg:'#FFF8EE', card:'#ffffff', surface:'#F5ECD4', surfaceHi:'#EDE0C4',
  border:'rgba(197,162,100,0.28)', borderHov:'rgba(197,162,100,0.55)',
  amber:'#E8C97A', amberDark:'#C9A84C', amberPale:'rgba(232,201,122,0.18)',
  ink:'#3D2600', muted:'#7A6040', mutedSoft:'rgba(122,96,64,0.6)',
  rose:'#c0392b', rosePale:'rgba(192,57,43,0.07)',
  fHead:"'Playfair Display','Georgia',serif",
  fBody:"'Lora','Georgia',serif",
  fMono:"'DM Mono',monospace",
};

/* ─── Shared layout styles (used by all inner pages) ── */
export const BASE = {
  shell:  { minHeight:'100vh', background: P.bg, fontFamily: P.fBody },
  layout: { width:'100%', maxWidth:1240, margin:'0 auto', padding:'28px 16px', display:'flex', alignItems:'flex-start', justifyContent:'center', gap:18 },
  main:   { flex:'0 1 640px', minWidth:0 },
  backBtn:{ background:'none', border:'none', cursor:'pointer', color: P.muted, fontSize:13, fontWeight:600, marginBottom:20, fontFamily: P.fBody, display:'flex', alignItems:'center', gap:6, transition:'color 0.2s' },
  card:   { background: P.card, borderRadius:18, border:`1px solid ${P.border}`, boxShadow:'0 2px 16px rgba(61,38,0,0.07)', padding:'24px 28px', marginBottom:16 },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(61,38,0,0.3)', zIndex:20000, display:'flex', alignItems:'center', justifyContent:'center', padding:18, backdropFilter:'blur(3px)' },
  modalCard: { width:'100%', maxWidth:440, background: P.card, borderRadius:22, border:`1px solid ${P.border}`, boxShadow:'0 24px 80px rgba(61,38,0,0.18)', padding:'28px 28px 24px', fontFamily: P.fBody },
  modalTitle: { fontFamily: P.fHead, fontSize:20, fontWeight:700, color: P.ink, marginBottom:8 },
  modalBody: { color: P.muted, fontSize:14, lineHeight:1.65, marginBottom:22 },
  modalActions: { display:'flex', justifyContent:'flex-end', gap:12 },
  modalCancel: { padding:'10px 20px', border:`1.5px solid ${P.border}`, borderRadius:12, background:'transparent', color: P.muted, fontWeight:600, cursor:'pointer', fontFamily: P.fBody },
  modalDanger: { padding:'10px 24px', border:'none', borderRadius:12, background: P.ink, color: P.surface, fontWeight:700, cursor:'pointer', fontFamily: P.fBody },
  errorBox: { background: P.rosePale, border:`1px solid rgba(192,57,43,0.22)`, borderRadius:12, padding:'11px 14px', fontSize:13, color: P.rose, marginBottom:16, fontFamily: P.fBody },
  widget: { background: P.card, border:`1px solid ${P.border}`, borderRadius:18, padding:'16px', boxShadow:'0 2px 12px rgba(61,38,0,0.05)', marginBottom:14 },
  widgetTitle: { fontFamily: P.fMono, fontSize:11, fontWeight:700, color: P.muted, textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 },
  searchBox: { background: P.card, borderRadius:50, border:`1px solid ${P.border}`, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10, boxShadow:'0 1px 8px rgba(61,38,0,0.04)' },
  searchInput: { width:'100%', border:'none', outline:'none', fontFamily: P.fBody, fontSize:13, color: P.ink, background:'transparent' },
  trendRow: { display:'flex', gap:10, padding:'9px 0', borderTop:`1px solid ${P.border}` },
  trendNum: { fontFamily: P.fHead, color: P.amberDark, width:18, fontWeight:700 },
  trendName: { fontFamily: P.fBody, fontWeight:600, color: P.ink, fontSize:13 },
  trendCount: { fontFamily: P.fBody, color: P.muted, fontSize:11.5 },
  suggestRow: { display:'flex', gap:10, alignItems:'center', padding:'9px 0', borderTop:`1px solid ${P.border}` },
  suggestName: { fontFamily: P.fHead, fontSize:13, color: P.ink, fontWeight:700 },
  suggestSub: { fontFamily: P.fBody, color: P.muted, fontSize:11.5 },
  followBtn: { border:`1.5px solid ${P.amber}`, borderRadius:50, padding:'5px 14px', fontFamily: P.fBody, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s' },
  rightBar: { flex:'0 0 300px', display:'flex', flexDirection:'column', gap:12 },
};