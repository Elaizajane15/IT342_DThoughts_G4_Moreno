import { useState } from 'react'

/* Warm Parchment */
const C = {
  surface:   '#F5ECD4',
  border:    'rgba(197,162,100,0.3)',
  ink:       '#3D2600',
  amberDark: '#C9A84C',
}

function initialsFromName(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const SIZES = { sm: 32, md: 40, lg: 56, xl: 96 }

export default function Avatar({ name, size = 'md', src, style, onClick }) {
  const px       = SIZES[size] ?? SIZES.md
  const initials = initialsFromName(name)
  const [failedSrc, setFailedSrc] = useState(null)
  const failed   = !!src && failedSrc === src

  const base = {
    width: px, height: px,
    borderRadius: '50%', overflow: 'hidden',
    display: 'grid', placeItems: 'center',
    /* warm parchment surface with amber border */
    background: `linear-gradient(145deg, ${C.surface}, #EDE0C4)`,
    border: `1.5px solid rgba(197,162,100,0.4)`,
    boxShadow: `0 1px 6px rgba(61,38,0,0.1)`,
    flexShrink: 0,
    fontFamily: "'Playfair Display','Georgia',serif",
    fontWeight: 700,
    color: C.amberDark,
    fontSize: px <= 32 ? '11px' : px <= 40 ? '13px' : px <= 56 ? '16px' : '24px',
    cursor: onClick ? 'pointer' : 'default',
    letterSpacing: '0.5px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ? `${name} avatar` : 'avatar'}
        style={{ ...base, objectFit: 'cover', display: 'block', ...(style || {}) }}
        onClick={onClick}
        onError={() => setFailedSrc(src)}
      />
    )
  }

  return (
    <div style={{ ...base, ...(style || {}) }} onClick={onClick}>
      {initials}
    </div>
  )
}