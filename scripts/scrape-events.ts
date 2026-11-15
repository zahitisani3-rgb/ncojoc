// Pull upcoming public events from calendar.usc.edu and print the best matches.
//   npm run scrape:events
//   npm run scrape:events -- --days 45
// Writes scripts/campus-events.json so you can copy real events into
// src/data/fallback-events.ts before the demo.

import { writeFile } from 'node:fs/promises';
import { fetchCampusEvents, interestTerms, matchEvents } from '../src/lib/campus-events';

async function main() {
  const i = process.argv.indexOf('--days');
  const days = i >= 0 ? Number(process.argv[i + 1]) || 30 : 30;

  const events = await fetchCampusEvents({ days });
  await writeFile('scripts/campus-events.json', JSON.stringify(events, null, 2));
  console.log(`Saved ${events.length} upcoming events to scripts/campus-events.json\n`);

  const terms = interestTerms(['software', 'business'], 'Data Science', 'Machine Learning Engineer');
  console.log('Best matches for a Data Science student into AI and fintech:');
  for (const ev of matchEvents(events, terms, 5)) {
    console.log(`  ${ev.title}  ·  ${ev.startsOn}  ·  matched on ${ev.matchedOn.join(', ')}`);
    console.log(`  ${ev.url}`);
  }
}

main().catch((err) => {
  console.error('Scrape failed:', err.message);
  process.exit(1);
});
