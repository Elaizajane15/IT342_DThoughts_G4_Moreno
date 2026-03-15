import { useState } from 'react'
import { theme } from '../theme'

function initialsFromName(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
}

export default function Avatar({ name, size = 'md', src, style, onClick }) {
  const px = SIZES[size] ?? SIZES.md
  const initials = initialsFromName(name)
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = !!src && failedSrc === src

  const baseStyle = {
    width: px,
    height: px,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'grid',
    placeItems: 'center',
    background: theme.colors.parchment,
    border: `1px solid ${theme.colors.border}`,
    flexShrink: 0,
    fontFamily: theme.fonts.display,
    fontWeight: 700,
    color: theme.colors.ink,
    fontSize: px <= 32 ? '12px' : px <= 40 ? '13px' : '16px',
    cursor: onClick ? 'pointer' : 'default',
  }

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ? `${name} avatar` : 'avatar'}
        style={{ ...baseStyle, objectFit: 'cover', display: 'block', ...(style || {}) }}
        onClick={onClick}
        onError={() => setFailedSrc(src)}
      />
    )
  }

  return <div style={{ ...baseStyle, ...(style || {}) }} onClick={onClick}>{initials}</div>
}
