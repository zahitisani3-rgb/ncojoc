'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CheckCircle2, Link2, Loader2, Sparkles } from 'lucide-react';
import type { Checkin, Scale } from '@/types';
import { api } from '@/lib/api';
import { CHECKIN_POINTS, streakBonus, streakBonusPct } from '@/lib/points';
import { useApp, weekPoints, type CheckinDraft } from '@/lib/store';
import { Button, Chip, PageHeader, cx } from '@/components/ui';

const QUESTIONS: { key: 'enjoyment' | 'workload' | 'confidence'; q: string; hint: string }[] = [
  { key: 'enjoyment', q: 'How much did you enjoy this week’s tasks?', hint: '1 not at all · 5 loved it' },
  { key: 'workload', q: 'How manageable was the workload?', hint: '1 too light · 5 too much' },
  { key: 'confidence', q: 'How sure do you feel about this path?', hint: '1 lost · 5 locked in' },
];

const PROMPTS = ['What felt hard?', 'What do you want more of?', 'Anything to drop?'];

function ScaleRow({ value, onChange, label }: { value: Scale | null; onChange: (v: Scale) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-2">
      {([1, 2, 3, 4, 5] as Scale[]).map((n) => {
        const on = value === n;
        return (
          <button
            key={n}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(n)}
            className={cx(
              'flex size-10 items-center justify-center rounded-full text-[15px] font-semibold transition-all duration-150',
              on
                ? 'scale-105 bg-cardinal text-white shadow-[0_4px_10px_rgba(153,0,0,0.25)]'
                : 'border-[1.5px] border-border bg-surface text-ink hover:border-cardinal/50',
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function trendLine(values: number[]): string {
  if (values.length < 2) return 'Your trend fills in as you check in each week.';
  const first = values[0];
  const last = values[values.length - 1];
  if (last > first) return 'Trending up since your path shifted toward what you enjoy.';
  if (last < first) return 'Dipping a little. Your answers today will rebalance next week.';
  return 'Holding steady. Tell us what would make next week better.';
}

export default function CheckinPage() {
  const router = useRouter();
  const week = useApp((s) => s.week)!;
  const streak = useApp((s) => s.streak);
  const trend = useApp((s) => s.trend);
  const draft = useApp((s) => s.checkinDraft);
  const setDraft = useApp((s) => s.setDraft);
  const applyCheckin = useApp((s) => s.applyCheckin);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [phase, setPhase] = useState<'form' | 'sending' | 'done'>('form');
  const [result, setResult] = useState<{ bonus: number; week: number; streak: number } | null>(null);
  const [savedNote, setSavedNote] = useState('Saved automatically');
  const [error, setError] = useState<string | null>(null);

  const major = week.tasks.find((t) => t.tier === 'major');
  const proof = draft.proof_url || major?.proof_url || '';
  const pts = weekPoints(week);
  const bonusPct = streakBonusPct(streak);
  const bonus = streakBonus(pts, streak);
  const complete = draft.enjoyment && draft.workload && draft.confidence;

  const update = (patch: Partial<CheckinDraft>) => {
    setDraft(patch);
    setSavedNote('Saved automatically');
  };

  const insertPrompt = (p: string) => {
    const cur = draft.reflection.trimEnd();
    update({ reflection: `${cur}${cur ? '\n' : ''}${p} ` });
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const submit = async () => {
    if (!complete) {
      setError('Answer the three quick ratings first.');
      return;
    }
    setError(null);
    const checkin: Checkin = {
      week: week.number,
      enjoyment: draft.enjoyment!,
      workload: draft.workload!,
      confidence: draft.confidence!,
      reflection: draft.reflection.trim(),
      proof_url: proof.trim() || undefined,
    };
    setPhase('sending');
    try {
      const next = await api.submitCheckin(checkin);
      setResult({ bonus, week: next.number, streak: streak + 1 });
      applyCheckin(checkin, next);
      setPhase('done');
      setTimeout(() => router.push('/week'), 1900);
    } catch {
      setPhase('form');
      setError('Could not reach the server. Your draft is saved, try again in a moment.');
    }
  };

  const trendRows = [
    ...trend.map((t) => ({ label: `Week ${t.week}`, v: t.enjoyment as number, current: false })),
    ...(draft.enjoyment ? [{ label: `Week ${week.number}`, v: draft.enjoyment as number, current: true }] : []),
  ].slice(-5);

  return (
    <>
      <PageHeader
        eyebrow={`Sunday check-in · Week ${week.number}`}
        title="How did this week go?"
        subtitle="Two minutes. Your answers decide what next week looks like."
        actions={<Chip tone="success">+{CHECKIN_POINTS} pts for checking in</Chip>}
      />

      <div className="flex min-h-[640px] w-full flex-1 items-stretch gap-6">
        {/* Form */}
        <div className="relative flex min-w-0 flex-1 flex-col rounded-[20px] border border-border bg-surface px-7 py-6">
          {QUESTIONS.map(({ key, q, hint }) => (
            <div key={key} className="flex items-center justify-between gap-6 border-b border-border py-4 first:pt-1">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold text-ink">{q}</p>
                <p className="mt-1 text-[13px] text-muted">{hint}</p>
              </div>
              <ScaleRow label={q} value={draft[key]} onChange={(v) => update({ [key]: v })} />
            </div>
          ))}

          <div className="flex min-h-[200px] flex-1 flex-col gap-3 pt-6">
            <label htmlFor="reflection" className="text-[16px] font-semibold text-ink">
              What stood out this week?
            </label>
            <textarea
              id="reflection"
              ref={textRef}
              value={draft.reflection}
              onChange={(e) => update({ reflection: e.target.value })}
              placeholder="A sentence or two is plenty. What was fun, what dragged, what surprised you?"
              className="min-h-[120px] w-full flex-1 resize-none rounded-[14px] border border-border bg-bg px-4 py-4 text-[15px] leading-[1.6] text-ink outline-none placeholder:text-muted/70 focus:border-cardinal/60"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-muted">Need a prompt?</span>
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => insertPrompt(p)}
                  className="rounded-full bg-bg px-3 py-[5px] text-[12px] font-semibold text-ink transition-colors hover:bg-cardinal-soft hover:text-cardinal"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6">
            <label htmlFor="proof" className="text-[16px] font-semibold text-ink">
              Proof for your major task
              {major && <span className="ml-2 text-[13px] font-normal text-muted">{major.title}</span>}
            </label>
            <div className="flex items-center gap-3 rounded-[14px] border border-border bg-bg px-4 py-3 focus-within:border-cardinal/60">
              <Link2 size={18} className="shrink-0 text-muted" />
              <input
                id="proof"
                value={proof}
                onChange={(e) => update({ proof_url: e.target.value })}
                placeholder="Paste a GitHub, Drive, or portfolio link"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/70"
              />
              {proof.trim().length > 4 && <Chip tone="success">Linked</Chip>}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className={cx('text-[13px]', error ? 'font-medium text-cardinal' : 'text-muted')}>{error ?? savedNote}</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() =>
                  setSavedNote(`Draft saved at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`)
                }
              >
                Save draft
              </Button>
              <Button onClick={submit} disabled={phase !== 'form'}>
                {phase === 'sending' && <Loader2 size={16} className="animate-spin" />}
                {phase === 'sending' ? 'Rebuilding next week…' : 'Submit check-in'}
              </Button>
            </div>
          </div>

          {phase === 'done' && result && (
            <div className="animate-fade-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-[20px] bg-surface/95 text-center backdrop-blur-sm">
              <span className="animate-pop flex size-16 items-center justify-center rounded-full bg-success text-white">
                <Check size={34} strokeWidth={3} />
              </span>
              <p className="font-display text-[28px] font-bold text-ink">Check-in submitted</p>
              <div className="flex gap-2">
                <Chip tone="success">+{CHECKIN_POINTS} check-in</Chip>
                {result.bonus > 0 && <Chip tone="cardinal">+{result.bonus} streak bonus</Chip>}
                <Chip tone="gold">{result.streak} week streak</Chip>
              </div>
              <p className="flex items-center gap-2 text-[15px] text-muted">
                <Loader2 size={16} className="animate-spin" /> Opening week {result.week}, rebuilt from your answers…
              </p>
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="flex w-[340px] shrink-0 flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-[22px]">
            <p className="text-[16px] font-semibold text-ink">This week so far</p>
            <div className="flex flex-col gap-[14px]">
              {week.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  {t.done ? (
                    <CheckCircle2 size={22} className="shrink-0 fill-success text-white" strokeWidth={2.2} />
                  ) : (
                    <span className="size-[22px] shrink-0 rounded-full border-[1.5px] border-border" />
                  )}
                  <p className={cx('min-w-0 flex-1 truncate text-[14px]', t.done ? 'text-ink' : 'text-muted')}>{t.title}</p>
                  <span className={cx('text-[13px] font-semibold', t.done ? 'text-success' : 'text-muted')}>+{t.points}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-end justify-between border-t border-border pt-4">
              <div>
                <p className="text-[13px] text-muted">
                  {pts} pts{bonusPct > 0 ? ` + ${bonusPct}% streak bonus` : ''}
                </p>
                <p className="text-[14px] font-semibold text-ink">Total this week</p>
              </div>
              <p className="font-display text-[30px] leading-none font-bold text-cardinal">{pts + bonus} pts</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[20px] bg-blue-soft p-[22px]">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-blue" fill="currentColor" strokeWidth={1.5} />
              <p className="text-[16px] font-semibold text-ink">What happens next</p>
            </div>
            <p className="text-[14px] leading-[1.5] text-ink">
              The AI reads your answers and rebuilds week {week.number + 1} around them. Every changed task comes with a one line reason,
              so you always know why.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-2 rounded-[20px] border border-border bg-surface p-[22px]">
            <p className="text-[16px] font-semibold text-ink">Your trend</p>
            <p className="text-[13px] text-muted">How much you enjoyed each week</p>
            <div className="mt-1 flex flex-col gap-2">
              {trendRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className={cx('w-[64px] text-[13px]', r.current ? 'font-semibold text-ink' : 'text-muted')}>{r.label}</span>
                  <div className="flex flex-1 gap-[5px]">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={cx('h-[7px] flex-1 rounded-full transition-colors', n <= r.v ? 'bg-cardinal' : 'bg-border')}
                      />
                    ))}
                  </div>
                  <span className={cx('w-9 text-right text-[13px]', r.current ? 'font-semibold text-ink' : 'text-muted')}>{r.v} / 5</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[13px] leading-[1.45] text-muted">{trendLine(trendRows.map((r) => r.v))}</p>
          </div>
        </div>
      </div>
    </>
  );
}
