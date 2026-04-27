import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { authApi, quotesApi, oauthApi } from '@/core/api';
import Toast from '@/core/components/Toast';

/* ─────────────────────────────────────────────────────────────
   DailyThoughts  —  Login Page
   Palette: Warm Parchment
     #FFF8EE   warm ivory       — page background
     #F5ECD4   deep parchment   — card / surface
     #EDE0C4   border / divider
     #E8C97A   golden amber     — accent
     #C9A84C   amber dark       — accent hover / links
     #3D2600   espresso         — primary text
     #7A6040   warm brown       — muted text
     #6B4C1E   mid brown        — secondary text
   ───────────────────────────────────────────────────────────── */

const C = {
  bg:          '#FFF8EE',
  surface:     '#F5ECD4',
  surfaceHigh: '#EDE0C4',
  border:      'rgba(197,162,100,0.3)',
  borderHov:   'rgba(197,162,100,0.6)',
  amber:       '#E8C97A',
  amberDark:   '#C9A84C',
  amberDeep:   '#A67C28',
  ink:         '#3D2600',
  muted:       '#7A6040',
  mutedLight:  'rgba(122,96,64,0.6)',
  mid:         '#6B4C1E',
  rose:        '#d97068',
  rosePale:    'rgba(217,112,104,0.08)',
  white:       '#ffffff',
};

