import {
  Smile, Lightbulb, Frown, Zap, Leaf, Angry, PartyPopper, Moon,
} from 'lucide-react';

const MOOD_ICON = {
  Happy: Smile,
  Reflective: Lightbulb,
  Sad: Frown,
  Motivated: Zap,
  Peaceful: Leaf,
  Frustrated: Angry,
  Excited: PartyPopper,
  Tired: Moon,
};

/** Mood options used by the post editor and mood pickers. Moods are stored by label. */
export const MOODS = Object.keys(MOOD_ICON).map(label => ({ label }));

/** Line icon for a stored mood label (tolerant of older/variant labels). */
export function moodIconFor(mood) {
  const m = String(mood || '').toLowerCase();
  if (!m) return null;
  if (m.includes('happy')) return Smile;
  if (m.includes('reflect')) return Lightbulb;
  if (m.includes('sad')) return Frown;
  if (m.includes('motiv')) return Zap;
  if (m.includes('peace')) return Leaf;
  if (m.includes('frust')) return Angry;
  if (m.includes('excit')) return PartyPopper;
  if (m.includes('tired')) return Moon;
  return Smile;
}
