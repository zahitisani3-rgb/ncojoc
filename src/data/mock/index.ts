import type {
  Checkin,
  LeaderboardRow,
  OnboardingAnswers,
  Pathway,
  ResumeEntry,
  Task,
  Theme,
  Week,
} from '@/types';
import { TIER_POINTS } from '@/lib/points';
import { maya } from './maya';
import { daniel } from './daniel';
import type { Persona, PersonaId } from './persona';
import { firstWeekStages, interestLabel, templates, themeForInterests } from './templates';

export type { Persona, PersonaId };
export const personas: Record<PersonaId, Persona> = { maya, daniel };

export function isPersonaId(id: string): id is PersonaId {
  return id === 'maya' || id === 'daniel';
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const hoursLabel: Record<string, string> = {
  '1-2': '1 to 2 hours',
  '3-4': '3 to 4 hours',
  '5-7': '5 to 7 hours',
  '8+': '8+ hours',
};

/** Mock of the generate_pathway edge function. */
export function mockGeneratePathway(answers: OnboardingAnswers): { pathway: Pathway; week: Week } {
  const theme = themeForInterests(answers.interests);
  const t = templates[theme];
  const target = answers.internshipTarget && answers.internshipTarget !== 'Not this year'
    ? `an internship by ${answers.internshipTarget}`
    : 'steady progress this year';
  const hours = answers.hours ? hoursLabel[answers.hours] : 'a few hours';
  const pathway: Pathway = {
    ...clone(t.base),
    id: `pw-${theme}-${Date.now()}`,
    title: t.title,
    theme,
    stages: firstWeekStages(t),
    why: `You are drawn to ${interestLabel(answers)}, have ${hours} a week, and want ${target}. ${t.whyTail}`,
    created_at: new Date().toISOString(),
  };
  const start = '2026-11-16';
  const week: Week = {
    number: 1,
    start,
    end: addDays(start, 6),
    pointsGoal: 100,
    adjustmentNote: `Your first week is light on purpose. You have ${hours}, so it is four tasks you can finish before Sunday, starting with the ones that take the longest to set up.`,
    tasks: t.firstWeek.map((s, i) => ({ ...s, id: `w1-${i + 1}`, points: TIER_POINTS[s.tier], done: false })),
  };
  return { pathway, week };
}

/** Builds a readable "why we changed this" note from the check-in answers. */
export function noteFromCheckin(c: Checkin): string {
  const parts: string[] = [];
  if (c.enjoyment >= 4) parts.push('You enjoyed last week, so we kept the same kind of work');
  else if (c.enjoyment <= 2) parts.push('Last week felt like a slog, so we swapped in more hands on tasks');
  else parts.push('Last week was fine but not exciting, so we mixed in something new');
  if (c.workload >= 4) parts.push('and dropped a task because the workload ran heavy');
  else if (c.workload <= 2) parts.push('and added a stretch task since you had room');
  let note = `${parts.join(' ')}.`;
  if (c.confidence <= 2) note += ' Confidence was low, so there is a quick win up front.';
  const r = c.reflection.trim();
  if (r) note += ` You wrote “${r.length > 70 ? `${r.slice(0, 70).trim()}…` : r}”, and that shaped what came next.`;
  return note;
}

/** Mock of the adjust_week edge function. */
export function mockNextWeek(userId: string, theme: Theme, checkin: Checkin, current: Week | null): Week {
  if (isPersonaId(userId)) {
    const p = personas[userId];
    if (checkin.week === p.week.number) return clone(p.nextWeek);
  }
  const t = templates[theme];
  const count = checkin.workload >= 4 ? 3 : checkin.workload <= 2 ? 5 : 4;
  const offset = (checkin.week * 3) % t.pool.length;
  const picks: Task[] = [];
  for (let i = 0; picks.length < count && i < t.pool.length; i++) {
    const s = t.pool[(offset + i) % t.pool.length];
    picks.push({ ...s, id: `w${checkin.week + 1}-${i + 1}`, points: TIER_POINTS[s.tier], done: false });
  }
  // Low confidence: put a quick win first.
  if (checkin.confidence <= 2) picks.sort((a, b) => TIER_POINTS[a.tier] - TIER_POINTS[b.tier]);
  const start = current ? addDays(current.end, 1) : '2026-11-23';
  return {
    number: checkin.week + 1,
    start,
    end: addDays(start, 6),
    pointsGoal: current?.pointsGoal ?? 120,
    adjustmentNote: noteFromCheckin(checkin),
    tasks: picks,
  };
}

function shortName(n: string) {
  const [f, l] = n.trim().split(/\s+/);
  return l ? `${f} ${l[0]}.` : f;
}

export function mockLeaderboard(userId: string, you: { name: string; initials: string; streak: number; points: number }): LeaderboardRow[] {
  const base = clone(isPersonaId(userId) ? personas[userId].leaderboard : maya.leaderboard);
  const others = base.filter((r) => !r.isYou);
  const rows: LeaderboardRow[] = [
    ...others,
    { rank: 0, name: shortName(you.name), initials: you.initials, streak: you.streak, checkinRate: 1, points: you.points, isYou: true },
  ];
  rows.sort((a, b) => b.streak - a.streak || b.checkinRate - a.checkinRate || b.points - a.points);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function mockResume(userId: string): ResumeEntry[] {
  return clone(isPersonaId(userId) ? personas[userId].resume : []);
}

export function mockLinkedInPost(entries: ResumeEntry[]): string {
  const lines = entries.filter((e) => e.section !== 'Skills').slice(0, 3);
  const skills = entries.find((e) => e.section === 'Skills');
  const bullets = lines.map((e) => `• ${e.text}`).join('\n');
  return [
    `A few weeks into building toward my career goals at USC, and I wanted to share some progress. ✌️`,
    '',
    bullets || '• Started a weekly plan built around real USC courses, clubs, and events.',
    '',
    skills ? `Along the way I have been picking up ${skills.text.replace(/,([^,]*)$/, ', and$1')}.` : '',
    'Huge thanks to the student orgs and advisors who made time for me. On to the next stage. #FightOn #USC',
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n');
}
