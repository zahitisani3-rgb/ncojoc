import type { CampusEvent } from '@/lib/engage';

// Shown only when engage.usc.edu cannot be reached. These are placeholders,
// labeled "Sample" in the UI. Before the demo, run `npm run scrape:engage`
// and replace them with two real events it finds.
export const fallbackEvents: CampusEvent[] = [
  {
    id: 'sample-1',
    title: 'Data Science and AI Industry Night',
    org: 'Sample event · replace with a real engageSC event',
    startsOn: '2026-11-19T17:00:00-08:00',
    endsOn: '2026-11-19T18:30:00-08:00',
    location: 'See event page',
    description:
      'Placeholder used when engageSC is unreachable. Hear how data scientists and machine learning engineers got their first internships.',
    categories: ['Career', 'Data Science', 'AI'],
    image: null,
    url: 'https://engage.usc.edu/events',
    sample: true,
  },
  {
    id: 'sample-2',
    title: 'Fintech and Python Workshop',
    org: 'Sample event · replace with a real engageSC event',
    startsOn: '2026-11-21T14:00:00-08:00',
    endsOn: '2026-11-21T16:00:00-08:00',
    location: 'See event page',
    description: 'Placeholder used when engageSC is unreachable. Build a small investing dashboard in Python.',
    categories: ['Workshop', 'Fintech', 'Python'],
    image: null,
    url: 'https://engage.usc.edu/events',
    sample: true,
  },
];