export default function LoginPage() {
  const navigate        = useNavigate();
  const { login, user } = useAuth();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [quote, setQuote]       = useState(null);
  const [toast, setToast]       = useState(null);
  const [focused, setFocused]   = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (user) navigate('/feed'); }, [user, navigate]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token') || url.searchParams.get('accessToken');
    const oauthError = url.searchParams.get('oauthError') || url.searchParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      url.searchParams.delete('oauthError'); url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString()); return;
    }
    if (!token) return;
    const u = {
      id:            Number(url.searchParams.get('id')) || null,
      email:         url.searchParams.get('email') || '',
      firstName:     url.searchParams.get('firstName') || '',
      lastName:      url.searchParams.get('lastName') || '',
      avatarUrl:     url.searchParams.get('avatarUrl') || '',
      coverImageUrl: url.searchParams.get('coverImageUrl') || '',
    };
    sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Login successful.', type: 'success' }));
    login(token, u);
    ['token','accessToken','id','email','firstName','lastName','avatarUrl','coverImageUrl']
      .forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, '', url.toString());
    navigate('/feed', { replace: true });
  }, [login, navigate]);

  useEffect(() => {
    quotesApi.getDailyQuote()
      .then(setQuote)
      .catch(() => setQuote({ quoteText: 'Every day is a new page in your story.', author: 'DailyThoughts' }));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('dt_toast');
    if (!raw) return;
    sessionStorage.removeItem('dt_toast');
    try {
      const p = JSON.parse(raw);
      if (p?.message) setToast({ message: String(p.message), type: p.type === 'error' ? 'error' : 'success' });
    } catch { setToast({ message: String(raw), type: 'success' }); }
  }, []);

  const handleChange  = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleGoogle  = () => { window.location.href = oauthApi.googleLoginUrl(); };
  const handleGuest   = () => navigate('/feed');

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await authApi.login(form);
      login(res.token, res.user);
      sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Login successful.', type: 'success' }));
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <style>{GLOBAL_CSS}</style>
      <Toast message={toast?.message} type={toast?.type || 'success'} onClose={() => setToast(null)} />

      {/* ── Background decoration ── */}
      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />
      <div style={S.bgCircle3} />
      {/* Subtle dot texture */}
      <div style={S.bgDots} />
      {/* Decorative SVG lines */}
      <svg style={S.bgSvg} viewBox="0 0 1000 700" fill="none">
        <circle cx="850" cy="80"  r="200" stroke="rgba(197,162,100,0.12)" strokeWidth="1"/>
        <circle cx="850" cy="80"  r="120" stroke="rgba(197,162,100,0.08)" strokeWidth="1"/>
        <circle cx="130" cy="620" r="160" stroke="rgba(197,162,100,0.1)"  strokeWidth="1"/>
        <line x1="0" y1="340" x2="1000" y2="310" stroke="rgba(197,162,100,0.07)" strokeWidth="1"/>
        <line x1="0" y1="370" x2="1000" y2="398" stroke="rgba(197,162,100,0.04)" strokeWidth="1"/>
      </svg>

      {/* ── Layout ── */}
      <div style={S.layout}>

        {/* ══════ LEFT HERO ══════ */}
        <div style={S.hero}>

          {/* Logo */}
          <div style={S.logoRow}>
            <div style={S.logoBox}>
              <span style={{ fontSize: 20, position:'relative', zIndex:1 }}>📓</span>
              <div style={S.logoShine} />
            </div>
            <div>
              <div style={S.logoWordmark}>
                Daily<span style={{ color: C.amberDark }}>Thoughts</span>
              </div>
              <div style={S.logoTagline}>Journal · Reflect · Share</div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={S.headline}>
            Where your<br />
            <em style={S.headlineAccent}>thoughts</em>
            <br />come alive.
          </h1>

          <p style={S.heroSub}>
            A space to journal, reflect, and share your daily thoughts with a community that truly listens.
          </p>

          {/* Feature chips */}
          <div style={S.chips}>
            {['✍️  Daily journaling','💬  Community','🔒  Private & secure','✨  Daily quotes'].map(c => (
              <span key={c} style={S.chip}>{c}</span>
            ))}
          </div>

          {/* Quote card */}
          {quote && (
            <div style={S.quoteCard}>
              <div style={S.quoteTopLine} />
              <div style={S.quoteLabel}>✦ DAILY QUOTE</div>
              <p style={S.quoteText}>"{quote.quoteText}"</p>
              <p style={S.quoteAuthor}>— {quote.author}</p>
            </div>
          )}

          {/* Decorative rule */}
          <div style={S.heroRule} />
          <p style={S.heroFootNote}>Trusted by journal writers every day 🌿</p>
        </div>

        {/* ══════ RIGHT LOGIN CARD ══════ */}
        <div style={S.card}>
          {/* Inner card top accent */}
          <div style={S.cardTopAccent} />

          <div style={S.cardBody}>
            {/* Card header */}
            <div style={S.cardHeader}>
              <div style={S.cardAvatarRing}>
                <span style={{ fontSize: 22 }}>👤</span>
              </div>
              <div>
                <h2 style={S.cardTitle}>Welcome back</h2>
                <p style={S.cardSub}>Sign in to continue your journey</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={S.errorBox}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                <span style={{ flex: 1, lineHeight: 1.4 }}>{error}</span>
                <button style={S.errorClose} onClick={() => setError('')}>✕</button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:0 }}>

              {/* Email field */}
              <div style={S.fieldGroup}>
                <label style={{ ...S.label, color: focused === 'email' ? C.amberDeep : C.muted }}>
                  Email address
                </label>
                <div style={S.inputWrap}>
                  <span style={S.inputIcon}>✉</span>
                  <input
                    name="email" type="email" required autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email} onChange={handleChange}
                    onFocus={() => setFocused('email')}
                    onBlur={()  => setFocused('')}
                    style={{
                      ...S.input,
                      borderColor: focused === 'email'
                        ? C.amberDark
                        : form.email
                          ? 'rgba(197,162,100,0.55)'
                          : C.border,
                      boxShadow: focused === 'email'
                        ? `0 0 0 3px rgba(200,160,70,0.12)`
                        : 'none',
                      background: focused === 'email'
                        ? C.white
                        : C.bg,
                    }}
                  />
                  {/* Animated focus underline */}
                  <div style={{
                    ...S.focusLine,
                    width: focused === 'email' ? '100%' : '0%',
                    background: `linear-gradient(90deg,${C.amber},${C.amberDark})`,
                  }} />
                </div>
              </div>

              {/* Password field */}
              <div style={S.fieldGroup}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <label style={{ ...S.label, marginBottom:0, color: focused === 'password' ? C.amberDeep : C.muted }}>
                    Password
                  </label>
                  <Link to="/forgot-password" style={S.forgotLink}>Forgot password?</Link>
                </div>
                <div style={S.inputWrap}>
                  <span style={S.inputIcon}>🔑</span>
                  <input
                    name="password" type={showPass ? 'text' : 'password'} required
                    autoComplete="current-password" placeholder="Enter your password"
                    value={form.password} onChange={handleChange}
                    onFocus={() => setFocused('password')}
                    onBlur={()  => setFocused('')}
                    style={{
                      ...S.input,
                      paddingRight: 46,
                      borderColor: focused === 'password'
                        ? C.amberDark
                        : form.password
                          ? 'rgba(197,162,100,0.55)'
                          : C.border,
                      boxShadow: focused === 'password'
                        ? `0 0 0 3px rgba(200,160,70,0.12)`
                        : 'none',
                      background: focused === 'password' ? C.white : C.bg,
                      letterSpacing: !showPass && form.password ? '4px' : 'normal',
                    }}
                  />
                  <button
                    type="button" tabIndex={-1}
                    onClick={() => setShowPass(v => !v)}
                    style={S.eyeBtn}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                  <div style={{
                    ...S.focusLine,
                    width: focused === 'password' ? '100%' : '0%',
                    background: `linear-gradient(90deg,${C.amber},${C.amberDark})`,
                  }} />
                </div>
              </div>

              {/* Remember me */}
              <label style={S.rememberRow}>
                <input type="checkbox" style={{ accentColor: C.amberDark, width:15, height:15, cursor:'pointer' }} />
                <span style={S.rememberText}>Keep me signed in</span>
              </label>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="dt-btn-primary"
                style={{ ...S.btnPrimary, opacity: loading ? 0.8 : 1 }}
              >
                {loading
                  ? <><span style={S.spinner} />Signing in…</>
                  : <><span>Sign In</span><span style={S.btnArrow}>→</span></>
                }
              </button>
            </form>

            {/* Divider */}
            <div style={S.divider}>
              <div style={S.divLine} />
              <span style={S.divText}>or continue with</span>
              <div style={S.divLine} />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              className="dt-btn-google"
              style={S.googleBtn}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            {/* Register link */}
            <p style={S.registerText}>
              Don't have an account?{' '}
              <Link to="/register" style={S.link}>Create one free</Link>
            </p>

            {/* Guest bar */}
            <div style={S.guestBar} className="dt-guest-bar">
              <span style={{ fontSize: 16 }}>👀</span>
              <div>
                <span style={S.guestText}>Just browsing? </span>
                <span onClick={handleGuest} style={S.guestLink}>Continue as Guest</span>
                <span style={S.guestText}> · read-only</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Page footer */}
      <div style={S.pageFooter}>
        <span>© {new Date().getFullYear()} DailyThoughts</span>
        <span style={S.footerDot}>·</span>
        <Link to="/privacy" style={S.footerLink}>Privacy</Link>
        <span style={S.footerDot}>·</span>
        <Link to="/terms" style={S.footerLink}>Terms</Link>
      </div>
    </div>
  );
}

