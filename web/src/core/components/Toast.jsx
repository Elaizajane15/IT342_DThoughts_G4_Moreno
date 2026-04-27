import { useEffect, useMemo } from 'react'

/* Warm Parchment */
const C = {
  amber:     '#E8C97A',
  amberDark: '#C9A84C',
  ink:       '#3D2600',
  surface:   '#FFF8EE',
  rose:      '#c0392b',
}

export default function Toast({ message, type = 'success', duration = 5000, onClose }) {
  const isSuccess = type === 'success'

  const toastStyle = useMemo(() => ({
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 10000,
    maxWidth: 380,
    width: 'calc(100% - 40px)',
    /* light warm card instead of dark */
    background: C.surface,
    border: `1px solid rgba(197,162,100,0.35)`,
    borderLeft: `4px solid ${isSuccess ? C.amberDark : C.rose}`,
    borderRadius: 14,
    boxShadow: '0 8px 32px rgba(61,38,0,0.14), 0 2px 8px rgba(61,38,0,0.08)',
    padding: '13px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    cursor: 'pointer',
    fontFamily: "'Lora','Georgia',serif",
    fontSize: 13,
    color: C.ink,
    animation: 'dt-toast-in 0.3s cubic-bezier(0.4,0,0.2,1)',
  }), [isSuccess])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <>
      <style>{`
        @keyframes dt-toast-in {
          from { opacity:0; transform:translateX(20px) scale(0.96); }
          to   { opacity:1; transform:translateX(0)    scale(1);    }
        }
      `}</style>
      <div style={toastStyle} onClick={onClose} role="status" aria-live="polite">
        {/* Icon badge */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: isSuccess ? 'rgba(200,168,76,0.15)' : 'rgba(192,57,43,0.08)',
          border: `1px solid ${isSuccess ? 'rgba(200,168,76,0.3)' : 'rgba(192,57,43,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
        }}>
          <span style={{ color: isSuccess ? C.amberDark : C.rose }}>
            {isSuccess ? '✓' : '⚠'}
          </span>
        </div>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 700, fontSize: 13,
            color: isSuccess ? C.amberDark : C.rose,
            fontFamily: "'DM Mono',monospace", letterSpacing: 0.5,
            textTransform: 'uppercase', marginBottom: 2,
          }}>
            {isSuccess ? 'Success' : 'Error'}
          </p>
          <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, fontWeight: 400 }}>
            {message}
          </p>
        </div>

        {/* Close */}
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(122,96,64,0.45)', fontSize: 12, fontWeight: 700,
          padding: '2px 4px', flexShrink: 0, lineHeight: 1,
          fontFamily: "'DM Mono',monospace",
        }}>
          ✕
        </button>
      </div>
    </>
  )
}