import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi, oauthApi } from '../utils/api';

/* ── Warm Parchment Palette ──────────────────────────────────
   #FFF8EE  warm ivory      — page bg
   #F5ECD4  deep parchment  — card surface
   #EDE0C4  border / hover
   #E8C97A  golden amber    — accent
   #C9A84C  amber dark      — links / hover
   #A67C28  amber deep
   #3D2600  espresso        — primary text
   #7A6040  warm brown      — muted
   #6B4C1E  mid brown
   ─────────────────────────────────────────────────────────── */

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
};

const STEPS = ['Account', 'Personal', 'Done'];

export default function RegisterPage() {
  const navigate        = useNavigate();
  const { login }       = useAuth();
  const [step, setStep] = useState(0);
  const [focused, setFocused] = useState('');

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const strength = (() => {
    const p = form.password; let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const SMETA = [
    { color: C.surfaceHi, label: '' },
    { color: '#ef4444',   label: 'Weak' },
    { color: '#d97706',   label: 'Fair' },
    { color: '#059669',   label: 'Good' },
    { color: '#059669',   label: 'Strong' },
  ];

  const nextStep = e => {
    e.preventDefault(); setError('');
    if (step === 0) {
      if (!form.email)                            { setError('Email is required.'); return; }
      if (form.password.length < 8)               { setError('Password must be at least 8 characters.'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    if (!form.firstName || !form.lastName) { setError('Please enter your full name.'); return; }
    setLoading(true);
    try {
      const res = await authApi.register({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
      });
      login(res.token, res.user);
      sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Registration successful.', type: 'success' }));
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* BG layers */}
      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />
      <div style={S.bgDots} />
      <svg style={S.bgSvg} viewBox="0 0 700 800" fill="none">
        <circle cx="620" cy="100" r="160" stroke="rgba(197,162,100,0.1)" strokeWidth="1"/>
        <circle cx="620" cy="100" r="90"  stroke="rgba(197,162,100,0.07)" strokeWidth="1"/>
        <circle cx="60"  cy="720" r="140" stroke="rgba(197,162,100,0.08)" strokeWidth="1"/>
      </svg>

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

          {/* Steps */}
          <div style={S.stepRow}>
            <div style={S.stepConnector} />
            {STEPS.map((label, i) => {
              const done = i < step, active = i === step;
              return (
                <div key={label} style={S.stepItem}>
                  <div style={{
                    ...S.stepCircle,
                    background: done ? C.amberDark : active ? `linear-gradient(135deg,${C.amber},${C.amberDark})` : C.surface,
                    border: active ? `2px solid rgba(200,168,76,0.5)` : done ? `2px solid ${C.amberDark}` : `2px solid ${C.border}`,
                    boxShadow: active ? `0 0 0 4px rgba(200,168,76,0.15)` : 'none',
                    transform: active ? 'scale(1.15)' : 'scale(1)',
                  }}>
                    {done
                      ? <span style={{ fontSize:10, color:C.white, fontWeight:800 }}>✓</span>
                      : <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:600, color: active ? C.ink : C.muted }}>{i+1}</span>
                    }
                  </div>
                  <span style={{ ...S.stepLabel, color: active ? C.amberDeep : done ? C.amberDark : C.mutedSoft, fontWeight: active ? 700 : 400 }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Heading */}
          <h2 style={S.title}>
            {step === 0 ? 'Create your account' : 'Almost there!'}
          </h2>
          <p style={S.sub}>
            {step === 0 ? 'Join the DailyThoughts community today' : 'Just a few more details'}
          </p>

          {/* Error */}
          {error && (
            <div style={S.errorBox}>
              <span style={{ flexShrink:0 }}>⚠</span>
              <span style={{ flex:1 }}>{error}</span>
              <button style={S.errorClose} onClick={() => setError('')}>✕</button>
            </div>
          )}

          {/* Step 0 */}
          {step === 0 && (
            <form onSubmit={nextStep} style={{ display:'flex', flexDirection:'column', gap:0 }}>
              <Field label="Email address" name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} focused={focused} setFocused={setFocused} />

              <Field label="Password" name="password" type="password" placeholder="At least 8 characters"
                value={form.password} onChange={handleChange} focused={focused} setFocused={setFocused} />

              {form.password && (
                <div style={S.strengthWrap}>
                  <div style={S.strengthBar}>
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{
                        ...S.strengthSeg,
                        background: n <= strength ? SMETA[strength].color : C.surfaceHi,
                        transform: n <= strength ? 'scaleY(1)' : 'scaleY(0.5)',
                      }} />
                    ))}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, color: SMETA[strength].color, fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{SMETA[strength].label}</span>
                    <span style={{ fontSize:10, color:C.mutedSoft }}>{form.password.length} chars</span>
                  </div>
                </div>
              )}

              <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="Re-enter your password"
                value={form.confirmPassword} onChange={handleChange} focused={focused} setFocused={setFocused} />

              {form.confirmPassword && (
                <div style={{ fontSize:11, color: form.password===form.confirmPassword ? '#059669' : '#ef4444', marginTop:-10, marginBottom:14, fontFamily:"'DM Mono',monospace" }}>
                  {form.password===form.confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
                </div>
              )}

              <button type="submit" className="dt-btn-primary" style={S.btnPrimary}>
                <span>Continue</span><span style={S.btnArrow}>→</span>
              </button>
            </form>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:0 }}>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ flex:1 }}>
                  <Field label="First Name" name="firstName" placeholder="Juan"
                    value={form.firstName} onChange={handleChange} focused={focused} setFocused={setFocused} />
                </div>
                <div style={{ flex:1 }}>
                  <Field label="Last Name" name="lastName" placeholder="Dela Cruz"
                    value={form.lastName} onChange={handleChange} focused={focused} setFocused={setFocused} />
                </div>
              </div>

              <label style={S.termsRow}>
                <input type="checkbox" id="terms" required style={{ accentColor:C.amberDark, width:15, height:15 }} />
                <span style={S.termsText}>
                  I agree to the <span style={S.termsLink}>Terms of Service</span> and <span style={S.termsLink}>Privacy Policy</span>
                </span>
              </label>

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setStep(0)} style={S.btnBack}>← Back</button>
                <button type="submit" disabled={loading} className="dt-btn-primary"
                  style={{ ...S.btnPrimary, flex:1, marginTop:0, opacity: loading ? 0.75 : 1 }}>
                  {loading
                    ? <><span style={S.spinner} />Creating…</>
                    : <><span>Create Account</span><span style={S.btnArrow}>✓</span></>
                  }
                </button>
              </div>
            </form>
          )}

          {/* Divider + Google */}
          <div style={S.divider}>
            <div style={S.divLine} /><span style={S.divText}>or register with</span><div style={S.divLine} />
          </div>

          <button onClick={() => window.location.href = oauthApi.googleLoginUrl()}
            className="dt-btn-google" style={S.googleBtn}>
            <GoogleIcon /><span>Register with Google</span>
          </button>

          <p style={S.loginText}>
            Already have an account?{' '}
            <Link to="/login" style={S.link}>Sign in</Link>
          </p>
        </div>
      </div>

      <p style={S.tagline}>Your thoughts, beautifully captured.</p>
    </div>
  );
}

