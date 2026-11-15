'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BriefcaseBusiness, Check, Code2, Compass, FlaskConical, Music, Plus, type LucideIcon } from 'lucide-react';
import type { Interest, Year } from '@/types';
import { useApp } from '@/lib/store';
import { Button, cx } from '@/components/ui';
import { FieldLabel, Pill, StepError, StepFrame, inputClass } from '@/components/OnboardingShell';

const YEARS: Year[] = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const PULLS: { id: Interest; title: string; sub: string; Icon: LucideIcon }[] = [
  { id: 'software', title: 'Software and AI', sub: 'ML, apps, data, and systems', Icon: Code2 },
  { id: 'health', title: 'Medicine and Health', sub: 'Pre-med, pre-dental, public health', Icon: Plus },
  { id: 'music', title: 'Music and Arts', sub: 'Performance, production, design', Icon: Music },
  { id: 'business', title: 'Business and Finance', sub: 'Banking, consulting, startups', Icon: BriefcaseBusiness },
  { id: 'research', title: 'Research', sub: 'Labs, grad school, PhD track', Icon: FlaskConical },
  { id: 'unsure', title: 'Not sure yet', sub: 'Explore a few before choosing', Icon: Compass },
];

export default function GoalsPage() {
  const router = useRouter();
  const answers = useApp((s) => s.answers);
  const setAnswers = useApp((s) => s.setAnswers);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: Interest) => {
    const has = answers.interests.includes(id);
    if (id === 'unsure') return setAnswers({ interests: has ? [] : ['unsure'] });
    const rest = answers.interests.filter((i) => i !== 'unsure');
    setAnswers({ interests: has ? rest.filter((i) => i !== id) : [...rest, id] });
  };

  const next = () => {
    if (!answers.major.trim()) return setError('Add your major, or write Undeclared.');
    if (!answers.year) return setError('Pick your year.');
    if (!answers.interests.length) return setError('Pick at least one card. Not sure yet counts.');
    setError(null);
    router.push('/onboarding/time');
  };

  return (
    <StepFrame
      step={2}
      title="Where are you headed?"
      subtitle="Pick what pulls you most. Not sure is a real answer, and the path will help you explore."
      footer={
        <>
          <Button variant="secondary" href="/onboarding/about">
            Back
          </Button>
          <div className="flex items-center gap-5">
            <StepError message={error} />
            {!error && <span className="text-[13px] text-muted">About 2 minutes left</span>}
            <Button onClick={next}>Continue</Button>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_1.6fr] gap-5">
        <div>
          <FieldLabel htmlFor="major">Major</FieldLabel>
          <input
            id="major"
            className={inputClass}
            value={answers.major}
            onChange={(e) => setAnswers({ major: e.target.value })}
            placeholder="Computer Science (B.S.)"
          />
        </div>
        <div>
          <FieldLabel>Year</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {YEARS.map((y) => (
              <Pill key={y} selected={answers.year === y} onClick={() => setAnswers({ year: y })}>
                {y}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>What pulls you?</FieldLabel>
        <div className="grid grid-cols-3 gap-4">
          {PULLS.map(({ id, title, sub, Icon }) => {
            const on = answers.interests.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(id)}
                className={cx(
                  'relative flex flex-col items-start gap-3 rounded-[16px] p-5 text-left transition-all duration-150',
                  on ? 'border-2 border-cardinal bg-cardinal-soft p-[19px]' : 'border border-border bg-surface hover:border-cardinal/40',
                )}
              >
                <span className={cx('flex size-10 items-center justify-center rounded-full', on ? 'bg-white text-cardinal' : 'bg-bg text-muted')}>
                  <Icon size={19} strokeWidth={2} />
                </span>
                {on && (
                  <span className="animate-pop absolute top-5 right-5 flex size-6 items-center justify-center rounded-full bg-cardinal text-white">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                <div>
                  <p className="text-[16px] font-semibold text-ink">{title}</p>
                  <p className="mt-1.5 text-[13px] text-muted">{sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="notes" hint="Optional">
          Anything we should know?
        </FieldLabel>
        <textarea
          id="notes"
          rows={2}
          className={cx(inputClass, 'resize-none leading-[1.55]')}
          value={answers.notes}
          onChange={(e) => setAnswers({ notes: e.target.value })}
          placeholder="Goals, worries, a dream company, anything that helps."
        />
      </div>
    </StepFrame>
  );
}
