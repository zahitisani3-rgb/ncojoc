// USC campus events from calendar.usc.edu: fetching, cleanup, and matching.
//
// calendar.usc.edu publishes a public JSON feed (Localist API v2) that needs
// no login. engageSC was tried first, but its event feed is not public at USC.

import type { Interest } from '@/types';

export const CALENDAR_BASE = 'https://calendar.usc.edu';

export interface CampusEvent {
  id: string;
  title: string;
  org: string;
  startsOn: string | null;
  endsOn: string | null;
  location: string;
  description: string;
  categories: string[];
  image: string | null;
  url: string;
  sample?: boolean;
}

export interface MatchedEvent extends CampusEvent {
  score: number;
  matchedOn: string[];
}

export interface EventsResponse {
  events: CampusEvent[];
  matched: MatchedEvent[];
  source: 'live' | 'fallback';
  fetchedAt: string;
}

interface Named {
  name?: string;
}

interface LocalistEvent {
  id: number | string;
  title?: string;
  url?: string;
  localist_url?: string;
  description_text?: string;
  location_name?: string;
  room_number?: string;
  photo_url?: string;
  tags?: string[];
  keywords?: string[];
  departments?: Named[];
  filters?: Record<string, Named[] | undefined>;
  event_instances?: { event_instance?: { start?: string; end?: string | null } }[];
}

/** Pulls upcoming events, a few pages deep, from calendar.usc.edu. */
export async function fetchCampusEvents({ days = 30, pages = 3, now = new Date() } = {}): Promise<CampusEvent[]> {
  const all: CampusEvent[] = [];
  for (let page = 1; page <= pages; page++) {
    const params = new URLSearchParams({ days: String(days), pp: '100', page: String(page) });
    const res = await fetch(`${CALENDAR_BASE}/api/2/events?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'TrojanPath student project (AI@USC hackathon)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`calendar.usc.edu responded ${res.status}`);
    const body = (await res.json()) as { events?: { event: LocalistEvent }[]; page?: { total?: number } };
    const rows = body.events ?? [];
    all.push(...rows.map((r) => normalizeEvent(r.event, now)));
    if (rows.length < 100 || (body.page?.total && page >= body.page.total)) break;
  }
  // The calendar can list one event under several ids (one per department or
  // instance). Keep the first copy of each title and start time.
  const seen = new Set<string>();
  return all.filter((e) => {
    const key = `${e.title.toLowerCase().trim()}|${e.startsOn ?? ''}`;
    if (seen.has(e.id) || seen.has(key)) return false;
    seen.add(e.id);
    seen.add(key);
    return true;
  });
}

export function normalizeEvent(e: LocalistEvent, now = new Date()): CampusEvent {
  const instances = (e.event_instances ?? []).map((i) => i.event_instance).filter(Boolean);
  const next =
    instances.find((i) => i?.start && Date.parse(i.end ?? i.start) >= now.getTime()) ?? instances[0] ?? undefined;
  const types = Object.values(e.filters ?? {})
    .flat()
    .map((f) => f?.name)
    .filter((n): n is string => !!n);
  const departments = (e.departments ?? []).map((d) => d.name).filter((n): n is string => !!n);

  return {
    id: String(e.id),
    title: e.title ?? 'Untitled event',
    org: departments[0] ?? '',
    startsOn: next?.start ?? null,
    endsOn: next?.end ?? null,
    location: [e.location_name, e.room_number].filter(Boolean).join(' · ') || 'See event page',
    description: (e.description_text ?? '').replace(/\s+/g, ' ').trim().slice(0, 280),
    categories: [...new Set([...types, ...(e.tags ?? []), ...(e.keywords ?? [])])].slice(0, 8),
    image: e.photo_url ?? null,
    url: e.localist_url ?? e.url ?? `${CALENDAR_BASE}/event/${e.id}`,
  };
}

// ---------------------------------------------------------------- Matching

const INTEREST_KEYWORDS: Record<Interest, string[]> = {
  software: ['software', 'coding', 'programming', 'computer science', 'ai', 'artificial intelligence', 'machine learning', 'data', 'data science', 'python', 'hackathon'],
  business: ['business', 'finance', 'fintech', 'investing', 'investment', 'economics', 'entrepreneurship', 'startup', 'consulting'],
  research: ['research', 'lab', 'undergraduate research', 'symposium', 'poster'],
  health: ['health', 'pre-med', 'premed', 'pre-dental', 'predental', 'medicine', 'medical', 'dental', 'shadowing', 'volunteer'],
  music: ['music', 'concert', 'performance', 'arts', 'film', 'recording'],
  unsure: ['career', 'exploration', 'networking', 'major'],
};
const ALWAYS = ['career', 'internship', 'recruiting'];
// Generic words from a major or pathway title that would match unrelated
// events ("learning" from "Machine Learning" matching a healthcare panel).
const STOP = new Set([
  'and', 'the', 'for', 'with', 'path', 'of', 'in', 'engineer', 'engineering', 'learning', 'science', 'sciences',
  'studies', 'management', 'systems', 'design', 'technology', 'arts', 'student', 'analyst', 'specialist',
]);

/** Turns a student's onboarding answers into search terms. */
export function interestTerms(interests: Interest[], major = '', pathwayTitle = ''): string[] {
  const words = `${major} ${pathwayTitle}`
    .toLowerCase()
    .split(/[^a-z-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  const phrases = [major, pathwayTitle].map((p) => p.toLowerCase().trim()).filter((p) => p.length > 2);
  return [...new Set([...interests.flatMap((i) => INTEREST_KEYWORDS[i] ?? []), ...phrases, ...words, ...ALWAYS])];
}

export function matchEvents(events: CampusEvent[], terms: string[], count = 2): MatchedEvent[] {
  const clean = terms.map((t) => t.toLowerCase().trim()).filter(Boolean);
  return events
    .map((ev) => {
      const title = ev.title.toLowerCase();
      const rest = `${ev.description} ${ev.org} ${ev.categories.join(' ')}`.toLowerCase();
      const hits: string[] = [];
      let topical = 0; // hits on the student's own interests
      let bonus = 0; // generic career words only break ties
      for (const term of clean) {
        const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const inTitle = re.test(title);
        if (!inTitle && !re.test(rest)) continue;
        if (ALWAYS.includes(term)) bonus += 1;
        else {
          topical += inTitle ? 3 : 1;
          hits.unshift(term);
        }
      }
      if (/career/i.test(ev.org)) bonus += 1;
      // A career event about an unrelated field should not match on "career" alone.
      const score = topical > 0 ? topical + bonus : 0;
      return { ...ev, score, matchedOn: [...new Set(hits)].slice(0, 3) };
    })
    .filter((ev) => ev.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(a.startsOn ?? '') - Date.parse(b.startsOn ?? ''))
    .slice(0, count);
}
