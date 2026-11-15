'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PartyPopper, Sparkles } from 'lucide-react';
import type { LeaderboardRow, Task } from '@/types';
import { api } from '@/lib/api';
import { levelFor, streakBonusPct } from '@/lib/points';
import { useApp, weekPoints } from '@/lib/store';
import { TIER_TONE } from '@/lib/labels';
import { TaskCard } from '@/components/TaskCard';
import { LeaderRow } from '@/components/Leaderboard';
import { Button, Chip, Modal, PageHeader, Progress, cx } from '@/components/ui';

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', opts);

function dayBefore(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WeekPage() {
  const week = useApp((s) => s.week)!;
  const pathway = useApp((s) => s.pathway)!;
  const streak = useApp((s) => s.streak);
  const xp = useApp((s) => s.totalPoints);
  const adjustedAt = useApp((s) => s.adjustedAt);
  const clearAdjusted = useApp((s) => s.clearAdjusted);
  const setTaskDone = useApp((s) => s.setTaskDone);

  const [proofTask, setProofTask] = useState<Task | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [whyOpen, setWhyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [board, setBoard] = useState<LeaderboardRow[] | null>(null);

  const pts = weekPoints(week);
  const doneCount = week.tasks.filter((t) => t.done).length;
  const level = levelFor(xp);
  const bonus = streakBonusPct(streak);
  const justAdjusted = !!adjustedAt;

  useEffect(() => {
    let live = true;
    api.getLeaderboard(pathway.title).then((rows) => live && setBoard(rows));
    return () => {
      live = false;
    };
  }, [pathway.title, streak, xp]);

  useEffect(() => {
    if (!adjustedAt) return;
    const t = setTimeout(clearAdjusted, 15_000);
    return () => clearTimeout(t);
  }, [adjustedAt, clearAdjusted]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const complete = (task: Task, proof?: string) => {
    setTaskDone(task.id, true, proof);
    setToast(`+${task.points} pts · ${task.title}`);
    api.completeTask(task.id, proof).catch(() => setToast('Saved locally. Sync will retry.'));
  };

  const onToggle = (task: Task) => {
    if (task.done) {
      setTaskDone(task.id, false);
      return;
    }
    if (task.tier === 'major') {
      setProofUrl(task.proof_url ?? '');
      setProofTask(task);
      return;
    }
    complete(task);
  };

  const proofValid = /^https?:\/\/\S+\.\S+/.test(proofUrl.trim());
  const top = board?.slice(0, 3) ?? [];
  const you = board?.find((r) => r.isYou);

  return (
    <>
      <PageHeader
        eyebrow={`Week ${week.number} · ${fmt(week.start)} to ${fmt(week.end, { day: 'numeric' })}`}
        title="This week’s quests"
        subtitle="Four tasks picked from your path. Finish what you can before Sunday’s check-in."
        actions={
          <>
            <Button variant="secondary" onClick={() => setWhyOpen(true)}>
              Ask why
            </Button>
            <Button href="/checkin">Start check-in</Button>
          </>
        }
      />

      {justAdjusted && (
        <div className="animate-fade-in -mt-2 flex items-center gap-3 rounded-[16px] border border-gold/60 bg-gold-soft px-5 py-3">
          <Sparkles size={18} className="text-cardinal" fill="currentColor" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-ink">
            Check-in received. Week {week.number} was rebuilt from your answers. See what changed on the right.
          </p>
        </div>
      )}

      <div className="grid w-full grid-cols-3 gap-5">
        <div className="flex flex-col gap-[10px] rounded-[20px] border border-border bg-surface p-5">
          <p className="text-[13px] font-semibold text-muted">Points this week</p>
          <div className="flex items-end gap-[6px]">
            <p key={pts} className="animate-pop font-display text-[30px] leading-none font-bold text-ink">
              {pts}
            </p>
            <p className="text-[15px] font-medium text-muted">/ {week.pointsGoal} pts</p>
          </div>
          <Progress value={pts / week.pointsGoal} />
        </div>
        <div className="flex flex-col gap-[10px] rounded-[20px] border border-border bg-surface p-5">
          <p className="text-[13px] font-semibold text-muted">Streak</p>
          <p className="font-display text-[30px] leading-none font-bold text-ink">
            {streak} week{streak === 1 ? '' : 's'}
          </p>
          <div>
            {bonus > 0 ? <Chip tone="success">+{bonus}% bonus active</Chip> : <Chip tone="neutral">Check in to start a bonus</Chip>}
          </div>
        </div>
        <div className="flex flex-col gap-[10px] rounded-[20px] border border-border bg-surface p-5">
          <p className="text-[13px] font-semibold text-muted">Level</p>
          <div className="flex items-end gap-[6px]">
            <p className="font-display text-[30px] leading-none font-bold text-ink">{level.name}</p>
            <p className="text-[15px] font-medium text-muted">
              {xp} of {level.nextAt} XP
            </p>
          </div>
          <Progress value={level.pct} barClassName="bg-gold" />
        </div>
      </div>

      <div className="flex w-full items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-semibold text-ink">Tasks</p>
            <p className="text-[14px] font-medium text-muted">
              {doneCount} of {week.tasks.length} done
            </p>
          </div>
          {week.tasks.map((t, i) => (
            <div key={t.id} className={justAdjusted ? 'animate-fade-in' : ''} style={{ animationDelay: `${i * 90}ms` }}>
              <TaskCard task={t} onToggle={onToggle} />
            </div>
          ))}
          {doneCount === week.tasks.length && (
            <div className="animate-fade-in flex items-center justify-between gap-4 rounded-[16px] border border-success/30 bg-success-soft px-5 py-4">
              <div className="flex items-center gap-3">
                <PartyPopper size={20} className="text-success" />
                <p className="text-[15px] font-semibold text-success">Every task done. Check in to bank your streak bonus.</p>
              </div>
              <Button href="/checkin" className="py-[10px]">
                Check in
              </Button>
            </div>
          )}
        </div>

        <div className="flex w-[340px] shrink-0 flex-col gap-5">
          <div
            key={adjustedAt ?? 'static'}
            className={cx('flex flex-col gap-[10px] rounded-[20px] bg-gold-soft p-[22px]', justAdjusted && 'animate-glow')}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cardinal" fill="currentColor" strokeWidth={1.5} />
                <p className="text-[16px] font-semibold text-ink">Adjusted for you</p>
              </div>
              {justAdjusted && <Chip tone="goldSolid">Just updated</Chip>}
            </div>
            <p className="text-[14px] leading-[1.5] text-ink">{week.adjustmentNote}</p>
            <p className="text-[12px] text-muted">Based on your {dayBefore(week.start)} check-in</p>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] border border-border bg-surface p-[22px]">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-semibold text-ink">Path leaderboard</p>
              <Chip tone="neutral">Preview</Chip>
            </div>
            <p className="text-[13px] leading-[1.4] text-muted">
              {pathway.title} path · ranked by streak and check-in rate
            </p>
            {board ? (
              <>
                {top.map((r) => (
                  <LeaderRow key={r.rank} row={r} />
                ))}
                {you && you.rank > 3 && <LeaderRow row={you} />}
                <Link href="/leaderboard" className="mt-1 self-start text-[13px] font-semibold text-cardinal hover:underline">
                  See full leaderboard
                </Link>
              </>
            ) : (
              <div className="flex flex-col gap-2 py-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[38px] animate-pulse rounded-[10px] bg-bg" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proof link for major tasks */}
      <Modal open={!!proofTask} onClose={() => setProofTask(null)} title="Link your proof">
        {proofTask && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!proofValid) return;
              complete(proofTask, proofUrl.trim());
              setProofTask(null);
            }}
          >
            <p className="text-[14px] leading-[1.5] text-muted">
              Major tasks need a link before they count. A GitHub repo, a doc, a photo album, anything that shows the work for{' '}
              <span className="font-semibold text-ink">{proofTask.title}</span>.
            </p>
            <input
              autoFocus
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://github.com/you/project"
              className="w-full rounded-[12px] border-[1.5px] border-border bg-surface px-4 py-3 text-[15px] outline-none focus:border-cardinal"
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setProofTask(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!proofValid}>
                Mark done · +{proofTask.points}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Ask why */}
      <Modal open={whyOpen} onClose={() => setWhyOpen(false)} title="Why these four tasks" width="w-[560px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[14px] bg-gold-soft p-4 text-[14px] leading-[1.5] text-ink">{week.adjustmentNote}</div>
          <div className="flex flex-col gap-3">
            {week.tasks.map((t) => (
              <div key={t.id} className="flex items-start gap-3">
                <Chip tone={TIER_TONE[t.tier].tone}>{TIER_TONE[t.tier].label}</Chip>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">{t.title}</p>
                  <p className="text-[13px] text-muted">
                    {t.why} <span className="text-ink/70">· {t.resource_name}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-muted">
            Points: Quick 10 · Standard 25 · Major 60. Checking in adds 15, plus your streak bonus.
          </p>
        </div>
      </Modal>

      {toast && (
        <div className="animate-fade-in fixed right-8 bottom-8 z-40 rounded-[14px] bg-ink px-4 py-3 text-[14px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
