import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi, quotesApi, oauthApi } from '../utils/api';
import Toast from '../components/Toast';
import { theme, sx } from '../theme';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote]   = useState(null);
  const [toast, setToast]   = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/feed');
  }, [user, navigate]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token') || url.searchParams.get('accessToken');
    const oauthError = url.searchParams.get('oauthError') || url.searchParams.get('error');

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      url.searchParams.delete('oauthError');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    if (!token) return;

    const u = {
      id: Number(url.searchParams.get('id')) || null,
      email: url.searchParams.get('email') || '',
      firstName: url.searchParams.get('firstName') || '',
      lastName: url.searchParams.get('lastName') || '',
      avatarUrl: url.searchParams.get('avatarUrl') || '',
      coverImageUrl: url.searchParams.get('coverImageUrl') || '',
    };

    sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Login successful.', type: 'success' }));
    login(token, u);
    url.searchParams.delete('token');
    url.searchParams.delete('accessToken');
    url.searchParams.delete('id');
    url.searchParams.delete('email');
    url.searchParams.delete('firstName');
    url.searchParams.delete('lastName');
    url.searchParams.delete('avatarUrl');
    url.searchParams.delete('coverImageUrl');
    window.history.replaceState({}, '', url.toString());
    navigate('/feed', { replace: true });
  }, [login, navigate]);

  // Fetch daily quote from backend (external API cache)
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
      const parsed = JSON.parse(raw);
      if (parsed?.message) setToast({ message: String(parsed.message), type: parsed.type === 'error' ? 'error' : 'success' });
    } catch {
      setToast({ message: String(raw), type: 'success' });
    }
  }, []);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      login(res.token, res.user);
      sessionStorage.setItem('dt_toast', JSON.stringify({ message: 'Login successful.', type: 'success' }));
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = oauthApi.googleLoginUrl();
  };

  const handleGuest = () => navigate('/feed');

  return (
    <div style={styles.page}>
      <Toast message={toast?.message} type={toast?.type || 'success'} onClose={() => setToast(null)} />
      {/* Background effects */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.grid} />

      <div style={styles.content}>
        {/* Left: Hero */}
        <div style={styles.hero}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>📓</div>
            <span style={styles.logoText}>
              Daily<span style={{ color: theme.colors.amberLight }}>Thoughts</span>
            </span>
          </div>

          <h1 style={styles.headline}>
            Where your<br />
            <em style={{ color: theme.colors.amberLight, fontStyle: 'italic' }}>thoughts</em>
            <br />come alive.
          </h1>

          <p style={styles.subtext}>
            A space to journal, reflect, and share your daily thoughts with a community that listens.
          </p>

          {/* Daily Quote Widget */}
          {quote && (
            <div style={styles.quoteCard}>
              <div style={styles.quoteLabel}>✨ Daily Quote · Quotable API</div>
              <p style={styles.quoteText}>"{quote.quoteText}"</p>
              <p style={styles.quoteAuthor}>— {quote.author}</p>
            </div>
          )}
        </div>

        {/* Right: Login Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome back</h2>
          <p style={styles.cardSub}>Sign in to your account to continue</p>

          {error && (
            <div style={styles.errorBox}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={sx.label}>Email address</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                style={sx.input}
                onFocus={e => e.target.style.borderColor = theme.colors.amber}
                onBlur={e  => e.target.style.borderColor = theme.colors.border}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={sx.label}>Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                style={sx.input}
                onFocus={e => e.target.style.borderColor = theme.colors.amber}
                onBlur={e  => e.target.style.borderColor = theme.colors.border}
              />
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...sx.btnPrimary, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <Divider />

          <button onClick={handleGoogle} style={styles.googleBtn}>
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={styles.registerText}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={styles.link}>Create one</Link>
          </p>

          <div style={styles.guestBar}>
            Just browsing?{' '}
            <span onClick={handleGuest} style={styles.guestLink}>
              Continue as Guest
            </span>{' '}
            (read-only access)
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: theme.colors.inkMuted, fontSize: '12px', fontFamily: theme.fonts.body }}>
      <div style={{ flex: 1, height: '1px', background: theme.colors.border }} />
      or continue with
      <div style={{ flex: 1, height: '1px', background: theme.colors.border }} />
    </div>
  );
}

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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: theme.colors.ink,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '40px 20px',
  },
  bgGlow1: {
    position: 'absolute',
    bottom: 0, left: '10%',
    width: '600px', height: '400px',
    background: 'radial-gradient(ellipse, rgba(217,119,6,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    top: 0, right: '5%',
    width: '400px', height: '500px',
    background: 'radial-gradient(ellipse, rgba(217,119,6,0.06) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(217,119,6,0.05) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(217,119,6,0.03) 60px)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    gap: '80px',
    alignItems: 'center',
    maxWidth: '960px',
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hero: { flex: 1, minWidth: '280px', maxWidth: '420px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' },
  logoIcon: {
    width: '44px', height: '44px',
    background: theme.colors.amber,
    borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px',
  },
  logoText: {
    fontFamily: theme.fonts.display,
    fontSize: '22px',
    fontWeight: '700',
    color: theme.colors.cream,
  },
  headline: {
    fontFamily: theme.fonts.display,
    fontSize: 'clamp(32px, 5vw, 52px)',
    fontWeight: '900',
    color: theme.colors.cream,
    lineHeight: 1.1,
    marginBottom: '20px',
  },
  subtext: {
    color: '#a08060',
    fontSize: '15px',
    lineHeight: 1.7,
    maxWidth: '360px',
    marginBottom: '28px',
    fontFamily: theme.fonts.body,
  },
  quoteCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(217,119,6,0.2)',
    borderRadius: theme.radius.md,
    padding: '18px 20px',
  },
  quoteLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: '9px',
    color: theme.colors.amber,
    letterSpacing: '2px',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  quoteText: {
    color: '#d4c4a8',
    fontStyle: 'italic',
    fontSize: '13.5px',
    lineHeight: 1.6,
    fontFamily: theme.fonts.display,
    margin: 0,
  },
  quoteAuthor: {
    color: '#6a5a40',
    fontSize: '11px',
    marginTop: '8px',
    fontFamily: theme.fonts.mono,
  },
  card: {
    background: theme.colors.warmWhite,
    borderRadius: '20px',
    padding: '36px 32px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
    width: '100%',
    maxWidth: '380px',
  },
  cardTitle: {
    fontFamily: theme.fonts.display,
    fontSize: '24px',
    fontWeight: '700',
    color: theme.colors.ink,
    marginBottom: '6px',
  },
  cardSub: { color: theme.colors.inkMuted, fontSize: '13px', marginBottom: '24px', fontFamily: theme.fonts.body },
  errorBox: {
    background: theme.colors.rosePale,
    border: `1px solid ${theme.colors.rose}40`,
    borderRadius: theme.radius.sm,
    padding: '10px 14px',
    fontSize: '13px',
    color: theme.colors.rose,
    marginBottom: '16px',
    fontFamily: theme.fonts.body,
  },
  forgotLink: {
    fontSize: '12px',
    color: theme.colors.amberDark,
    cursor: 'pointer',
    fontWeight: '600',
    fontFamily: theme.fonts.body,
    textDecoration: 'none',
  },
  googleBtn: {
    width: '100%',
    padding: '11px',
    background: theme.colors.warmWhite,
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    fontSize: '13px',
    fontWeight: '500',
    color: theme.colors.inkLight,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: theme.transition,
    fontFamily: theme.fonts.body,
  },
  registerText: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '12.5px',
    color: theme.colors.inkMuted,
    fontFamily: theme.fonts.body,
  },
  link: {
    color: theme.colors.amberDark,
    fontWeight: '600',
    textDecoration: 'none',
  },
  guestBar: {
    marginTop: '14px',
    padding: '12px',
    background: theme.colors.parchment,
    borderRadius: theme.radius.md,
    textAlign: 'center',
    fontSize: '12px',
    color: theme.colors.inkMuted,
    fontFamily: theme.fonts.body,
  },
  guestLink: {
    color: theme.colors.amberDark,
    fontWeight: '600',
    cursor: 'pointer',
  },
};
