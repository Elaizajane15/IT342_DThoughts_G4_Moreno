import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi, oauthApi } from '../utils/api';
import { theme, sx } from '../theme';

const STEPS = ['Account', 'Personal', 'Done'];

export default function RegisterPage() {
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Password strength 0–4
  const strength = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColor = ['#e5d9c3', '#ef4444', '#f59e0b', '#10b981', '#10b981'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  const nextStep = (e) => {
    e.preventDefault();
    setError('');
    if (step === 0) {
      if (!form.email) { setError('Email is required.'); return; }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName) { setError('Please enter your full name.'); return; }
    setLoading(true);
    try {
      const res = await authApi.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      login(res.token, res.user);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />

      {/* Back to login */}
      <div style={styles.topBar}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>📓</div>
          <span style={styles.logoText}>
            Daily<span style={{ color: theme.colors.amber }}>Thoughts</span>
          </span>
        </div>
        <Link to="/login" style={styles.backLink}>← Back to Login</Link>
      </div>

      <div style={styles.card}>
        {/* Step indicators */}
        <div style={styles.stepRow}>
          {STEPS.map((label, i) => (
            <div key={label} style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                background: i <= step ? theme.colors.amber : theme.colors.border,
                transform: i === step ? 'scale(1.2)' : 'scale(1)',
              }} />
              <span style={{ ...styles.stepLabel, color: i <= step ? theme.colors.amberDark : theme.colors.inkMuted }}>
                {label}
              </span>
            </div>
          ))}
          <div style={styles.stepLine} />
        </div>

        <h2 style={styles.title}>Create your account</h2>
        <p style={styles.sub}>Join the DailyThoughts community today</p>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        {/* ── Step 0: Email + Password ── */}
        {step === 0 && (
          <form onSubmit={nextStep}>
            <Field label="Email address" name="email" type="email"
              placeholder="you@example.com" value={form.email} onChange={handleChange} />

            <Field label="Password" name="password" type="password"
              placeholder="At least 8 characters" value={form.password} onChange={handleChange} />

            {/* Password strength bar */}
            {form.password && (
              <div style={{ marginTop: '-10px', marginBottom: '16px' }}>
                <div style={styles.strengthBar}>
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{ ...styles.strengthSeg, background: n <= strength ? strengthColor : theme.colors.border }} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: strengthColor, fontFamily: theme.fonts.mono }}>{strengthLabel}</span>
              </div>
            )}

            <Field label="Confirm Password" name="confirmPassword" type="password"
              placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} />

            <button type="submit" style={sx.btnPrimary}>Continue →</button>
          </form>
        )}

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Field label="First Name" name="firstName" placeholder="Juan"
                  value={form.firstName} onChange={handleChange} />
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Last Name" name="lastName" placeholder="Dela Cruz"
                  value={form.lastName} onChange={handleChange} />
              </div>
            </div>

            <div style={styles.termsRow}>
              <input type="checkbox" id="terms" required style={{ accentColor: theme.colors.amber }} />
              <label htmlFor="terms" style={{ fontSize: '12px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>
                I agree to the <span style={{ color: theme.colors.amberDark, fontWeight: 600 }}>Terms of Service</span> and{' '}
                <span style={{ color: theme.colors.amberDark, fontWeight: 600 }}>Privacy Policy</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setStep(0)} style={styles.backBtn}>← Back</button>
              <button type="submit" disabled={loading} style={{ ...sx.btnPrimary, flex: 1, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creating account…' : 'Create Account ✓'}
              </button>
            </div>
          </form>
        )}

        {/* Divider + Google */}
        <div style={styles.divider}>
          <div style={{ flex: 1, height: '1px', background: theme.colors.border }} />
          <span style={{ fontSize: '12px', color: theme.colors.inkMuted, fontFamily: theme.fonts.body }}>or register with</span>
          <div style={{ flex: 1, height: '1px', background: theme.colors.border }} />
        </div>

        <button onClick={() => window.location.href = oauthApi.googleLoginUrl()} style={styles.googleBtn}>
          <GoogleIcon />
          Register with Google
        </button>

        <p style={styles.loginText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, name, type = 'text', placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={sx.label}>{label}</label>
      <input
        name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} required
        style={sx.input}
        onFocus={e => e.target.style.borderColor = theme.colors.amber}
        onBlur={e  => e.target.style.borderColor = theme.colors.border}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: theme.colors.ink,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px 60px',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(217,119,6,0.08) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  topBar: {
    width: '100%',
    maxWidth: '440px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '28px 0 20px',
    position: 'relative',
    zIndex: 2,
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: {
    width: '32px', height: '32px',
    background: theme.colors.amber,
    borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px',
  },
  logoText: { fontFamily: theme.fonts.display, fontSize: '16px', fontWeight: '700', color: theme.colors.cream },
  backLink: { color: theme.colors.inkMuted, fontSize: '13px', textDecoration: 'none', fontFamily: theme.fonts.body },
  card: {
    background: theme.colors.warmWhite,
    borderRadius: '20px',
    padding: '36px 32px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
    position: 'relative',
    zIndex: 2,
  },
  stepRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '48px',
    marginBottom: '28px',
    position: 'relative',
  },
  stepLine: {
    position: 'absolute',
    top: '8px', left: '20%', right: '20%',
    height: '1px', background: theme.colors.border,
    zIndex: 0,
  },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', zIndex: 1 },
  stepDot: { width: '16px', height: '16px', borderRadius: '50%', transition: theme.transition },
  stepLabel: { fontSize: '10px', fontFamily: theme.fonts.mono, transition: theme.transition },
  title: { fontFamily: theme.fonts.display, fontSize: '22px', fontWeight: '700', color: theme.colors.ink, marginBottom: '6px' },
  sub: { color: theme.colors.inkMuted, fontSize: '13px', marginBottom: '22px', fontFamily: theme.fonts.body },
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
  strengthBar: { display: 'flex', gap: '4px', marginBottom: '4px' },
  strengthSeg: { height: '3px', flex: 1, borderRadius: '2px', transition: 'background 0.3s' },
  termsRow: { display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px' },
  backBtn: {
    padding: '13px 20px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    background: 'transparent',
    fontSize: '14px',
    fontWeight: '600',
    color: theme.colors.inkMuted,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
  },
  divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' },
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
    fontFamily: theme.fonts.body,
  },
  loginText: {
    textAlign: 'center',
    marginTop: '18px',
    fontSize: '12.5px',
    color: theme.colors.inkMuted,
    fontFamily: theme.fonts.body,
  },
  link: { color: theme.colors.amberDark, fontWeight: '600', textDecoration: 'none' },
};
