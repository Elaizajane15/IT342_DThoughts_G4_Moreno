/* ─────────────────────────────────────────────────────────────
   WARM PARCHMENT — Shared theme tokens
   Use this object to replace all theme.colors.* references
   ───────────────────────────────────────────────────────────── */

export const P = {
  // Backgrounds
  bg:        '#FFF8EE',   // warm ivory — page shell
  card:      '#ffffff',   // pure white — card surfaces
  surface:   '#F5ECD4',   // parchment  — input bg, tab bg
  surfaceHi: '#EDE0C4',   // deep parchment — hover states

  // Borders
  border:    'rgba(197,162,100,0.28)',
  borderHov: 'rgba(197,162,100,0.55)',

  // Accent
  amber:     '#E8C97A',
  amberDark: '#C9A84C',
  amberDeep: '#A67C28',
  amberPale: 'rgba(232,201,122,0.18)',

  // Text
  ink:       '#3D2600',   // primary text
  inkMuted:  '#7A6040',   // secondary / muted
  inkSoft:   'rgba(122,96,64,0.6)',

  // Status
  rose:      '#c0392b',
  rosePale:  'rgba(192,57,43,0.07)',

  // Fonts
  fontHead:  "'Playfair Display','Georgia',serif",
  fontBody:  "'Lora','Georgia',serif",
  fontMono:  "'DM Mono',monospace",
};

/* Drop-in replacement for theme.colors */
export const colors = {
  ink:       P.ink,
  inkLight:  P.ink,
  inkMuted:  P.inkMuted,
  cream:     P.bg,
  warmWhite: P.card,
  parchment: P.surface,
  border:    P.border,
  amber:     P.amber,
  amberDark: P.amberDark,
  amberPale: P.amberPale,
  amberLight:P.amber,
  rose:      P.rose,
  rosePale:  P.rosePale,
  sky:       '#3B82F6',
  sage:      '#5BAF7A',
};

/* Drop-in replacement for theme.fonts */
export const fonts = {
  display: P.fontHead,
  body:    P.fontBody,
  mono:    P.fontMono,
};

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
  @keyframes dt-spin { to { transform: rotate(360deg); } }
  body { background: #FFF8EE !important; color: #3D2600; }
  input::placeholder, textarea::placeholder { color: rgba(122,96,64,0.3) !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #FFF8EE; }
  ::-webkit-scrollbar-thumb { background: #E8C97A; border-radius: 2px; }
  ::selection { background: rgba(232,201,122,0.4); color: #3D2600; }
`;