/* ─── Google Icon ─────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */
const S = {
  /* Page */
  page: {
    minHeight: '100vh',
    background: C.bg,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    padding: '48px 24px 32px',
    fontFamily: "'Lora', 'Georgia', serif",
  },

  /* BG layers */
  bgCircle1: {
    position:'absolute', bottom:'-8%', left:'2%',
    width:600, height:500, borderRadius:'50%',
    background:'radial-gradient(ellipse,rgba(232,201,122,0.18) 0%,transparent 65%)',
    pointerEvents:'none',
  },
  bgCircle2: {
    position:'absolute', top:'-10%', right:'2%',
    width:500, height:550, borderRadius:'50%',
    background:'radial-gradient(ellipse,rgba(232,201,122,0.1) 0%,transparent 60%)',
    pointerEvents:'none',
  },
  bgCircle3: {
    position:'absolute', top:'45%', left:'35%',
    width:300, height:300, borderRadius:'50%',
    background:'radial-gradient(ellipse,rgba(232,201,122,0.06) 0%,transparent 70%)',
    pointerEvents:'none',
  },
  bgDots: {
    position:'absolute', inset:0,
    backgroundImage:'radial-gradient(rgba(197,162,100,0.2) 1px, transparent 1px)',
    backgroundSize:'28px 28px',
    pointerEvents:'none',
  },
  bgSvg: {
    position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none',
  },

  /* Layout */
  layout: {
    position:'relative', zIndex:2,
    display:'flex', gap:64, alignItems:'center',
    maxWidth:1020, width:'100%',
    flexWrap:'wrap', justifyContent:'center',
  },

  /* ── HERO ── */
  hero: { flex:1, minWidth:280, maxWidth:460 },

  logoRow: { display:'flex', alignItems:'center', gap:14, marginBottom:32 },
  logoBox: {
    width:48, height:48, borderRadius:14, flexShrink:0,
    background:`linear-gradient(135deg,${C.amber},${C.amberDark})`,
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:`0 6px 20px rgba(200,160,60,0.35)`,
    position:'relative', overflow:'hidden',
  },
  logoShine: {
    position:'absolute', inset:0,
    background:'radial-gradient(circle at 28% 28%,rgba(255,255,255,0.35),transparent 55%)',
  },
  logoWordmark: {
    fontFamily:"'Playfair Display','Georgia',serif",
    fontSize:20, fontWeight:700, color:C.ink, letterSpacing:'-0.3px',
  },
  logoTagline: {
    fontFamily:"'DM Mono',monospace",
    fontSize:9, color:C.muted, letterSpacing:2.5,
    textTransform:'uppercase', marginTop:3,
  },

  headline: {
    fontFamily:"'Playfair Display','Georgia',serif",
    fontSize:'clamp(32px,4.5vw,50px)', fontWeight:700,
    color:C.ink, lineHeight:1.1, marginBottom:16, letterSpacing:'-0.5px',
  },
  headlineAccent: { color:C.amberDark, fontStyle:'italic' },

  heroSub: {
    fontFamily:"'Lora','Georgia',serif",
    fontSize:15, lineHeight:1.75, color:C.muted,
    maxWidth:380, marginBottom:24, fontWeight:400,
  },

  chips: { display:'flex', flexWrap:'wrap', gap:8, marginBottom:28 },
  chip: {
    background:'rgba(232,201,122,0.2)',
    border:`1px solid rgba(197,162,100,0.35)`,
    borderRadius:50, padding:'5px 14px',
    fontSize:12.5, color:C.mid,
    fontFamily:"'Lora','Georgia',serif", fontWeight:400,
  },

  quoteCard: {
    background:C.surface,
    border:`1px solid rgba(197,162,100,0.35)`,
    borderRadius:16, padding:'18px 22px',
    position:'relative', overflow:'hidden',
    boxShadow:'0 4px 20px rgba(61,38,0,0.06)',
  },
  quoteTopLine: {
    position:'absolute', top:0, left:0, right:0, height:2,
    background:`linear-gradient(90deg,transparent,${C.amber},transparent)`,
  },
  quoteLabel: {
    fontFamily:"'DM Mono',monospace",
    fontSize:9, color:C.amberDark, letterSpacing:3,
    textTransform:'uppercase', marginBottom:10,
  },
  quoteText: {
    fontFamily:"'Playfair Display','Georgia',serif",
    fontStyle:'italic', fontSize:14, color:C.ink,
    lineHeight:1.65, margin:0,
  },
  quoteAuthor: {
    fontFamily:"'DM Mono',monospace",
    fontSize:10, color:C.muted, marginTop:10,
  },

  heroRule: { height:1, background:`linear-gradient(90deg,${C.amber},transparent)`, margin:'24px 0 12px', opacity:0.4 },
  heroFootNote: {
    fontFamily:"'Lora','Georgia',serif",
    fontSize:12, color:C.mutedLight, fontStyle:'italic',
  },

  /* ── CARD ── */
  card: {
    background:C.white,
    borderRadius:24, overflow:'hidden',
    boxShadow:`0 20px 60px rgba(61,38,0,0.12), 0 0 0 1px rgba(197,162,100,0.2)`,
    width:'100%', maxWidth:400,
    position:'relative',
  },
  cardTopAccent: {
    height:4,
    background:`linear-gradient(90deg,transparent 0%,${C.amber} 30%,${C.amberDark} 70%,transparent 100%)`,
  },
  cardBody: { padding:'28px 32px 32px' },

  cardHeader: { display:'flex', alignItems:'center', gap:14, marginBottom:24 },
  cardAvatarRing: {
    width:50, height:50, borderRadius:15, flexShrink:0,
    background:`linear-gradient(145deg,${C.surface},${C.surfaceHigh})`,
    border:`1.5px solid rgba(197,162,100,0.4)`,
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:`0 2px 10px rgba(197,162,100,0.2)`,
  },
  cardTitle: {
    fontFamily:"'Playfair Display','Georgia',serif",
    fontSize:22, fontWeight:700, color:C.ink, marginBottom:3, letterSpacing:'-0.2px',
  },
  cardSub: {
    fontFamily:"'Lora','Georgia',serif",
    fontSize:13, color:C.mutedLight, fontWeight:400,
  },

  /* Error */
  errorBox: {
    background:C.rosePale, border:`1px solid rgba(217,112,104,0.25)`,
    borderRadius:12, padding:'11px 14px', fontSize:13,
    color:'#c0392b', marginBottom:18,
    display:'flex', alignItems:'flex-start', gap:10,
    fontFamily:"'Lora','Georgia',serif",
  },
  errorClose: {
    background:'none', border:'none', color:'rgba(192,57,43,0.5)',
    cursor:'pointer', fontSize:12, padding:0, marginLeft:'auto', flexShrink:0,
  },

  /* Fields */
  fieldGroup: { marginBottom:18 },
  label: {
    display:'block', marginBottom:7,
    fontFamily:"'DM Mono',monospace",
    fontSize:10.5, fontWeight:500,
    letterSpacing:1.5, textTransform:'uppercase',
    transition:'color 0.2s',
  },
  inputWrap: { position:'relative' },
  inputIcon: {
    position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
    fontSize:13, pointerEvents:'none', opacity:0.35, zIndex:1,
  },
  input: {
    width:'100%', padding:'12px 16px 12px 38px',
    background:C.bg,
    border:`1.5px solid rgba(197,162,100,0.3)`,
    borderRadius:12, outline:'none',
    fontSize:14, color:C.ink,
    fontFamily:"'Lora','Georgia',serif",
    transition:'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    boxSizing:'border-box',
  },
  focusLine: {
    position:'absolute', bottom:0, left:0, height:2,
    borderRadius:'0 0 12px 12px',
    transition:'width 0.35s ease',
  },
  eyeBtn: {
    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
    background:'none', border:'none', cursor:'pointer',
    fontSize:14, padding:4, opacity:0.45,
    transition:'opacity 0.2s',
  },

  /* Remember */
  rememberRow: {
    display:'flex', alignItems:'center', gap:8,
    marginBottom:18, cursor:'pointer',
  },
  rememberText: {
    fontSize:13, color:C.mutedLight,
    fontFamily:"'Lora','Georgia',serif",
  },

  /* Forgot */
  forgotLink: {
    fontSize:12, color:C.amberDark, fontWeight:600,
    textDecoration:'none', fontFamily:"'DM Mono',monospace",
    letterSpacing:0.3,
  },

  /* Primary button */
  btnPrimary: {
    width:'100%', padding:'13px 20px',
    background:`linear-gradient(135deg,${C.amber} 0%,${C.amberDark} 100%)`,
    border:'none', borderRadius:12,
    fontSize:14, fontWeight:700, color:C.ink,
    cursor:'pointer', letterSpacing:'0.3px',
    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    fontFamily:"'Lora','Georgia',serif",
    boxShadow:`0 4px 18px rgba(200,160,60,0.35)`,
    transition:'all 0.2s',
  },
  btnArrow: { fontSize:16, fontWeight:800 },
  spinner: {
    display:'inline-block', width:14, height:14,
    border:`2px solid rgba(61,38,0,0.25)`,
    borderTopColor:C.ink, borderRadius:'50%',
    animation:'dt-spin 0.7s linear infinite',
  },

  /* Divider */
  divider: { display:'flex', alignItems:'center', gap:12, margin:'20px 0' },
  divLine: { flex:1, height:1, background:`rgba(197,162,100,0.25)` },
  divText: {
    fontFamily:"'DM Mono',monospace", fontSize:10,
    color:C.mutedLight, letterSpacing:1.2, whiteSpace:'nowrap',
  },

  /* Google */
  googleBtn: {
    width:'100%', padding:'12px 16px',
    background:C.bg,
    border:`1.5px solid rgba(197,162,100,0.3)`,
    borderRadius:12, fontSize:13, fontWeight:500,
    color:C.mid, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    fontFamily:"'Lora','Georgia',serif",
    transition:'all 0.2s',
    boxShadow:'0 1px 6px rgba(61,38,0,0.05)',
  },

  /* Register */
  registerText: {
    textAlign:'center', marginTop:16, fontSize:13,
    color:C.mutedLight, fontFamily:"'Lora','Georgia',serif",
  },
  link: { color:C.amberDark, fontWeight:600, textDecoration:'none' },

  /* Guest bar */
  guestBar: {
    marginTop:14, padding:'12px 16px',
    background:C.surface,
    border:`1px solid rgba(197,162,100,0.25)`,
    borderRadius:12, display:'flex', alignItems:'center', gap:10,
    transition:'background 0.2s, border-color 0.2s',
  },
  guestText: {
    fontSize:12.5, color:C.mutedLight,
    fontFamily:"'Lora','Georgia',serif",
  },
  guestLink: {
    fontSize:12.5, color:C.amberDark, fontWeight:600,
    cursor:'pointer', fontFamily:"'Lora','Georgia',serif",
  },

  /* Page footer */
  pageFooter: {
    marginTop:32, display:'flex', alignItems:'center', gap:10,
    fontFamily:"'DM Mono',monospace", fontSize:11,
    color:'rgba(122,96,64,0.4)', position:'relative', zIndex:2,
  },
  footerDot: { opacity:0.4 },
  footerLink: { color:'rgba(122,96,64,0.5)', textDecoration:'none' },
};

/* ─── Global CSS ──────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');

  @keyframes dt-spin { to { transform: rotate(360deg); } }

  input::placeholder { color: rgba(122,96,64,0.35) !important; font-family: 'Lora','Georgia',serif; }
  input[type="password"] { letter-spacing: 4px; }
  input[type="password"]::placeholder,
  input[type="text"]     { letter-spacing: normal; }

  .dt-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 28px rgba(200,160,60,0.45) !important;
  }
  .dt-btn-primary:active:not(:disabled) {
    transform: translateY(0px) !important;
  }
  .dt-btn-google:hover {
    background: #FFF8EE !important;
    border-color: rgba(197,162,100,0.55) !important;
    color: #3D2600 !important;
    box-shadow: 0 4px 16px rgba(61,38,0,0.08) !important;
  }
  .dt-guest-bar:hover {
    background: #EDE0C4 !important;
    border-color: rgba(197,162,100,0.45) !important;
  }
`;