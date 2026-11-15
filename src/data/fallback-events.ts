import type { CampusEvent } from '@/lib/campus-events';

// Shown only when calendar.usc.edu cannot be reached, so the Resources page
// still has real events during a demo. These two were pulled from the live
// feed on Nov 15, 2026 with `npm run scrape:events`. Refresh them the same way.
export const fallbackEvents: CampusEvent[] = [
  {
    id: 'ietc-reading-group-ai',
    title: 'IETC Reading Group: An Interdisciplinary Reading Group on AI, Philosophy, and Society',
    org: '',
    startsOn: '2026-11-16T12:00:00-08:00',
    endsOn: null,
    location: 'See event page',
    description: 'An interdisciplinary reading group on artificial intelligence, philosophy, and society.',
    categories: ['AI'],
    image: null,
    url: 'https://calendar.usc.edu/event/ietc-reading-group-an-interdisciplinary-reading-group-on-ai-philosophy-and-society',
  },
  {
    id: 'price-presents-data-centers',
    title: 'Price Presents: Data Centers at the Crossroads',
    org: '',
    startsOn: '2026-11-24T12:00:00-08:00',
    endsOn: null,
    location: 'See event page',
    description: 'A talk on data centers, the infrastructure behind artificial intelligence and data.',
    categories: ['AI', 'Data'],
    image: null,
    url: 'https://calendar.usc.edu/event/price-presents-data-centers-at-the-crossroads',
  },
];
