'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import type { LeaderboardRow } from '@/types';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { streakBonusPct } from '@/lib/points';
import { LeaderRow } from '@/components/Leaderboard';
import { Button, Chip, PageHeader } from '@/components/ui';

export default function LeaderboardPage() {
  const pathway = useApp((s) => s.pathway)!;
  const streak = useApp((s) => s.streak);
  const xp = useApp((s) => s.totalPoints);
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    let live = true;
    api.getLeaderboard(pathway.title).then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, [pathway.title, streak, xp]);

  const top = rows?.slice(0, 10) ?? [];
  const you = rows?.find((r) => r.isYou);
  const youInTop = !!you && you.rank <= 10;
  const ahead = you && rows ? rows[you.rank - 2] : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Path leaderboard"
        title={`${pathway.title} path`}
        subtitle="Trojans on the same path, ranked by streak and check-in rate."
        actions={<Button href="/checkin">Check in to climb</Button>}
      />

      <div className="flex w-full items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-[20px] border border-border bg-surface p-[22px]">
          <div className="mb-2 flex items-center gap-[10px] px-[10px] text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">
            <span className="w-[26px] text-center">#</span>
            <span className="w-[34px]" />
            <span className="flex-1">Student</span>
            <span className="w-[110px] text-right">Check-in rate</span>
            <span className="w-[80px] text-right">Points</span>
            <span className="w-[86px] text-right">Streak</span>
          </div>
          {rows ? (
            <>
              {top.map((r) => (
                <LeaderRow key={r.rank} row={r} large showStats />
              ))}
              {you && !youInTop && (
                <>
                  <div className="flex items-center gap-2 px-[10px] py-1 text-muted">
                    <span className="w-[26px] text-center">⋯</span>
                  </div>
                  <LeaderRow row={you} large showStats />
                </>
              )}
            </>
          ) : (
            Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-[58px] animate-pulse rounded-[10px] bg-bg" />)
          )}
        </div>

        <div className="flex w-[340px] shrink-0 flex-col gap-5">
          <div className="flex flex-col gap-2 rounded-[20px] bg-cardinal-soft p-[22px]">
            <p className="text-[13px] font-semibold text-cardinal">Your rank</p>
            <p className="font-display text-[40px] leading-none font-bold text-cardinal">{you ? `#${you.rank}` : '…'}</p>
            <p className="text-[14px] leading-[1.5] text-ink">
              {ahead && you
                ? ahead.streak > you.streak
                  ? `${ahead.streak - you.streak} more weekly check-in${ahead.streak - you.streak === 1 ? '' : 's'} passes ${ahead.name}.`
                  : `You are tied with ${ahead.name} on streak. Keep your check-in rate up to pass them.`
                : you
                  ? 'You lead this path. Keep the streak alive.'
                  : 'Loading your spot…'}
            </p>
            <div className="mt-1 flex gap-2">
              <Chip tone="gold">{streak} wk streak</Chip>
              {streakBonusPct(streak) > 0 && <Chip tone="success">+{streakBonusPct(streak)}% bonus</Chip>}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] border border-border bg-surface p-[22px]">
            <div className="flex items-center gap-2">
              <Info size={17} className="text-muted" />
              <p className="text-[16px] font-semibold text-ink">How ranking works</p>
            </div>
            <p className="text-[14px] leading-[1.5] text-muted">
              You are ranked within your pathway by weekly streak first, then by check-in rate. Points break ties. Showing up every
              week matters more than one big week.
            </p>
            <p className="text-[12px] text-muted">Only first names and last initials are shown.</p>
          </div>
        </div>
      </div>
    </>
  );
}
