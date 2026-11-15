/**
 * The single API layer for Trojan Path.
 *
 * Every screen talks to the backend through this file only. While
 * NEXT_PUBLIC_USE_MOCK !== 'false' (the default) it serves the mock data in
 * src/data/mock with a short fake delay. Set NEXT_PUBLIC_USE_MOCK=false to hit
 * Supabase instead.
 *
 * Security: never put an AI provider key in a NEXT_PUBLIC_ variable. AI calls
 * go through Supabase Edge Functions (generate_pathway, adjust_week,
 * draft_linkedin). If one ever has to run from this repo, add a Route Handler
 * under src/app/api/ that reads a server-only env var.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Checkin,
  LeaderboardRow,
  OnboardingAnswers,
  Pathway,
  ResumeEntry,
  Theme,
  Week,
} from '@/types';
import {
  mockGeneratePathway,
  mockLeaderboard,
  mockLinkedInPost,
  mockNextWeek,
  mockResume,
  isPersonaId,
  personas,
} from '@/data/mock';

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

// ---------------------------------------------------------------------------
// Session context. The store sets this whenever a student is loaded so the
// mock (and Supabase queries) know who "you" are.
// ---------------------------------------------------------------------------
interface ApiSession {
  userId: string;
  theme: Theme;
  name: string;
  initials: string;
  streak: number;
  points: number;
  week: Week | null;
}

let session: ApiSession = {
  userId: 'maya',
  theme: 'software',
  name: 'Maya Chen',
  initials: 'MC',
  streak: 3,
  points: 340,
  week: null,
};

export function setApiSession(next: Partial<ApiSession>) {
  session = { ...session, ...next };
}

const delay = (min = 400, max = 900) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

// ---------------------------------------------------------------------------
// Supabase client (only created when mocks are off).
// ---------------------------------------------------------------------------
let client: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or use NEXT_PUBLIC_USE_MOCK=true.');
  }
  client = createClient(url, anon);
  return client;
}

async function invoke<T>(fn: 'generate_pathway' | 'adjust_week' | 'draft_linkedin', body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().functions.invoke<T>(fn, { body });
  if (error) throw error;
  if (data == null) throw new Error(`${fn} returned no data`);
  return data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generatePathway(answers: OnboardingAnswers): Promise<{ pathway: Pathway; week: Week }> {
  if (USE_MOCK) {
    await delay(1600, 1900); // long enough for the three checklist pills to tick
    return mockGeneratePathway(answers);
  }
  // Edge function must return { pathway: Pathway, week: Week } (see src/types.ts).
  return invoke('generate_pathway', { answers, user_id: session.userId });
}

export async function getCurrentWeek(userId: string): Promise<Week> {
  if (USE_MOCK) {
    await delay();
    if (session.week) return session.week;
    return isPersonaId(userId) ? personas[userId].week : personas.maya.week;
  }
  // TODO(backend): confirm table + column names. Assumes a `weeks` table with
  // user_id, number, start, end, points_goal, adjustment_note and a `tasks`
  // table keyed by week_id.
  const { data, error } = await supabase()
    .from('weeks')
    .select('number, start, end, pointsGoal:points_goal, adjustmentNote:adjustment_note, tasks(*)')
    .eq('user_id', userId)
    .order('number', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data as unknown as Week;
}

export async function completeTask(taskId: string, proofUrl?: string): Promise<void> {
  if (USE_MOCK) {
    await delay(150, 300);
    return;
  }
  // TODO(backend): confirm the `tasks` table name and the `done` / `proof_url` columns.
  const { error } = await supabase()
    .from('tasks')
    .update({ done: true, proof_url: proofUrl ?? null, completed_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}

/** Saves the check-in and returns next week, rebuilt by adjust_week. */
export async function submitCheckin(checkin: Checkin): Promise<Week> {
  if (USE_MOCK) {
    await delay(900, 1200);
    return mockNextWeek(session.userId, session.theme, checkin, session.week);
  }
  // TODO(backend): confirm the `checkins` table name and columns.
  const { error } = await supabase().from('checkins').insert({ ...checkin, user_id: session.userId });
  if (error) throw error;
  return invoke<Week>('adjust_week', { checkin, user_id: session.userId });
}

export async function getResumeEntries(userId: string): Promise<ResumeEntry[]> {
  if (USE_MOCK) {
    await delay();
    return mockResume(userId);
  }
  // TODO(backend): confirm the `resume_entries` table name and columns.
  const { data, error } = await supabase().from('resume_entries').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as ResumeEntry[];
}

export async function approveResumeEntry(id: string, text: string): Promise<void> {
  if (USE_MOCK) {
    await delay(150, 300);
    return;
  }
  // TODO(backend): confirm the `resume_entries` table name and columns.
  const { error } = await supabase().from('resume_entries').update({ text, status: 'approved' }).eq('id', id);
  if (error) throw error;
}

export async function draftLinkedInPost(entries: ResumeEntry[]): Promise<string> {
  if (USE_MOCK) {
    await delay(700, 1000);
    return mockLinkedInPost(entries);
  }
  const res = await invoke<{ post: string } | string>('draft_linkedin', { entries, user_id: session.userId });
  return typeof res === 'string' ? res : res.post;
}

export async function getLeaderboard(pathwayTitle: string): Promise<LeaderboardRow[]> {
  if (USE_MOCK) {
    await delay();
    return mockLeaderboard(session.userId, session);
  }
  // TODO(backend): assumes a `leaderboard` view filtered by pathway title,
  // already ranked by streak then check-in rate.
  const { data, error } = await supabase()
    .from('leaderboard')
    .select('rank, name, initials, streak, checkinRate:checkin_rate, points, user_id')
    .eq('pathway_title', pathwayTitle)
    .order('rank')
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, isYou: r.user_id === session.userId })) as LeaderboardRow[];
}

export const api = {
  generatePathway,
  getCurrentWeek,
  completeTask,
  submitCheckin,
  getResumeEntries,
  approveResumeEntry,
  draftLinkedInPost,
  getLeaderboard,
};
