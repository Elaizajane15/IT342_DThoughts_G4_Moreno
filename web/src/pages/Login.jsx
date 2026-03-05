import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, quotesApi, oauthApi } from '../utils/api';
import Toast from '../components/Toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (user) navigate('/feed');
  }, [user, navigate]);

  useEffect(() => {
    quotesApi.getDailyQuote()
      .then(setQuote)
      .catch(() => setQuote({ quoteText: 'Every day is a new page in your story.', author: 'DailyThoughts' }));
  }, []);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      setSuccess('Login Successfully!');
      login(res.token, res.user);
      setTimeout(() => navigate('/feed'), 1500);
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
    <div className="login-page">
      <Toast message={success} type="success" duration={5000} onClose={() => setSuccess('')} />
      <div className="login-bg-glow-1" />
      <div className="login-bg-glow-2" />

      <div className="login-content">
        {/* Left: Hero Section */}
        <div className="login-hero">
          <div className="login-logo-row">
            <div className="login-logo-icon">✨</div>
            <div className="login-logo-text">DailyThoughts</div>
          </div>

          <h1 className="login-headline">Your daily dose of inspiration</h1>
          <p className="login-subtext">
            Share your thoughts, connect with others, and discover what's on everyone's mind today.
          </p>

          {quote && (
            <div className="login-quote-card">
              <div className="login-quote-label">✨ Daily Quote · Quotable API</div>
              <p className="login-quote-text">"{quote.quoteText}"</p>
              <p className="login-quote-author">— {quote.author}</p>
            </div>
          )}
        </div>

        {/* Right: Login Card */}
        <div className="login-card">
          <h2 className="login-card-title">Welcome back</h2>
          <p className="login-card-sub">Sign in to your account to continue</p>

          {error && (
            <div className="login-error-box">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label className="login-label">Email address</label>
              <input
                className="login-input"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="login-form-group">
              <label className="login-label">Password</label>
              <input
                className="login-input"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
              />
              <div className="login-forgot-link">Forgot password?</div>
            </div>

            <button
              className="login-btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div className="login-divider">
            <div className="login-divider-line" />
            or continue with
            <div className="login-divider-line" />
          </div>

          <button onClick={handleGoogle} className="login-google-btn">
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="login-register-text">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>

          <div className="login-guest-bar">
            Just browsing?{' '}
            <span onClick={handleGuest} className="login-guest-link">
              Continue as Guest
            </span>{' '}
            (read-only access)
          </div>
        </div>
      </div>
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


