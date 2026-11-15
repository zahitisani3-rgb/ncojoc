// GET /api/events?terms=data%20science,python,fintech&count=2
//
// Server side, so the browser never hits engage.usc.edu directly (no CORS
// problems) and Engage sees at most one request per cache window.

import type { NextRequest } from 'next/server';
import { fetchEngageEvents, matchEvents, type CampusEvent, type EventsResponse } from '@/lib/engage';
import { fallbackEvents } from '@/data/fallback-events';

const DEFAULT_TERMS = ['career', 'internship', 'data', 'ai', 'python'];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const terms = params.get('terms')?.split(',').filter(Boolean) ?? DEFAULT_TERMS;
  const count = Math.min(Number(params.get('count')) || 2, 5);

  let events: CampusEvent[];
  let source: EventsResponse['source'] = 'engage';
  try {
    events = await fetchEngageEvents();
    if (events.length === 0) throw new Error('No events returned');
  } catch (err) {
    console.warn('engageSC fetch failed, serving fallback:', (err as Error).message);
    events = fallbackEvents;
    source = 'fallback';
  }

  const body: EventsResponse = {
    events,
    matched: matchEvents(events, terms, count),
    source,
    fetchedAt: new Date().toISOString(),
  };
  return Response.json(body, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' },
  });
}
