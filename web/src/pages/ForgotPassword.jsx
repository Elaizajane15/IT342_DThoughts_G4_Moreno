import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../utils/api'
import { sx, theme } from '../theme'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canReset = useMemo(() => {
    return token.trim() && newPassword && confirmPassword
  }, [confirmPassword, newPassword, token])

  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(email)
      setSuccess(res.message || 'If an account exists, a reset code has been generated.')
    } catch (err) {
      setError(err?.message || 'Failed to request reset code.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.resetPassword({ token, newPassword })
      setSuccess(res.message || 'Password has been reset successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err?.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.bg} />

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
        <h2 style={styles.title}>Forgot Password</h2>
        <p style={styles.sub}>Request a reset code, then set a new password.</p>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}
        {success && <div style={styles.successBox}>✓ {success}</div>}

        <form onSubmit={handleRequest} style={{ marginBottom: '18px' }}>
          <label style={sx.label}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={sx.input}
            onFocus={e => { e.target.style.borderColor = theme.colors.amber }}
            onBlur={e => { e.target.style.borderColor = theme.colors.border }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{ ...sx.btnPrimary, width: '100%', marginTop: '12px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Sending…' : 'Send Reset Code'}
          </button>
        </form>

        <div style={styles.divider} />

        <form onSubmit={handleReset}>
          <label style={sx.label}>Reset Code</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste reset code"
            style={sx.input}
            onFocus={e => { e.target.style.borderColor = theme.colors.amber }}
            onBlur={e => { e.target.style.borderColor = theme.colors.border }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={sx.label}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                style={sx.input}
                onFocus={e => { e.target.style.borderColor = theme.colors.amber }}
                onBlur={e => { e.target.style.borderColor = theme.colors.border }}
              />
            </div>
            <div>
              <label style={sx.label}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                style={sx.input}
                onFocus={e => { e.target.style.borderColor = theme.colors.amber }}
                onBlur={e => { e.target.style.borderColor = theme.colors.border }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !canReset}
            style={{
              ...sx.btnPrimary,
              width: '100%',
              marginTop: '12px',
              opacity: (loading || !canReset) ? 0.7 : 1,
              background: theme.colors.ink,
              color: theme.colors.cream,
            }}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <Link to="/login" style={styles.link}>Back to Login</Link>
        </div>
      </div>
    </div>
  )
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
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(217,119,6,0.08) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  topBar: {
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '28px 0 20px',
    position: 'relative',
    zIndex: 2,
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: theme.colors.amber,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
  },
  logoText: {
    fontFamily: theme.fonts.display,
    fontSize: '16px',
    fontWeight: '700',
    color: theme.colors.cream,
  },
  backLink: {
    color: theme.colors.inkMuted,
    fontSize: '13px',
    textDecoration: 'none',
    fontFamily: theme.fonts.body,
  },
  card: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    padding: '34px 32px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
    position: 'relative',
    zIndex: 2,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: '22px',
    fontWeight: 800,
    color: theme.colors.ink,
    margin: 0,
    marginBottom: '6px',
  },
  sub: {
    color: theme.colors.inkMuted,
    fontSize: '13px',
    margin: 0,
    marginBottom: '18px',
    fontFamily: theme.fonts.body,
  },
  errorBox: {
    background: theme.colors.rosePale,
    border: `1px solid ${theme.colors.rose}40`,
    borderRadius: theme.radius.sm,
    padding: '10px 14px',
    fontSize: '13px',
    color: theme.colors.rose,
    marginBottom: '14px',
    fontFamily: theme.fonts.body,
  },
  successBox: {
    background: theme.colors.amberPale,
    border: `1px solid ${theme.colors.amber}60`,
    borderRadius: theme.radius.sm,
    padding: '10px 14px',
    fontSize: '13px',
    color: theme.colors.ink,
    marginBottom: '14px',
    fontFamily: theme.fonts.body,
    fontWeight: 600,
  },
  divider: {
    height: 1,
    background: theme.colors.border,
    margin: '16px 0',
  },
  link: {
    color: theme.colors.amberDark,
    fontWeight: 700,
    textDecoration: 'none',
    fontFamily: theme.fonts.body,
    fontSize: '12.5px',
  },
}
