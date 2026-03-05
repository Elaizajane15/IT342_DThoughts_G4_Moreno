import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, oauthApi } from '../utils/api';
import Toast from '../components/Toast';

const STEPS = ['Account', 'Personal', 'Done'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

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
    setSuccess('');
    if (!form.firstName || !form.lastName) { setError('Please enter your full name.'); return; }
    setLoading(true);
    try {
      const res = await authApi.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      setSuccess('Registration Successfully!');
      login(res.token, res.user);
      setTimeout(() => navigate('/feed'), 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Toast message={success} type="success" duration={5000} onClose={() => setSuccess('')} />
      <div className="register-bg" />

      <div className="register-top-bar">
        <div className="login-logo-row">
          <div className="login-logo-icon">📓</div>
          <span className="login-logo-text">
            Daily<span style={{ color: '#d97706' }}>Thoughts</span>
          </span>
        </div>
        <Link to="/login" className="register-back-link">← Back to Login</Link>
      </div>

      <div className="register-card">
        <div className="register-step-row">
          {STEPS.map((label, i) => (
            <div key={label} className="register-step-item">
              <div className={`register-step-dot ${i <= step ? 'register-step-dot-active' : 'register-step-dot-inactive'}`} />
              <span className="register-step-label" style={{ color: i <= step ? '#1f2937' : '#9ca3af' }}>
                {label}
              </span>
            </div>
          ))}
          <div className="register-step-line" />
        </div>

        <h2 className="register-title">Create your account</h2>
        <p className="register-sub">Join the DailyThoughts community today</p>

        {error && <div className="register-error-box">⚠️ {error}</div>}

        {step === 0 && (
          <form onSubmit={nextStep}>
            <div className="register-form-group">
              <label className="register-label">Email address</label>
              <input
                className="register-input"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-form-group">
              <label className="register-label">Password</label>
              <input
                className="register-input"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
              {form.password && (
                <div style={{ marginTop: '-10px', marginBottom: '16px' }}>
                  <div className="register-strength-bar">
                    {[1,2,3,4].map(n => (
                      <div key={n} className="register-strength-seg" style={{ background: n <= strength ? strengthColor : '#e5e7eb' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: strengthColor, fontFamily: '"Fira Code", monospace' }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="register-form-group">
              <label className="register-label">Confirm Password</label>
              <input
                className="register-input"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="register-btn-primary">Continue →</button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label className="register-label">First Name</label>
                <input
                  className="register-input"
                  name="firstName"
                  placeholder="Juan"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="register-label">Last Name</label>
                <input
                  className="register-input"
                  name="lastName"
                  placeholder="Dela Cruz"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="register-terms-row">
              <input type="checkbox" id="terms" required style={{ accentColor: '#d97706' }} />
              <label htmlFor="terms">
                I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>
              </label>
            </div>

            <div className="register-btn-row">
              <button type="button" onClick={() => setStep(0)} className="register-back-btn">← Back</button>
              <button type="submit" disabled={loading} className="register-btn-primary">
                {loading ? 'Creating account…' : 'Create Account ✓'}
              </button>
            </div>
          </form>
        )}

        <div className="register-divider">
          <div className="register-divider-line" />
          <span className="register-divider-text">or register with</span>
          <div className="register-divider-line" />
        </div>

        <button onClick={() => window.location.href = oauthApi.googleLoginUrl()} className="register-google-btn">
          <GoogleIcon />
          Register with Google
        </button>

        <p className="register-login-text">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
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


