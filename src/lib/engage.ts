// engageSC (engage.usc.edu) events: fetching, cleanup, and matching.
//
// Engage serves its public events page from a JSON search endpoint. We only
// request public, approved, upcoming events. No login and no private data.
// It is not an official documented API, so callers must handle failure.

import type { Interest } from '@/types';

export const ENGAGE_BASE = 'https://engage.usc.edu';

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
  source: 'engage' | 'fallback';
  fetchedAt: string;
}

interface EngageRow {
  id: number | string;
  name?: string;
  organizationName?: string;
  startsOn?: string;
  endsOn?: string;
  location?: string;
  description?: string;
  categoryNames?: string[];
  imagePath?: string;
}

export async function fetchEngageEvents({ query = '', take = 60, now = new Date() } = {}): Promise<CampusEvent[]> {
  const params = new URLSearchParams({
    endsAfter: now.toISOString(),
    orderByField: 'endsOn',
    orderByDirection: 'ascending',
    status: 'Approved',
    take: String(take),
  });
  if (query) params.set('query', query);

  const res = await fetch(`${ENGAGE_BASE}/api/discovery/event/search?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'TrojanPath student project (AI@USC hackathon)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Engage responded ${res.status}`);

  const body = (await res.json()) as { value?: EngageRow[] };
  return (body.value ?? []).map(normalizeEvent);
}

export function normalizeEvent(e: EngageRow): CampusEvent {
  return {
    id: String(e.id),
    title: e.name ?? 'Untitled event',
    org: e.organizationName ?? '',
    startsOn: e.startsOn ?? null,
    endsOn: e.endsOn ?? null,
    location: e.location || 'See event page',
    description: stripHtml(e.description ?? '').slice(0, 280),
    categories: e.categoryNames ?? [],
    image: e.imagePath ? `https://se-images.campuslabs.com/clink/images/${e.imagePath}?preset=med-sq` : null,
    url: `${ENGAGE_BASE}/event/${e.id}`,
  };
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
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
      if (/career center/i.test(ev.org)) score += 1;
      return { ...ev, score, matchedOn: [...new Set(hits)].slice(0, 3) };
    })
    .filter((ev) => ev.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(a.startsOn ?? '') - Date.parse(b.startsOn ?? ''))
    .slice(0, count);
}
