import { moodIconFor } from '@/core/utils/moods';

/**
 * Inline line icon that sits nicely next to text.
 * Usage: <Ico as={House} /> or <Ico as={Bell} size={18} />
 */
export function Ico({ as: Component, size = 16, strokeWidth = 1.75, style, ...rest }) {
  if (!Component) return null;
  return (
    <Component
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: '-0.18em', flexShrink: 0, ...style }}
      {...rest}
    />
  );
}

/** Icon for a post's mood label, e.g. <MoodIcon mood="Happy" />. */
export function MoodIcon({ mood, size = 14, style }) {
  const C = moodIconFor(mood);
  return C ? <Ico as={C} size={size} style={style} /> : null;
}