/* ─── Field ── */
function Field({ label, name, type='text', placeholder, value, onChange, focused, setFocused }) {
  const active = focused === name;
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ ...S.label, color: active ? C.amberDeep : C.muted }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} required
          onFocus={() => setFocused(name)} onBlur={() => setFocused('')}
          style={{
            ...S.input,
            borderColor: active ? C.amberDark : value ? 'rgba(197,162,100,0.5)' : C.border,
            boxShadow: active ? `0 0 0 3px rgba(200,168,76,0.1)` : 'none',
            background: active ? C.white : C.bg,
          }}
        />
        <div style={{ position:'absolute', bottom:0, left:0, height:2, borderRadius:'0 0 12px 12px',
          width: active ? '100%' : '0%', background:`linear-gradient(90deg,${C.amber},${C.amberDark})`,
          transition:'width 0.35s ease' }} />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const S = {
  page: { minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', padding:'0 20px 60px', position:'relative', overflow:'hidden', fontFamily:"'Lora','Georgia',serif" },
  bgCircle1: { position:'absolute', bottom:'-8%', left:'2%', width:600, height:500, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(232,201,122,0.2) 0%,transparent 65%)', pointerEvents:'none' },
  bgCircle2: { position:'absolute', top:'-10%', right:'2%', width:500, height:550, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(232,201,122,0.1) 0%,transparent 60%)', pointerEvents:'none' },
  bgDots: { position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(197,162,100,0.18) 1px,transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' },
  bgSvg: { position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' },
  topBar: { width:'100%', maxWidth:460, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'28px 0 20px', position:'relative', zIndex:2 },
  logoRow: { display:'flex', alignItems:'center', gap:10 },
  logoBox: { width:38, height:38, borderRadius:11, flexShrink:0, background:`linear-gradient(135deg,${C.amber},${C.amberDark})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 14px rgba(200,160,60,0.35)`, position:'relative', overflow:'hidden' },
  logoShine: { position:'absolute', inset:0, background:'radial-gradient(circle at 28% 28%,rgba(255,255,255,0.3),transparent 55%)' },
  logoWordmark: { fontFamily:"'Playfair Display','Georgia',serif", fontSize:17, fontWeight:700, color:C.ink },
  backLink: { fontFamily:"'DM Mono',monospace", fontSize:11.5, color:C.muted, textDecoration:'none', letterSpacing:0.3 },
  card: { background:C.white, borderRadius:24, overflow:'hidden', boxShadow:`0 20px 60px rgba(61,38,0,0.12), 0 0 0 1px rgba(197,162,100,0.2)`, width:'100%', maxWidth:460, position:'relative', zIndex:2 },
  cardTopLine: { height:4, background:`linear-gradient(90deg,transparent 0%,${C.amber} 30%,${C.amberDark} 70%,transparent 100%)` },
  cardBody: { padding:'28px 32px 32px' },
  stepRow: { display:'flex', justifyContent:'center', gap:56, marginBottom:28, position:'relative' },
  stepConnector: { position:'absolute', top:15, left:'22%', right:'22%', height:1, background:`linear-gradient(90deg,rgba(197,162,100,0.2),rgba(197,162,100,0.1),rgba(197,162,100,0.2))`, zIndex:0 },
  stepItem: { display:'flex', flexDirection:'column', alignItems:'center', gap:7, position:'relative', zIndex:1 },
  stepCircle: { width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)' },
  stepLabel: { fontFamily:"'DM Mono',monospace", fontSize:9.5, letterSpacing:1, textTransform:'uppercase', transition:'all 0.3s' },
  title: { fontFamily:"'Playfair Display','Georgia',serif", fontSize:22, fontWeight:700, color:C.ink, marginBottom:5, letterSpacing:'-0.2px' },
  sub: { fontFamily:"'Lora','Georgia',serif", fontSize:13, color:C.mutedSoft, marginBottom:22 },
  errorBox: { background:C.rosePale, border:`1px solid rgba(192,57,43,0.22)`, borderRadius:12, padding:'11px 14px', fontSize:13, color:C.rose, marginBottom:18, display:'flex', alignItems:'center', gap:10, fontFamily:"'Lora',serif" },
  errorClose: { background:'none', border:'none', color:'rgba(192,57,43,0.5)', cursor:'pointer', fontSize:11, padding:0, marginLeft:'auto' },
  label: { display:'block', marginBottom:7, fontFamily:"'DM Mono',monospace", fontSize:10.5, fontWeight:500, letterSpacing:1.5, textTransform:'uppercase', transition:'color 0.2s' },
  input: { width:'100%', padding:'12px 16px', background:C.bg, border:`1.5px solid rgba(197,162,100,0.3)`, borderRadius:12, outline:'none', fontSize:14, color:C.ink, fontFamily:"'Lora',serif", transition:'border-color 0.2s, box-shadow 0.2s, background 0.2s', boxSizing:'border-box' },
  strengthWrap: { marginTop:-8, marginBottom:16 },
  strengthBar: { display:'flex', gap:4, marginBottom:5, height:5 },
  strengthSeg: { flex:1, borderRadius:3, transition:'background 0.3s, transform 0.2s' },
  termsRow: { display:'flex', gap:10, alignItems:'flex-start', marginBottom:18, cursor:'pointer' },
  termsText: { fontSize:12, color:C.mutedSoft, lineHeight:1.55, fontFamily:"'Lora',serif" },
  termsLink: { color:C.amberDark, fontWeight:600 },
  btnPrimary: { width:'100%', marginTop:8, padding:'13px 20px', background:`linear-gradient(135deg,${C.amber} 0%,${C.amberDark} 100%)`, border:'none', borderRadius:12, fontSize:14, fontWeight:700, color:C.ink, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:"'Lora',serif", boxShadow:`0 4px 18px rgba(200,160,60,0.3)`, transition:'all 0.2s' },
  btnArrow: { fontSize:15, fontWeight:800 },
  btnBack: { padding:'12px 20px', border:`1.5px solid rgba(197,162,100,0.3)`, borderRadius:12, background:'transparent', fontSize:13, fontWeight:600, color:C.muted, cursor:'pointer', fontFamily:"'Lora',serif", transition:'all 0.2s' },
  spinner: { display:'inline-block', width:13, height:13, border:`2px solid rgba(61,38,0,0.25)`, borderTopColor:C.ink, borderRadius:'50%', animation:'dt-spin 0.7s linear infinite' },
  divider: { display:'flex', alignItems:'center', gap:12, margin:'20px 0' },
  divLine: { flex:1, height:1, background:'rgba(197,162,100,0.2)' },
  divText: { fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mutedSoft, letterSpacing:1.2, whiteSpace:'nowrap' },
  googleBtn: { width:'100%', padding:'12px 16px', background:C.bg, border:`1.5px solid rgba(197,162,100,0.28)`, borderRadius:12, fontSize:13, fontWeight:500, color:C.mid, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:"'Lora',serif", transition:'all 0.2s', boxShadow:'0 1px 6px rgba(61,38,0,0.05)' },
  loginText: { textAlign:'center', marginTop:16, fontSize:13, color:C.mutedSoft, fontFamily:"'Lora',serif" },
  link: { color:C.amberDark, fontWeight:600, textDecoration:'none' },
  tagline: { marginTop:28, fontFamily:"'Playfair Display',serif", fontSize:12, fontStyle:'italic', color:'rgba(122,96,64,0.4)', letterSpacing:'0.5px', position:'relative', zIndex:2 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
  @keyframes dt-spin { to { transform: rotate(360deg); } }
  input::placeholder { color: rgba(122,96,64,0.3) !important; }
  .dt-btn-primary:hover:not(:disabled) { transform: translateY(-1px) !important; box-shadow: 0 8px 28px rgba(200,160,60,0.4) !important; }
  .dt-btn-google:hover { background: #FFF8EE !important; border-color: rgba(197,162,100,0.55) !important; color: #3D2600 !important; }
`;