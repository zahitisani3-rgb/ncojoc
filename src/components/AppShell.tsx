'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, Minus, Plus } from 'lucide-react';
import { useApp, useHydrated } from '@/lib/store';
import { Avatar, Chip, Logo, PathDoodle, cx } from './ui';

const NAV = [
  { href: '/path', label: 'Pathway' },
  { href: '/week', label: 'This week' },
  { href: '/checkin', label: 'Check-in' },
  { href: '/resume', label: 'Resume' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/resources', label: 'Resources' },
] as const;

const SUMMARY: Record<string, { title: string; body: string }> = {
  '/path': {
    title: 'Your whole path, on one mountain.',
    body: 'Five stages from exploring to your first internship. Each one is built from real USC courses, clubs, and events. Your avatar climbs as you finish tasks.',
  },
  '/week': {
    title: 'Small steps, every week.',
    body: 'Four tasks picked from your current stage. Each one shows its points and why it was chosen. Check them off before Sunday.',
  },
  '/checkin': {
    title: 'Two minutes that shape next week.',
    body: 'Rate the week, write a short reflection, and link proof for your major task. The AI uses your answers to rebuild next week.',
  },
  '/resume': {
    title: 'What you did becomes your resume.',
    body: 'Finished tasks turn into draft entries. Approve or reword each line, then export a PDF or draft a LinkedIn post.',
  },
  '/leaderboard': {
    title: 'Climb alongside other Trojans.',
    body: 'Ranked by streak and check-in rate within your pathway, so showing up every week beats one big sprint.',
  },
  '/resources': {
    title: 'Real events, picked for your path.',
    body: 'Upcoming events pulled from the USC event calendar. The two that best fit your pathway and interests are pinned at the top.',
  },
};

/** Demo "today" is the Thursday of the current week (index 3, Monday = 0). */
const TODAY_INDEX = 3;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function NextCheckinCard({ onCheckin }: { onCheckin: boolean }) {
  const week = useApp((s) => s.week);
  const checkinDay = useApp((s) => s.answers.checkinDay);
  const streak = useApp((s) => s.streak);
  const date = week ? formatDay(week.end) : 'Sunday';
  // On /checkin the demo jumps to check-in day, so that day reads as "today".
  const todayIdx = onCheckin ? checkinDay : TODAY_INDEX;
  const daysLeft = Math.max(0, checkinDay - TODAY_INDEX);
  return (
    <div className="flex w-full flex-col gap-2 rounded-[16px] bg-gold-soft p-4">
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-cardinal" strokeWidth={2.2} />
        <p className="text-[13px] font-semibold text-ink">{onCheckin ? 'Check-in is open' : 'Next check-in'}</p>
      </div>
      <p className="font-display text-[17px] font-bold text-ink">{onCheckin ? 'Closes tonight' : date}</p>
      <div className="flex w-full items-start justify-between">
        {DAYS.map((d, i) => {
          const past = i < todayIdx;
          const today = i === todayIdx;
          const due = i === checkinDay;
          return (
            <span
              key={i}
              className={cx(
                'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                today && 'bg-cardinal text-white',
                past && !today && 'bg-cardinal-soft text-cardinal',
                !past && !today && 'bg-surface text-muted',
                !past && !today && (due ? 'border-2 border-gold' : 'border border-border'),
              )}
            >
              {d}
            </span>
          );
        })}
      </div>
      <p className="text-[12px] text-muted">
        {onCheckin
          ? `Submit to keep your ${streak} week streak`
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to keep your streak`}
      </p>
    </div>
  );
}

/** XP changes that happen after the page loads (not ones restored from storage). */
function useFreshXp() {
  const lastXp = useApp((s) => s.lastXp);
  const [loadedAt] = useState(() => Date.now());
  return lastXp && lastXp.at > loadedAt ? lastXp : null;
}

/** "+10 XP · Going to …" pill that slides up from the bottom of the screen. */
function XpToast() {
  const xp = useFreshXp();
  if (!xp) return null;
  const gain = xp.delta >= 0;
  return (
    <div
      key={xp.at}
      role="status"
      aria-live="polite"
      className={cx(
        'animate-toast pointer-events-none fixed bottom-8 left-1/2 z-50 flex max-w-[560px] items-center gap-3 rounded-full px-5 py-3 text-white shadow-[0_16px_40px_rgba(28,22,22,0.25)]',
        gain ? 'bg-success' : 'bg-cardinal',
      )}
    >
      <span className="flex items-center gap-1 font-display text-[18px] font-bold whitespace-nowrap">
        {gain ? <Plus size={16} strokeWidth={3} /> : <Minus size={16} strokeWidth={3} />}
        {Math.abs(xp.delta)} XP
      </span>
      <span className="truncate text-[14px] text-white/90">{xp.reason}</span>
    </div>
  );
}

function UserCard() {
  const profile = useApp((s) => s.profile);
  const total = useApp((s) => s.totalPoints);
  const xp = useFreshXp();
  const streak = useApp((s) => s.streak);
  if (!profile) return null;
  return (
    <Link
      href="/"
      title="Switch student"
      className="flex w-full flex-col gap-3 rounded-[16px] bg-bg p-4 transition-colors hover:bg-cardinal-soft/50"
    >
      <div className="flex items-center gap-[10px]">
        <Avatar initials={profile.initials} size={40} />
        <div className="flex min-w-0 flex-col gap-[2px]">
          <p className="truncate text-[15px] font-semibold text-ink">{profile.name}</p>
          <p className="truncate text-[13px] text-muted">
            {profile.majorShort} · {profile.year}
          </p>
        </div>
      </div>
      <div className="flex gap-[6px]">
        <span className="relative">
          <Chip tone="cardinal">
            <span key={total} className="animate-pop inline-block">
              {total} pts
            </span>
          </Chip>
          {xp && (
            <span
              key={xp.at}
              className={cx(
                'animate-xp-float pointer-events-none absolute inset-x-0 -top-1 text-center text-[14px] font-bold',
                xp.delta >= 0 ? 'text-success' : 'text-cardinal',
              )}
            >
              {xp.delta >= 0 ? '+' : '−'}
              {Math.abs(xp.delta)}
            </span>
          )}
        </span>
        <Chip tone="gold">{streak} wk streak</Chip>
      </div>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const hasPath = useApp((s) => !!s.pathway);
  const loadPersona = useApp((s) => s.loadPersona);

  // Landing on an app page with nothing loaded: fall back to the Maya demo.
  useEffect(() => {
    if (hydrated && !hasPath) loadPersona('maya');
  }, [hydrated, hasPath, loadPersona]);

  const active = NAV.find((n) => pathname.startsWith(n.href))?.href ?? '/path';
  const summary = SUMMARY[active];
  const ready = hydrated && hasPath;

  return (
    <div className="flex h-screen min-w-[1200px] overflow-hidden bg-bg">
      <aside className="flex h-full w-[264px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-surface px-5 pt-7 pb-6">
        <div className="px-2 pb-6">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const on = n.href === active;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cx(
                  'flex h-11 w-full items-center gap-3 rounded-[10px] px-[14px] text-[15px] transition-colors',
                  on ? 'bg-cardinal-soft font-semibold text-cardinal' : 'font-medium text-muted hover:bg-bg hover:text-ink',
                )}
              >
                <span className={cx('size-2 rounded-full', on ? 'bg-cardinal' : 'bg-border')} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-[1_0_auto] flex-col justify-between gap-4 pt-5 pb-4">
          <div className="flex w-full flex-col gap-[10px] rounded-[16px] bg-cardinal p-[18px]">
            <PathDoodle />
            <p className="font-display text-[19px] leading-[1.18] font-bold text-white">{summary.title}</p>
            <p className="text-[13px] leading-[1.5] text-white/95">{summary.body}</p>
          </div>
          {ready && <NextCheckinCard onCheckin={active === '/checkin'} />}
        </div>
        {ready && <UserCard />}
      </aside>
      <XpToast />
      <main className="flex h-full min-w-0 flex-1 flex-col gap-7 overflow-y-auto px-12 py-10">
        {ready ? (
          children
        ) : (
          <div className="flex flex-1 items-center justify-center text-[15px] text-muted">Loading your path…</div>
        )}
      </main>
    </div>
  );
}
