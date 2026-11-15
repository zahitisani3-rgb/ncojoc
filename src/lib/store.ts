'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  Checkin,
  OnboardingAnswers,
  Pathway,
  Profile,
  ResumeEntry,
  Scale,
  TrendPoint,
  Week,
} from '@/types';
import { personas, type PersonaId } from '@/data/mock';
import { setApiSession } from './api';
import { CHECKIN_POINTS, streakBonus } from './points';

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
  /** Ids approved this session, highlighted as "New" in the resume preview. */
  recentlyApproved: string[];
  /** Timestamp of the last AI week adjustment, drives the highlight on /week. */
  adjustedAt: number | null;

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
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const MAJOR_SHORT: Record<string, string> = {
  'computer science': 'CS',
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
      recentlyApproved: [],
      adjustedAt: null,

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
          recentlyApproved: [],
          adjustedAt: null,
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
          recentlyApproved: [],
          adjustedAt: null,
        }),

      applyGenerated: (pathway, week) => {
        const a = get().answers;
        const profile = profileFromAnswers(a);
        const resume: ResumeEntry[] = [
          {
            id: `me-edu-${Date.now()}`,
            section: 'Education',
            status: 'approved',
            source: 'Intake',
            text: `University of Southern California${a.school && a.school !== 'Other' ? `, ${a.school}` : ''} · ${a.major || 'Undeclared'}${a.year ? ` · ${a.year}` : ''}`,
          },
        ];
        set({ userId: 'me', profile, pathway, week, totalPoints: 0, streak: 0, trend: [], checkins: [], resume, recentlyApproved: [], adjustedAt: null, checkinDraft: emptyDraft });
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
        });
      },

      setDraft: (patch) => set((s) => ({ checkinDraft: { ...s.checkinDraft, ...patch } })),

      applyCheckin: (checkin, next) => {
        const { week, streak, totalPoints, pathway, trend, checkins } = get();
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
        set({
          week: next,
          pathway: nextPathway,
          streak: streak + 1,
          totalPoints: totalPoints + CHECKIN_POINTS + bonus,
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
    }),
    {
      name: 'trojan-path-v1',
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
