// Pull upcoming public events from engage.usc.edu and print the best matches.
//   npm run scrape:engage
//   npm run scrape:engage -- --query "data science"
// Writes scripts/engage-events.json so you can copy real events into
// src/data/fallback-events.ts before the demo.

import { writeFile } from 'node:fs/promises';
import { fetchEngageEvents, interestTerms, matchEvents } from '../src/lib/engage';

async function main() {
  const i = process.argv.indexOf('--query');
  const query = i >= 0 ? (process.argv[i + 1] ?? '') : '';

  const events = await fetchEngageEvents({ query });
  await writeFile('scripts/engage-events.json', JSON.stringify(events, null, 2));
  console.log(`Saved ${events.length} upcoming events to scripts/engage-events.json\n`);

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
