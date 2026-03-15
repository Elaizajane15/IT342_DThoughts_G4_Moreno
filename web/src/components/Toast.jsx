import { useEffect, useMemo } from 'react'
import { theme } from '../theme'

export default function Toast({ message, type = 'success', duration = 5000, onClose }) {
  const style = useMemo(() => {
    const isSuccess = type === 'success'
    const accent = isSuccess ? theme.colors.amber : theme.colors.rose
    return {
      position: 'fixed',
      top: 18,
      right: 18,
      zIndex: 10000,
      maxWidth: 360,
      width: 'calc(100% - 36px)',
      padding: '12px 14px',
      borderRadius: theme.radius.lg,
      color: theme.colors.warmWhite,
      background: 'rgba(15, 23, 42, 0.95)',
      border: `1px solid ${theme.colors.border}30`,
      borderLeft: `5px solid ${accent}`,
      boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
      fontFamily: theme.fonts.body,
      fontSize: '13px',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
    }
  }, [type])

  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} style={style} onClick={onClose} role="status" aria-live="polite">
      <span style={{ fontFamily: theme.fonts.display, fontSize: '14px' }}>
        {type === 'success' ? '✓' : '⚠️'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{message}</div>
      <span style={{ opacity: 0.85, fontWeight: 900 }}>✕</span>
    </div>
  );
}
