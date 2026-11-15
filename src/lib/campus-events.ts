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
  // Same event can appear once per instance; keep the first.
  const seen = new Set<string>();
  return all.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
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
const STOP = new Set(['and', 'the', 'for', 'with', 'path', 'engineer', 'of', 'in']);

/** Turns a student's onboarding answers into search terms. */
export function interestTerms(interests: Interest[], major = '', pathwayTitle = ''): string[] {
  const words = `${major} ${pathwayTitle}`
    .toLowerCase()
    .split(/[^a-z-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  return [...new Set([...interests.flatMap((i) => INTEREST_KEYWORDS[i] ?? []), ...words, ...ALWAYS])];
}

export function matchEvents(events: CampusEvent[], terms: string[], count = 2): MatchedEvent[] {
  const clean = terms.map((t) => t.toLowerCase().trim()).filter(Boolean);
  return events
    .map((ev) => {
      const title = ev.title.toLowerCase();
      const rest = `${ev.description} ${ev.org} ${ev.categories.join(' ')}`.toLowerCase();
      const hits: string[] = [];
      let score = 0;
      for (const term of clean) {
        const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (re.test(title)) {
          score += ALWAYS.includes(term) ? 1 : 3;
          hits.push(term);
        } else if (re.test(rest)) {
          score += 1;
          hits.push(term);
        }
      }
      if (/career/i.test(ev.org)) score += 1;
      return { ...ev, score, matchedOn: [...new Set(hits)].slice(0, 3) };
    })
    .filter((ev) => ev.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(a.startsOn ?? '') - Date.parse(b.startsOn ?? ''))
    .slice(0, count);
}
