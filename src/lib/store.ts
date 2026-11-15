'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  Checkin,
  OnboardingAnswers,
  Pathway,
  Profile,
  ResumeBase,
  ResumeEntry,
  Scale,
  TrendPoint,
  Week,
} from '@/types';
import { personas, type PersonaId } from '@/data/mock';
import { setApiSession } from './api';
import { CHECKIN_POINTS, EVENT_ATTENDED_POINTS, EVENT_GOING_POINTS, streakBonus } from './points';

/** A campus event the student said they'd attend or confirmed attending. */
export interface EventLogEntry {
  title: string;
  org: string;
  startsOn: string | null;
  going: boolean;
  attended: boolean;
  note?: string;
}

export interface XpChange {
  delta: number;
  reason: string;
  at: number;
}

export interface LoggableEvent {
  id: string;
  title: string;
  org: string;
  startsOn: string | null;
}

export const emptyAnswers: OnboardingAnswers = {
  name: '',
  email: '',
  school: null,
  experience: [],
  major: '',
  year: null,
  interests: [],
  notes: '',
  hours: null,
  internshipTarget: null,
  workStyles: [],
  checkinDay: 6,
  dailyNudge: true,
};

export interface CheckinDraft {
  enjoyment: Scale | null;
  workload: Scale | null;
  confidence: Scale | null;
  reflection: string;
  proof_url: string;
}

const emptyDraft: CheckinDraft = { enjoyment: null, workload: null, confidence: null, reflection: '', proof_url: '' };

interface AppState {
  userId: string;
  profile: Profile | null;
  answers: OnboardingAnswers;
  pathway: Pathway | null;
  week: Week | null;
  totalPoints: number;
  streak: number;
  checkins: Checkin[];
  checkinDraft: CheckinDraft;
  trend: TrendPoint[];
  resume: ResumeEntry[];
  resumeBase: ResumeBase;
  /** Ids approved this session, highlighted as "New" in the resume preview. */
  recentlyApproved: string[];
  /** Timestamp of the last AI week adjustment, drives the highlight on /week. */
  adjustedAt: number | null;
  /** Campus events the student RSVP'd to or attended, keyed by event id. */
  eventLog: Record<string, EventLogEntry>;
  /** The most recent XP change and why, shown as a toast in the app shell. */
  lastXp: XpChange | null;

