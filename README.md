# Trojan Path

A gamified career planner for USC students. Built for the AI@USC hackathon.

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Zustand · lucide-react. The backend is Supabase, reached only through `src/lib/api.ts`.

## Run it

```bash
npm install
cp .env.example .env.local   # optional, mocks work with no env at all
npm run dev
```

Open http://localhost:3000.

- **Demo students:** on the welcome page, click **Maya Chen** (CS, software theme) or **Daniel Park** (Biology, health theme) to load a full persona and jump to `/path`.
- **Real flow:** enter any email and go through the four onboarding steps. Picking **Music and Arts** gives the purple music theme.
- **Demo moment:** on `/path` the avatar climbs to the current stage on load. **Demo: finish stage** (bottom right of the climb card) advances a stage with the animation.
- **Adaptation loop:** check off tasks on `/week`, submit `/checkin`, and you land on the rebuilt next week with a highlighted "Adjusted for you" note.
- All state persists in `localStorage` (`trojan-path-v2`), so a demo survives a refresh. Click the user card in the sidebar to get back to the welcome page and switch students.

## Mock vs Supabase

Every screen calls the functions in `src/lib/api.ts` and nothing else.

| `NEXT_PUBLIC_USE_MOCK` | Behavior |
| --- | --- |
| unset or anything but `false` | Mock data from `src/data/mock/` with a 400 to 900 ms fake delay |
| `false` | Supabase: tables through `supabase.from(...)`, AI through `supabase.functions.invoke(...)` |

To switch to the real backend, set these in `.env.local` (or in Vercel):

```dotenv
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

The Supabase branch is written but marked with `TODO(backend)` wherever table or column names are assumed (`weeks`, `tasks`, `checkins`, `resume_entries`, `leaderboard`). Search for `TODO(backend)` and match them to the real schema.

**Never put an AI API key in a `NEXT_PUBLIC_` variable or in client code.** AI runs in the Supabase Edge Functions `generate_pathway`, `adjust_week` and `draft_linkedin`. If an AI call ever has to run from this repo, add a Route Handler under `src/app/api/` that reads a server-only env var.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel. The framework preset is detected as Next.js, and no extra config is needed.
2. Optionally add the env vars above. With none set, the deployed site runs fully on mocks.
3. Deploy. The Vercel URL is the prototype link for the submission.

`npm run build` must pass before you push. It currently builds cleanly, with every route prerendered static.

## Project map

```
src/
  app/
    (onboarding)/          welcome (/) and /onboarding/{about,goals,time,path}, brand panel layout
    (app)/                 /path /week /checkin /resume /leaderboard, sidebar layout
  components/              AppShell, OnboardingShell, ClimbCard, TaskCard, Leaderboard, ui (Button, Chip, Card, Modal, ...)
  data/mock/               maya.ts, daniel.ts, templates.ts (software, health, music), mock AI helpers
  lib/
    api.ts                 the only file that talks to a backend
    store.ts               Zustand store, persisted, with useHydrated()
    points.ts              points, streak bonus, levels
  types.ts                 the data contract below
```

## Data contract (for the backend)

These live in `src/types.ts`. `generate_pathway` and `adjust_week` must return these shapes.

```ts
type Tier = 'quick' | 'standard' | 'major';         // 10, 25, 60 points
type ResourceType = 'course' | 'club' | 'event' | 'service' | 'program';

interface Resource { id: number; name: string; type: ResourceType; link?: string; description?: string; }

interface Task {
  id: string;
  title: string;
  tier: Tier;
  points: number;
  resource_id: number | null;
  resource_name: string;
  why: string;              // one line, shown on the card
  done: boolean;
  proof_url?: string;
}

interface Stage {
  name: string;             // Explore, Build Skills, Projects, Experience, Launch
  timing: string;           // "Week 4 of 6", "Spring 2027"
  description: string;
  status: 'done' | 'current' | 'next';
}

interface Pathway {
  id: string;
  title: string;            // "Machine Learning Engineer"
  theme: 'software' | 'health' | 'music';
  why: string;
  resources: Resource[];    // cited on the Pathway screen
  stages: Stage[];          // the climb shows exactly 5
  created_at: string;
}

interface Week {
  number: number;
  start: string; end: string;   // ISO dates, "2026-11-16"
  tasks: Task[];
  adjustmentNote: string;   // the "Adjusted for you" text
  pointsGoal: number;
}

interface Checkin {
  week: number;
  enjoyment: 1|2|3|4|5;
  workload: 1|2|3|4|5;
  confidence: 1|2|3|4|5;
  reflection: string;
  proof_url?: string;
}

interface ResumeEntry {
  id: string;
  section: 'Education' | 'Projects' | 'Activities' | 'Skills';
  text: string;
  source: string;           // "Week 4 · Train your first classifier"
  status: 'pending' | 'approved';
  title?: string;           // optional, frontend addition: heading in the resume preview
}

interface LeaderboardRow {
  rank: number; name: string; initials: string;
  streak: number; checkinRate: number; points: number; isYou?: boolean;
}
```

API surface (`src/lib/api.ts`):

```ts
generatePathway(answers: OnboardingAnswers): Promise<{ pathway: Pathway; week: Week }>
getCurrentWeek(userId: string): Promise<Week>
completeTask(taskId: string, proofUrl?: string): Promise<void>
submitCheckin(checkin: Checkin): Promise<Week>          // returns next week
getResumeEntries(userId: string): Promise<ResumeEntry[]>
approveResumeEntry(id: string, text: string): Promise<void>
draftLinkedInPost(entries: ResumeEntry[]): Promise<string>
getLeaderboard(pathwayTitle: string): Promise<LeaderboardRow[]>
```

**Points:** quick 10, standard 25, major 60. A check-in gives 15. The streak bonus is +10% per consecutive weekly check-in, capped at +40%, and is applied to the week's task points when you check in.

**Levels** (frontend only, `src/lib/points.ts`): Explorer 0, Builder 250, Maker 500, Pro 800, Trailblazer 1200 XP.

## Notes for the team

- USC resource names in `src/data/mock/` are plausible placeholders marked `TODO(resources)`. Verify the names and add real links.
- Business, Research and Not sure yet currently fall back to the software template in mock mode.
- The demo's "today" is fixed to Thursday of the current week for the sidebar check-in card.
