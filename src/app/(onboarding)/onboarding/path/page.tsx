'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import type { Pathway, Week } from '@/types';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { TIER_TONE } from '@/lib/labels';
import { Button, Chip, cx } from '@/components/ui';
import { StepFrame } from '@/components/OnboardingShell';

const TICK_MS = 600;

export default function PathStepPage() {
  const router = useRouter();
  const answers = useApp((s) => s.answers);
  const applyGenerated = useApp((s) => s.applyGenerated);
  const [result, setResult] = useState<{ pathway: Pathway; week: Week } | null>(null);
  const [ticks, setTicks] = useState(0);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    const timers = [1, 2, 3].map((n) => setTimeout(() => live && setTicks((t) => Math.max(t, n)), n * TICK_MS));
    api
      .generatePathway(answers)
      .then((r) => live && setResult(r))
      .catch(() => live && setError(true));
    return () => {
      live = false;
      timers.forEach(clearTimeout);
    };
    // Generate once per visit (or retry), not on every answer change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const ready = !!result && ticks >= 3;
  const n = result?.pathway.resources.length ?? 18;
  const pills = ['Read your intake', `Matched ${n} USC resources`, 'Planned your first week'];
  const weekPts = result?.week.tasks.reduce((s, t) => s + t.points, 0) ?? 0;

  const start = () => {
    if (!result) return;
    applyGenerated(result.pathway, result.week);
    router.push('/path');
  };

  return (
    <StepFrame
      step={4}
      title={ready ? `Your path: ${result.pathway.title}` : 'Building your path…'}
      subtitle={ready ? `Built from your answers and ${n} USC resources.` : 'Matching your answers to USC courses, clubs, and events.'}
      footer={
        <>
          <Button variant="secondary" href="/onboarding/goals">
            Adjust answers
          </Button>
          <div className="flex items-center gap-5">
            <span className="text-[13px] text-muted">You can change this anytime</span>
            <Button onClick={start} disabled={!ready}>
              Start climbing
            </Button>
          </div>
        </>
      }
    >
      <div className="-mt-2 flex flex-wrap gap-2">
        {pills.map((p, i) => {
          const done = ticks > i && (i < 2 || !!result);
          return (
            <span
              key={p}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-[6px] text-[13px] font-semibold transition-colors duration-300',
                done ? 'bg-success-soft text-success' : 'bg-border/60 text-muted',
              )}
            >
              {done ? <Check size={14} strokeWidth={3} className="animate-pop" /> : <Loader2 size={14} className="animate-spin" />}
              {p}
            </span>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-[16px] border border-cardinal/30 bg-cardinal-soft px-5 py-4">
          <p className="text-[14px] font-medium text-cardinal">We could not build your path just now.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setError(false);
              setTicks(0);
              setResult(null);
              setAttempt((a) => a + 1);
            }}
          >
            <RotateCcw size={16} /> Try again
          </Button>
        </div>
      )}

      {!ready && !error && (
        <div className="flex flex-col gap-4">
          <div className="h-[118px] animate-pulse rounded-[20px] bg-surface" />
          <div className="h-[190px] animate-pulse rounded-[20px] bg-surface" />
        </div>
      )}

      {ready && (
        <>
          <div className="animate-fade-in rounded-[20px] border border-border bg-surface px-8 py-5">
            <div className="relative flex justify-between">
              <span className="absolute top-5 right-[10%] left-[10%] h-[3px] -translate-y-1/2 rounded-full bg-border" />
              {result.pathway.stages.map((s, i) => {
                const cur = s.status === 'current';
                return (
                  <div key={s.name} className="relative flex w-[20%] flex-col items-center gap-1 text-center">
                    <span
                      className={cx(
                        'mb-2 flex size-10 items-center justify-center rounded-full text-[14px] font-bold',
                        cur ? 'border-[3px] border-gold bg-cardinal text-white' : 'border-[1.5px] border-border bg-surface text-muted',
                      )}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[14px] font-semibold text-ink">{s.name}</p>
                    <p className={cx('text-[12px]', cur ? 'text-cardinal' : 'text-muted')}>{cur ? `Start here · ${s.timing}` : s.timing}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="animate-fade-in rounded-[20px] border border-border bg-surface p-5" style={{ animationDelay: '120ms' }}>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[16px] font-semibold text-ink">Your first week</p>
              <p className="text-[13px] text-muted">{weekPts} pts available</p>
            </div>
            <div className="flex flex-col gap-2">
              {result.week.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-[12px] bg-bg px-3 py-2">
                  <Chip tone={TIER_TONE[t.tier].tone}>{TIER_TONE[t.tier].label}</Chip>
                  <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{t.title}</p>
                  <p className="shrink-0 text-[13px] text-muted">{t.resource_name}</p>
                  <span className="shrink-0 rounded-full bg-cardinal-soft px-2.5 py-1 text-[13px] font-bold text-cardinal">+{t.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-in flex items-start gap-3 rounded-[14px] bg-gold-soft px-4 py-3" style={{ animationDelay: '240ms' }}>
            <Sparkles size={16} className="mt-0.5 shrink-0 text-cardinal" fill="currentColor" strokeWidth={1.5} />
            <p className="text-[14px] leading-[1.5] text-ink">
              <span className="font-semibold">Why this path</span>
              <span className="ml-2">{result.pathway.why}</span>
            </p>
          </div>
        </>
      )}
    </StepFrame>
  );
}