  setAnswers: (patch: Partial<OnboardingAnswers>) => void;
  loadPersona: (id: PersonaId) => void;
  startFresh: () => void;
  applyGenerated: (pathway: Pathway, week: Week) => void;
  setTaskDone: (taskId: string, done: boolean, proofUrl?: string) => void;
  setDraft: (patch: Partial<CheckinDraft>) => void;
  applyCheckin: (checkin: Checkin, next: Week) => void;
  setResume: (entries: ResumeEntry[]) => void;
  approveEntry: (id: string, text: string) => void;
  advanceStage: () => void;
  clearAdjusted: () => void;
  /** Toggle "I'm going". Earns EVENT_GOING_POINTS; undoing takes them back. */
  toggleGoing: (ev: LoggableEvent) => void;
  /** Confirm attendance with a short takeaway. Earns EVENT_ATTENDED_POINTS once. */
  markAttended: (ev: LoggableEvent, note: string) => void;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const MAJOR_SHORT: Record<string, string> = {
  'computer science': 'CS',
  'computer science (b.s.)': 'CS',
  'biological sciences': 'Biology',
  biology: 'Biology',
  'business administration': 'Business',
  'electrical engineering': 'EE',
  'mechanical engineering': 'MechE',
  'data science': 'Data Science',
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'ME';
  return (parts[0][0] + (parts[1]?.[0] ?? parts[0][1] ?? '')).toUpperCase();
}

function profileFromAnswers(a: OnboardingAnswers): Profile {
  const major = a.major.trim();
  return {
    name: a.name.trim() || 'Trojan',
    initials: initialsOf(a.name),
    majorShort: MAJOR_SHORT[major.toLowerCase()] ?? (major.length > 14 ? major.split(/\s+/)[0] : major || 'Undeclared'),
    year: a.year ?? 'Freshman',
    school: a.school ?? 'USC',
    email: a.email,
  };
}

/** "Week 4 of 6" -> "Week 5 of 6", or null when the stage is finished. */
function bumpTiming(timing: string): string | null {
  const m = timing.match(/^Week (\d+) of (\d+)$/);
  if (!m) return timing;
  const n = Number(m[1]) + 1;
  const total = Number(m[2]);
  return n > total ? null : `Week ${n} of ${total}`;
}

function advance(pathway: Pathway): Pathway {
  const stages = pathway.stages.map((s) => ({ ...s }));
  const i = stages.findIndex((s) => s.status === 'current');
  if (i < 0 || i === stages.length - 1) return pathway;
  stages[i].status = 'done';
  stages[i].timing = 'Done · just now';
  stages[i + 1].status = 'current';
  stages[i + 1].timing = 'Week 1 of 4';
  return { ...pathway, stages };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      userId: 'maya',
      profile: null,
      answers: emptyAnswers,
      pathway: null,
      week: null,
      totalPoints: 0,
      streak: 0,
      checkins: [],
      checkinDraft: emptyDraft,
      trend: [],
      resume: [],
      resumeBase: { headline: '', items: [] },
      recentlyApproved: [],
      adjustedAt: null,
      eventLog: {},
      lastXp: null,

      setAnswers: (patch) => set((s) => ({ answers: { ...s.answers, ...patch } })),

      loadPersona: (id) => {
        const p = clone(personas[id]);
        set({
          userId: p.id,
          profile: p.profile,
          answers: p.answers,
          pathway: p.pathway,
          week: p.week,
          totalPoints: p.totalPoints,
          streak: p.streak,
          checkins: [],
          checkinDraft: emptyDraft,
          trend: p.trend,
          resume: p.resume,
          resumeBase: p.resumeBase,
          recentlyApproved: [],
          adjustedAt: null,
          eventLog: {},
        });
      },

      startFresh: () =>
        set({
          userId: 'me',
          profile: null,
          answers: emptyAnswers,
          pathway: null,
          week: null,
          totalPoints: 0,
          streak: 0,
          checkins: [],
          checkinDraft: emptyDraft,
          trend: [],
          resume: [],
          resumeBase: { headline: '', items: [] },
          recentlyApproved: [],
          adjustedAt: null,
          eventLog: {},
        }),

      applyGenerated: (pathway, week) => {
        const a = get().answers;
        const profile = profileFromAnswers(a);
        const resumeBase: ResumeBase = {
          headline: [
            a.major || 'Undeclared',
            a.school && a.school !== 'Other' ? `USC ${a.school}` : 'University of Southern California',
            a.year ?? '',
          ]
            .filter(Boolean)
            .join(' · '),
          items: [{ section: 'Education', title: 'University of Southern California', date: 'Expected graduation', bullets: [a.major ? `Major: ${a.major}` : 'Undeclared'] }],
        };
        set({ userId: 'me', profile, pathway, week, totalPoints: 0, streak: 0, trend: [], checkins: [], resume: [], resumeBase, recentlyApproved: [], adjustedAt: null, checkinDraft: emptyDraft, eventLog: {} });
      },

      setTaskDone: (taskId, done, proofUrl) => {
        const { week, totalPoints } = get();
        if (!week) return;
        const task = week.tasks.find((t) => t.id === taskId);
        if (!task || task.done === done) return;
        set({
          week: {
            ...week,
            tasks: week.tasks.map((t) => (t.id === taskId ? { ...t, done, proof_url: done ? proofUrl ?? t.proof_url : t.proof_url } : t)),
          },
          totalPoints: Math.max(0, totalPoints + (done ? task.points : -task.points)),
          lastXp: { delta: done ? task.points : -task.points, reason: done ? task.title : `Unchecked · ${task.title}`, at: Date.now() },
        });
      },

      setDraft: (patch) => set((s) => ({ checkinDraft: { ...s.checkinDraft, ...patch } })),

      applyCheckin: (checkin, next) => {
        const { week, streak, totalPoints, pathway, trend, checkins, resume } = get();
        const weekPts = week ? week.tasks.filter((t) => t.done).reduce((n, t) => n + t.points, 0) : 0;
        const bonus = streakBonus(weekPts, streak);
        let nextPathway = pathway;
        if (pathway) {
          const i = pathway.stages.findIndex((s) => s.status === 'current');
          if (i >= 0) {
            const bumped = bumpTiming(pathway.stages[i].timing);
            nextPathway = bumped
              ? { ...pathway, stages: pathway.stages.map((s, j) => (j === i ? { ...s, timing: bumped } : s)) }
              : advance(pathway);
          }
        }
        // Finished major tasks become draft resume entries to review.
        const drafts: ResumeEntry[] = (week?.tasks ?? [])
          .filter((t) => t.done && t.tier === 'major' && !resume.some((e) => e.id === `task-${t.id}`))
          .map((t) => ({
            id: `task-${t.id}`,
            section: 'Projects',
            status: 'pending',
            title: t.title,
            source: `Week ${checkin.week} · ${t.title}`,
            text: `${t.title}${t.resource_name ? ` (${t.resource_name})` : ''}${checkin.proof_url ? ', with a public write-up and code' : ''}.`,
          }));
        set({
          resume: [...resume, ...drafts],
          week: next,
          pathway: nextPathway,
          streak: streak + 1,
          totalPoints: totalPoints + CHECKIN_POINTS + bonus,
          lastXp: { delta: CHECKIN_POINTS + bonus, reason: bonus ? 'Weekly check-in + streak bonus' : 'Weekly check-in', at: Date.now() },
          checkins: [...checkins, checkin],
          trend: [
            ...trend,
            { week: checkin.week, enjoyment: checkin.enjoyment, workload: checkin.workload, confidence: checkin.confidence, points: weekPts },
          ].slice(-5),
          checkinDraft: emptyDraft,
          adjustedAt: Date.now(),
        });
      },

      setResume: (entries) => set({ resume: entries }),

      approveEntry: (id, text) =>
        set((s) => ({
          resume: s.resume.map((e) => (e.id === id ? { ...e, text, status: 'approved' } : e)),
          recentlyApproved: [...s.recentlyApproved, id],
        })),

      advanceStage: () => {
        const p = get().pathway;
        if (p) set({ pathway: advance(p) });
      },

      clearAdjusted: () => set({ adjustedAt: null }),

      toggleGoing: (ev) => {
        const { totalPoints } = get();
        const eventLog = get().eventLog ?? {};
        const prev = eventLog[ev.id];
        if (prev?.attended) return; // already credited for attending
        const going = !prev?.going;
        set({
          eventLog: { ...eventLog, [ev.id]: { title: ev.title, org: ev.org, startsOn: ev.startsOn, attended: false, going } },
          totalPoints: Math.max(0, totalPoints + (going ? EVENT_GOING_POINTS : -EVENT_GOING_POINTS)),
          lastXp: {
            delta: going ? EVENT_GOING_POINTS : -EVENT_GOING_POINTS,
            reason: going ? `Going to ${ev.title}` : `No longer going to ${ev.title}`,
            at: Date.now(),
          },
        });
      },

      markAttended: (ev, note) => {
        const { totalPoints, resume } = get();
        const eventLog = get().eventLog ?? {};
        const prev = eventLog[ev.id];
        if (prev?.attended) return;
        const entry: ResumeEntry = {
          id: `event-${ev.id}`,
          section: 'Activities',
          status: 'pending',
          title: ev.title,
          source: `Campus event · ${ev.title}`,
          text: `Attended ${ev.title}${ev.org ? ` (${ev.org})` : ''}. ${note.trim()}`,
        };
        set({
          eventLog: {
            ...eventLog,
            [ev.id]: { title: ev.title, org: ev.org, startsOn: ev.startsOn, going: true, attended: true, note: note.trim() },
          },
          // Students who skipped "I'm going" still get the RSVP points on top.
          totalPoints: totalPoints + EVENT_ATTENDED_POINTS + (prev?.going ? 0 : EVENT_GOING_POINTS),
          lastXp: {
            delta: EVENT_ATTENDED_POINTS + (prev?.going ? 0 : EVENT_GOING_POINTS),
            reason: `Attended ${ev.title}`,
            at: Date.now(),
          },
          resume: resume.some((e) => e.id === entry.id) ? resume : [...resume, entry],
        });
      },
    }),
    {
      name: 'trojan-path-v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) syncApi(state);
      },
    },
  ),
);

function syncApi(s: AppState) {
  setApiSession({
    userId: s.userId,
    theme: s.pathway?.theme ?? 'software',
    name: s.profile?.name ?? 'You',
    initials: s.profile?.initials ?? 'ME',
    streak: s.streak,
    points: s.totalPoints,
    week: s.week,
  });
}

useApp.subscribe(syncApi);

const subscribeHydration = (cb: () => void) => useApp.persist.onFinishHydration(cb);

/** False on the server and during hydration, true once localStorage has loaded. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useApp.persist.hasHydrated(),
    () => false,
  );
}

/** Sum of points for tasks checked off this week. */
export function weekPoints(week: Week | null): number {
  return week ? week.tasks.filter((t) => t.done).reduce((n, t) => n + t.points, 0) : 0;
}
