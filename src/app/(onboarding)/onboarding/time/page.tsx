'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import type { HoursBand } from '@/types';
import { useApp } from '@/lib/store';
import { Button, cx } from '@/components/ui';
import { FieldLabel, Pill, StepError, StepFrame } from '@/components/OnboardingShell';

const HOURS: { id: HoursBand; title: string; name: string; tasks: number }[] = [
  { id: '1-2', title: '1 to 2 hrs', name: 'Light', tasks: 2 },
  { id: '3-4', title: '3 to 4 hrs', name: 'Steady', tasks: 4 },
  { id: '5-7', title: '5 to 7 hrs', name: 'Focused', tasks: 6 },
  { id: '8+', title: '8+ hrs', name: 'All in', tasks: 8 },
];
const TARGETS = ['Summer 2027', 'Summer 2028', 'After graduation', 'Not sure yet'];
const STYLES = ['Building projects', 'Meeting people', 'Taking courses', 'Reading and research'];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimePage() {
  const router = useRouter();
  const answers = useApp((s) => s.answers);
  const setAnswers = useApp((s) => s.setAnswers);
  const [error, setError] = useState<string | null>(null);

  const toggleStyle = (s: string) => {
    const has = answers.workStyles.includes(s);
    if (has) return setAnswers({ workStyles: answers.workStyles.filter((x) => x !== s) });
    if (answers.workStyles.length >= 2) return;
    setAnswers({ workStyles: [...answers.workStyles, s] });
  };

  const next = () => {
    if (!answers.hours) return setError('Pick how many hours you have.');
    if (!answers.internshipTarget) return setError('Pick an internship target. Not sure yet is fine.');
    setError(null);
    router.push('/onboarding/path');
  };

  const hours = HOURS.find((h) => h.id === answers.hours);
  const summary = [
    hours ? `About ${hours.tasks} tasks a week` : null,
    `Check-in on ${DAY_NAMES[answers.checkinDay]}s`,
    answers.internshipTarget ? `Internship target: ${answers.internshipTarget}` : null,
    answers.workStyles.length ? `Leans on ${answers.workStyles.map((s) => s.toLowerCase()).join(' and ')}` : null,
    answers.dailyNudge ? 'Daily nudge at 6 PM' : null,
  ].filter(Boolean) as string[];

  return (
    <StepFrame
      step={3}
      title="How much time do you have?"
      subtitle="Be honest. A small plan you finish beats a big one you skip."
      footer={
        <>
          <Button variant="secondary" href="/onboarding/goals">
            Back
          </Button>
          <div className="flex items-center gap-5">
            <StepError message={error} />
            {!error && <span className="text-[13px] text-muted">About 1 minute left</span>}
            <Button onClick={next}>Build my path</Button>
          </div>
        </>
      }
    >
      <div>
        <FieldLabel>Hours per week for career work</FieldLabel>
        <div className="grid grid-cols-4 gap-3">
          {HOURS.map((h) => {
            const on = answers.hours === h.id;
            return (
              <button
                key={h.id}
                type="button"
                aria-pressed={on}
                onClick={() => setAnswers({ hours: h.id })}
                className={cx(
                  'flex flex-col items-start gap-1 rounded-[16px] text-left transition-all duration-150',
                  on ? 'border-2 border-cardinal bg-cardinal-soft px-[17px] py-[15px]' : 'border border-border bg-surface px-[18px] py-4 hover:border-cardinal/40',
                )}
              >
                <span className="font-display text-[20px] font-bold text-ink">{h.title}</span>
                <span className={cx('mt-1 text-[14px] font-semibold', on ? 'text-cardinal' : 'text-ink')}>{h.name}</span>
                <span className="text-[13px] text-muted">About {h.tasks} tasks a week</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>When do you want your first internship?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {TARGETS.map((t) => (
            <Pill key={t} selected={answers.internshipTarget === t} onClick={() => setAnswers({ internshipTarget: t })}>
              {t}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel hint="Pick up to two">How do you like to make progress?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => {
            const on = answers.workStyles.includes(s);
            return (
              <Pill key={s} selected={on} disabled={!on && answers.workStyles.length >= 2} onClick={() => toggleStyle(s)}>
                {s}
              </Pill>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-8">
        <div>
          <FieldLabel>Weekly check-in day</FieldLabel>
          <div className="flex gap-2">
            {DAYS.map((d, i) => {
              const on = answers.checkinDay === i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={DAY_NAMES[i]}
                  aria-pressed={on}
                  onClick={() => setAnswers({ checkinDay: i })}
                  className={cx(
                    'flex size-10 items-center justify-center rounded-full text-[13px] font-semibold transition-colors',
                    on ? 'bg-cardinal text-white' : 'border border-border bg-surface text-ink hover:border-cardinal/40',
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <FieldLabel>Daily nudge</FieldLabel>
          <button
            type="button"
            role="switch"
            aria-checked={answers.dailyNudge}
            onClick={() => setAnswers({ dailyNudge: !answers.dailyNudge })}
            className="flex w-full items-center justify-between rounded-[12px] border border-border bg-surface px-4 py-[11px]"
          >
            <span className="text-[14px] text-ink">A short reminder at 6 PM</span>
            <span className={cx('relative h-6 w-11 rounded-full transition-colors', answers.dailyNudge ? 'bg-cardinal' : 'bg-border')}>
              <span
                className={cx(
                  'absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-[left] duration-200',
                  answers.dailyNudge ? 'left-[23px]' : 'left-[3px]',
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-blue-soft px-4 py-3">
        <Sparkles size={16} className="text-cardinal" fill="currentColor" strokeWidth={1.5} />
        <span className="mr-1 text-[14px] font-semibold text-ink">Your plan so far</span>
        {summary.map((s) => (
          <span key={s} className="animate-fade-in rounded-full bg-surface px-3 py-1 text-[12px] font-semibold text-ink">
            {s}
          </span>
        ))}
      </div>
    </StepFrame>
  );
}
