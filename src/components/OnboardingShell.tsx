'use client';

import { usePathname } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { useHydrated } from '@/lib/store';
import { Logo, cx } from './ui';

export const STEPS = [
  { href: '/onboarding/about', label: 'About you' },
  { href: '/onboarding/goals', label: 'Where you are headed' },
  { href: '/onboarding/time', label: 'Your time' },
  { href: '/onboarding/path', label: 'Your path' },
];

const COPY: Record<string, { title: string[]; body: string }> = {
  '/': {
    title: ['Your career,', 'one week at a time.'],
    body: 'Trojan Path turns your goals into a weekly plan built from real USC courses, clubs, and events. Setup takes about three minutes.',
  },
  '/onboarding/about': {
    title: ['First,', 'the basics.'],
    body: 'Tell us who you are and what you have done so far. Uploading a resume fills most of this in for you.',
  },
  '/onboarding/goals': {
    title: ['Your career,', 'one week at a time.'],
    body: 'Answer a few quick questions. We build a path from real USC courses, clubs, and events, then adjust it every week based on how it is going.',
  },
  '/onboarding/time': {
    title: ['A plan that fits', 'your week.'],
    body: 'Tell us how much time you have and how you like to work. Your weekly tasks are sized to match.',
  },
  '/onboarding/path': {
    title: ['Your path', 'is ready.'],
    body: 'We matched your answers to real USC courses, clubs, and events. You can change any of it later.',
  },
};

/** Big gold dotted S-curve at the top right of the brand panel. */
function BrandPath() {
  return (
    <svg className="absolute top-[100px] left-[312px]" width="160" height="134" viewBox="0 0 160 134" fill="none" aria-hidden>
      <path
        d="M3 128 C 40 126, 92 118, 104 96 C 116 72, 42 66, 44 40 C 46 16, 100 8, 148 7"
        stroke="#FFCC00"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="0.1 8"
      />
      <circle cx="152" cy="7" r="5" fill="#FFCC00" />
    </svg>
  );
}

export function OnboardingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const copy = COPY[pathname] ?? COPY['/'];
  const current = STEPS.findIndex((s) => s.href === pathname); // -1 on welcome

  return (
    <div className="flex min-h-screen min-w-[1200px] bg-bg">
      <aside className="sticky top-0 flex h-screen w-[520px] shrink-0 flex-col justify-between overflow-hidden bg-cardinal px-14 pt-14 pb-14">
        <BrandPath />
        <Logo light />
        <div key={pathname} className="animate-fade-in flex flex-col gap-6 pr-6">
          <h1 className="font-display text-[52px] leading-[1.08] font-bold text-white">
            {copy.title.map((l, i) => (
              <Fragment key={i}>
                {l}
                {i < copy.title.length - 1 && <br />}
              </Fragment>
            ))}
          </h1>
          <p className="max-w-[400px] text-[17px] leading-[1.55] text-white/95">{copy.body}</p>
        </div>
        <ol className="flex flex-col gap-4">
          {STEPS.map((s, i) => {
            const done = current > i;
            const on = current === i;
            return (
              <li key={s.href} className="flex items-center gap-3">
                <span
                  className={cx(
                    'flex size-7 items-center justify-center rounded-full text-[12px] font-bold transition-colors',
                    done && 'bg-gold text-cardinal',
                    on && 'bg-white text-cardinal',
                    !done && !on && 'border-[1.5px] border-white/80 text-white',
                  )}
                >
                  {done ? <Check size={15} strokeWidth={3.2} /> : i + 1}
                </span>
                <span className={cx('text-[15px] text-white', on ? 'font-semibold' : 'font-medium')}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </aside>
      <main className="flex min-w-0 flex-1 justify-center px-[72px] py-12">
        <div className="flex w-full max-w-[776px] flex-col">{hydrated ? children : null}</div>
      </main>
    </div>
  );
}

// ------------------------------------------------------------- Form pieces

export function StepFrame({
  step,
  title,
  subtitle,
  children,
  footer,
}: {
  step: number;
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-cardinal uppercase">Step {step} of 4</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-cardinal transition-[width] duration-700 ease-out" style={{ width: `${step * 25}%` }} />
      </div>
      <h2 className="mt-7 font-display text-[34px] leading-[1.15] font-bold text-ink">{title}</h2>
      <p className="mt-2 text-[16px] text-muted">{subtitle}</p>
      <div className="mt-7 flex flex-col gap-7">{children}</div>
      <div className="mt-auto flex items-center justify-between gap-4 pt-8">{footer}</div>
    </div>
  );
}

export function FieldLabel({ children, hint, htmlFor }: { children: ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-3 block text-[14px] font-semibold text-ink">
      {children}
      {hint && <span className="ml-1.5 font-normal text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[12px] border border-border bg-surface px-4 py-[13px] text-[15px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-cardinal/60';

export function Pill({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'rounded-[10px] px-4 py-[11px] text-[14px] font-medium transition-all duration-150',
        selected
          ? 'bg-cardinal text-white shadow-[0_2px_6px_rgba(153,0,0,0.18)]'
          : 'border border-border bg-surface text-ink hover:border-cardinal/40',
        disabled && 'opacity-40 hover:border-border',
      )}
    >
      {children}
    </button>
  );
}

export function StepError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="animate-fade-in text-[13px] font-medium text-cardinal">{message}</p>;
}
