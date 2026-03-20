import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../utils/api';

const C = {
  bg:        '#FFF8EE',
  surface:   '#F5ECD4',
  surfaceHi: '#EDE0C4',
  border:    'rgba(197,162,100,0.3)',
  amber:     '#E8C97A',
  amberDark: '#C9A84C',
  amberDeep: '#A67C28',
  ink:       '#3D2600',
  muted:     '#7A6040',
  mutedSoft: 'rgba(122,96,64,0.6)',
  mid:       '#6B4C1E',
  white:     '#ffffff',
  rose:      '#c0392b',
  rosePale:  'rgba(192,57,43,0.07)',
  successBg: 'rgba(5,150,105,0.07)',
  successBorder: 'rgba(5,150,105,0.25)',
  successText: '#065f46',
};

export default function ForgotPasswordPage() {
  const [email,           setEmail]           = useState('');
  const [token,           setToken]           = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [focused,  setFocused]  = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const canReset = useMemo(() =>
    token.trim() && newPassword && confirmPassword,
    [token, newPassword, confirmPassword]
  );

  const handleRequest = async e => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSuccess(res.message || 'If an account exists, a reset code has been sent.');
      setCodeSent(true);
    } catch (err) {
      setError(err?.message || 'Failed to request reset code.');
    } finally { setLoading(false); }
  };

  const handleReset = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token, newPassword });
      setSuccess(res.message || 'Password has been reset successfully.');
      setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err?.message || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />
      <div style={S.bgDots} />

      {/* Top bar */}
      <div style={S.topBar}>
        <div style={S.logoRow}>
          <div style={S.logoBox}>
            <span style={{ fontSize:18, position:'relative', zIndex:1 }}>📓</span>
            <div style={S.logoShine} />
          </div>
          <span style={S.logoWordmark}>Daily<span style={{ color:C.amberDark }}>Thoughts</span></span>
        </div>
        <Link to="/login" style={S.backLink}>← Back to Login</Link>
      </div>

      {/* Card */}
      <div style={S.card}>
        <div style={S.cardTopLine} />
        <div style={S.cardBody}>

          {/* Header icon */}
          <div style={S.iconWrap}>
            <span style={{ fontSize:26 }}>🔐</span>
          </div>
          <h2 style={S.title}>Forgot Password?</h2>
          <p style={S.sub}>Enter your email to receive a reset code, then set a new password below.</p>

          {/* Alerts */}
          {error && (
            <div style={S.errorBox}>
              <span style={{ flexShrink:0 }}>⚠</span>
              <span style={{ flex:1 }}>{error}</span>
              <button style={S.alertClose} onClick={() => setError('')}>✕</button>
            </div>
          )}
          {success && (
            <div style={S.successBox}>
              <span style={{ flexShrink:0, color:C.successText }}>✓</span>
              <span style={{ flex:1 }}>{success}</span>
            </div>
          )}

          {/* ── Step 1: Request code ── */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <div style={{ ...S.stepBadge, background: codeSent ? C.amberDark : C.amber }}>
                {codeSent ? <span style={{ color:C.ink, fontWeight:800, fontSize:12 }}>✓</span> : <span style={{ color:C.ink, fontWeight:700, fontSize:11 }}>1</span>}
              </div>
              <div>
                <p style={S.sectionTitle}>Request Reset Code</p>
                <p style={S.sectionSub}>We'll generate a code for your email</p>
              </div>
            </div>

            <form onSubmit={handleRequest} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ ...S.label, color: focused === 'email' ? C.amberDeep : C.muted }}>Email address</label>
                <div style={{ position:'relative' }}>
                  <span style={S.inputIcon}>✉</span>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                    style={{
                      ...S.input, paddingLeft:38,
                      borderColor: focused==='email' ? C.amberDark : email ? 'rgba(197,162,100,0.5)' : C.border,
                      boxShadow: focused==='email' ? '0 0 0 3px rgba(200,168,76,0.1)' : 'none',
                      background: focused==='email' ? C.white : C.bg,
                    }}
                  />
                  <div style={{ position:'absolute', bottom:0, left:0, height:2, borderRadius:'0 0 12px 12px', width: focused==='email'?'100%':'0%', background:`linear-gradient(90deg,${C.amber},${C.amberDark})`, transition:'width 0.35s ease' }} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="dt-btn-primary" style={{ ...S.btnPrimary, opacity: loading ? 0.75 : 1 }}>
                {loading ? <><span style={S.spinner} />Sending…</> : <><span>Send Reset Code</span><span>→</span></>}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div style={S.orDivider}>
            <div style={S.orLine} />
            <span style={S.orText}>Then reset your password</span>
            <div style={S.orLine} />
          </div>

          {/* ── Step 2: Reset ── */}
          <div style={{ ...S.sectionCard, opacity: codeSent ? 1 : 0.55 }}>
            <div style={S.sectionHeader}>
              <div style={{ ...S.stepBadge, background: C.surface, border:`1.5px solid ${C.border}` }}>
                <span style={{ color:C.muted, fontWeight:700, fontSize:11 }}>2</span>
              </div>
              <div>
                <p style={S.sectionTitle}>Enter Code & New Password</p>
                <p style={S.sectionSub}>Paste the code from your email</p>
              </div>
            </div>

            <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Reset code */}
              <div>
                <label style={{ ...S.label, color: focused==='token' ? C.amberDeep : C.muted }}>Reset Code</label>
                <div style={{ position:'relative' }}>
                  <span style={S.inputIcon}>🔑</span>
                  <input value={token} onChange={e => setToken(e.target.value)}
                    placeholder="Paste reset code here"
                    onFocus={() => setFocused('token')} onBlur={() => setFocused('')}
                    style={{
                      ...S.input, paddingLeft:38, fontFamily:"'DM Mono',monospace", letterSpacing:'1px',
                      borderColor: focused==='token' ? C.amberDark : token ? 'rgba(197,162,100,0.5)' : C.border,
                      boxShadow: focused==='token' ? '0 0 0 3px rgba(200,168,76,0.1)' : 'none',
                      background: focused==='token' ? C.white : C.bg,
                    }}
                  />
                  <div style={{ position:'absolute', bottom:0, left:0, height:2, borderRadius:'0 0 12px 12px', width: focused==='token'?'100%':'0%', background:`linear-gradient(90deg,${C.amber},${C.amberDark})`, transition:'width 0.35s ease' }} />
                </div>
              </div>

              {/* Passwords */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[['newPassword','New Password','New password'],['confirmPassword','Confirm Password','Confirm it']].map(([field, lbl, ph]) => (
                  <div key={field}>
                    <label style={{ ...S.label, color: focused===field ? C.amberDeep : C.muted }}>{lbl}</label>
                    <div style={{ position:'relative' }}>
                      <input type="password" value={field==='newPassword' ? newPassword : confirmPassword}
                        onChange={e => field==='newPassword' ? setNewPassword(e.target.value) : setConfirmPassword(e.target.value)}
                        placeholder={ph}
                        onFocus={() => setFocused(field)} onBlur={() => setFocused('')}
                        style={{
                          ...S.input,
                          borderColor: focused===field ? C.amberDark : (field==='newPassword'?newPassword:confirmPassword) ? 'rgba(197,162,100,0.5)' : C.border,
                          boxShadow: focused===field ? '0 0 0 3px rgba(200,168,76,0.1)' : 'none',
                          background: focused===field ? C.white : C.bg,
                        }}
                      />
                      <div style={{ position:'absolute', bottom:0, left:0, height:2, borderRadius:'0 0 12px 12px', width: focused===field?'100%':'0%', background:`linear-gradient(90deg,${C.amber},${C.amberDark})`, transition:'width 0.35s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Match indicator */}
              {confirmPassword && (
                <div style={{ fontSize:11, color: newPassword===confirmPassword ? '#059669' : '#ef4444', fontFamily:"'DM Mono',monospace", marginTop:-6 }}>
                  {newPassword===confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
                </div>
              )}

              <button type="submit" disabled={loading || !canReset} className="dt-btn-reset"
                style={{ ...S.btnReset, opacity: (loading || !canReset) ? 0.6 : 1 }}>
                {loading ? <><span style={S.spinner} />Resetting…</> : <><span>Reset Password</span><span>✓</span></>}
              </button>
            </form>
          </div>

          <div style={{ textAlign:'center', marginTop:20 }}>
            <Link to="/login" style={S.backToLogin}>← Back to Login</Link>
          </div>
        </div>
      </div>

      <p style={S.tagline}>Your thoughts, beautifully captured.</p>
    </div>
  );
}

const S = {
  page: { minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', padding:'0 20px 60px', position:'relative', overflow:'hidden', fontFamily:"'Lora','Georgia',serif" },
  bgCircle1: { position:'absolute', bottom:'-8%', left:'2%', width:600, height:500, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(232,201,122,0.2) 0%,transparent 65%)', pointerEvents:'none' },
  bgCircle2: { position:'absolute', top:'-10%', right:'2%', width:500, height:550, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(232,201,122,0.1) 0%,transparent 60%)', pointerEvents:'none' },
  bgDots: { position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(197,162,100,0.18) 1px,transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' },
  topBar: { width:'100%', maxWidth:520, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'28px 0 20px', position:'relative', zIndex:2 },
  logoRow: { display:'flex', alignItems:'center', gap:10 },
  logoBox: { width:38, height:38, borderRadius:11, flexShrink:0, background:`linear-gradient(135deg,${C.amber},${C.amberDark})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 14px rgba(200,160,60,0.35)`, position:'relative', overflow:'hidden' },
  logoShine: { position:'absolute', inset:0, background:'radial-gradient(circle at 28% 28%,rgba(255,255,255,0.3),transparent 55%)' },
  logoWordmark: { fontFamily:"'Playfair Display','Georgia',serif", fontSize:17, fontWeight:700, color:C.ink },
  backLink: { fontFamily:"'DM Mono',monospace", fontSize:11.5, color:C.muted, textDecoration:'none' },
  card: { background:C.white, borderRadius:24, overflow:'hidden', boxShadow:`0 20px 60px rgba(61,38,0,0.12), 0 0 0 1px rgba(197,162,100,0.2)`, width:'100%', maxWidth:520, position:'relative', zIndex:2 },
  cardTopLine: { height:4, background:`linear-gradient(90deg,transparent 0%,${C.amber} 30%,${C.amberDark} 70%,transparent 100%)` },
  cardBody: { padding:'28px 32px 32px' },
  iconWrap: { width:56, height:56, borderRadius:16, background:`linear-gradient(145deg,${C.surface},${C.surfaceHi})`, border:`1.5px solid rgba(197,162,100,0.35)`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:'0 2px 12px rgba(197,162,100,0.2)' },
  title: { fontFamily:"'Playfair Display','Georgia',serif", fontSize:22, fontWeight:700, color:C.ink, marginBottom:5 },
  sub: { fontSize:13, color:C.mutedSoft, marginBottom:22, lineHeight:1.6 },
  errorBox: { background:C.rosePale, border:`1px solid rgba(192,57,43,0.22)`, borderRadius:12, padding:'11px 14px', fontSize:13, color:C.rose, marginBottom:16, display:'flex', alignItems:'center', gap:10 },
  successBox: { background:C.successBg, border:`1px solid ${C.successBorder}`, borderRadius:12, padding:'11px 14px', fontSize:13, color:C.successText, marginBottom:16, display:'flex', alignItems:'center', gap:10 },
  alertClose: { background:'none', border:'none', cursor:'pointer', fontSize:11, padding:0, marginLeft:'auto', opacity:0.5 },
  sectionCard: { background:C.surface, borderRadius:16, padding:'20px 24px', border:`1px solid rgba(197,162,100,0.25)`, marginBottom:0, transition:'opacity 0.3s' },
  sectionHeader: { display:'flex', alignItems:'center', gap:12, marginBottom:16 },
  stepBadge: { width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  sectionTitle: { fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:C.ink, marginBottom:2 },
  sectionSub: { fontSize:11.5, color:C.mutedSoft },
  label: { display:'block', marginBottom:7, fontFamily:"'DM Mono',monospace", fontSize:10.5, fontWeight:500, letterSpacing:1.5, textTransform:'uppercase', transition:'color 0.2s' },
  inputIcon: { position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:12, pointerEvents:'none', opacity:0.35, zIndex:1 },
  input: { width:'100%', padding:'12px 16px', background:C.bg, border:`1.5px solid rgba(197,162,100,0.3)`, borderRadius:12, outline:'none', fontSize:14, color:C.ink, fontFamily:"'Lora',serif", transition:'border-color 0.2s, box-shadow 0.2s, background 0.2s', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'13px 20px', background:`linear-gradient(135deg,${C.amber} 0%,${C.amberDark} 100%)`, border:'none', borderRadius:12, fontSize:14, fontWeight:700, color:C.ink, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:"'Lora',serif", boxShadow:`0 4px 18px rgba(200,160,60,0.3)`, transition:'all 0.2s' },
  btnReset: { width:'100%', padding:'13px 20px', background:C.ink, border:'none', borderRadius:12, fontSize:14, fontWeight:700, color:C.surface, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:"'Lora',serif", boxShadow:`0 4px 18px rgba(61,38,0,0.2)`, transition:'all 0.2s' },
  spinner: { display:'inline-block', width:13, height:13, border:`2px solid rgba(61,38,0,0.25)`, borderTopColor:C.ink, borderRadius:'50%', animation:'dt-spin 0.7s linear infinite' },
  orDivider: { display:'flex', alignItems:'center', gap:12, margin:'18px 0' },
  orLine: { flex:1, height:1, background:'rgba(197,162,100,0.2)' },
  orText: { fontFamily:"'DM Mono',monospace", fontSize:9.5, color:C.mutedSoft, letterSpacing:1.2, whiteSpace:'nowrap' },
  backToLogin: { fontFamily:"'DM Mono',monospace", fontSize:12, color:C.amberDark, fontWeight:600, textDecoration:'none', letterSpacing:0.3 },
  tagline: { marginTop:28, fontFamily:"'Playfair Display',serif", fontSize:12, fontStyle:'italic', color:'rgba(122,96,64,0.4)', letterSpacing:'0.5px', position:'relative', zIndex:2 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
  @keyframes dt-spin { to { transform: rotate(360deg); } }
  input::placeholder { color: rgba(122,96,64,0.3) !important; }
  .dt-btn-primary:hover:not(:disabled) { transform: translateY(-1px) !important; box-shadow: 0 8px 28px rgba(200,160,60,0.4) !important; }
  .dt-btn-reset:hover:not(:disabled) { transform: translateY(-1px) !important; box-shadow: 0 8px 28px rgba(61,38,0,0.3) !important; }
`;