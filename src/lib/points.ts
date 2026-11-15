import type { Tier } from '@/types';

export const TIER_POINTS: Record<Tier, number> = { quick: 10, standard: 25, major: 60 };
export const CHECKIN_POINTS = 15;
/** Saying you'll go to a campus event, then confirming you went. */
export const EVENT_GOING_POINTS = 10;
export const EVENT_ATTENDED_POINTS = 25;

/** +10% per consecutive weekly check-in, capped at +40%. */
export function streakBonusPct(streak: number): number {
  return Math.min(streak * 10, 40);
}

export function streakBonus(points: number, streak: number): number {
  return Math.round((points * streakBonusPct(streak)) / 100);
}

const LEVELS = [
  { min: 0, name: 'Explorer' },
  { min: 250, name: 'Builder' },
  { min: 500, name: 'Maker' },
  { min: 800, name: 'Pro' },
  { min: 1200, name: 'Trailblazer' },
];

export function levelFor(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const nextAt = next ? next.min : cur.min + 500;
  const pct = Math.min(1, (xp - cur.min) / (nextAt - cur.min));
  return { level: i + 1, name: cur.name, nextAt, pct, max: !next };
}
