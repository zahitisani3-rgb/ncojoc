'use client';

import Link from 'next/link';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

// ---------------------------------------------------------------- Button
type Variant = 'primary' | 'secondary' | 'gold' | 'ghost';

const variantClass: Record<Variant, string> = {
  primary: 'bg-cardinal text-white hover:bg-cardinal-dark disabled:bg-cardinal/40',
  secondary: 'bg-surface text-ink border-[1.5px] border-border hover:border-muted/40 disabled:text-muted',
  gold: 'bg-gold text-ink hover:brightness-95 disabled:opacity-50',
  ghost: 'text-muted hover:text-ink hover:bg-border/40',
};

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-[12px] px-[22px] py-[13px] text-[15px] leading-none font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cardinal';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
}

export function Button({ variant = 'primary', href, className, children, ...rest }: ButtonProps) {
  const cls = cx(btnBase, variantClass[variant], className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- Chip
export type ChipTone = 'cardinal' | 'gold' | 'blue' | 'success' | 'neutral' | 'goldSolid' | 'white';

const toneClass: Record<ChipTone, string> = {
  cardinal: 'bg-cardinal-soft text-cardinal',
  gold: 'bg-gold-soft text-ink',
  blue: 'bg-blue-soft text-blue',
  success: 'bg-success-soft text-success',
  neutral: 'bg-border text-muted',
  goldSolid: 'bg-gold text-ink',
  white: 'bg-surface text-ink border border-border',
};

export function Chip({ tone = 'cardinal', className, children }: { tone?: ChipTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-[10px] py-[4px] text-[12px] leading-[normal] font-semibold whitespace-nowrap',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- Card
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-[20px] border border-border bg-surface px-6 py-5', className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('text-[12px] font-semibold tracking-[0.08em] text-muted uppercase', className)}>{children}</p>
  );
}

// ---------------------------------------------------------------- Page header
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex w-full items-end justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-[6px]">
        <p className="text-[13px] font-semibold tracking-[0.08em] text-cardinal uppercase">{eyebrow}</p>
        <h1 className="font-display text-[34px] leading-[1.15] font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-[16px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Progress
export function Progress({
  value,
  className,
  barClassName = 'bg-cardinal',
}: {
  value: number; // 0..1
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-[4px] bg-border', className)}>
      <div
        className={cx('h-full rounded-[4px] transition-[width] duration-700 ease-out', barClassName)}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- Modal
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'w-[480px]',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx('animate-fade-in max-w-full rounded-[20px] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(28,22,22,0.18)]', width)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-[22px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-bg hover:text-ink">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Logo
export function Logo({ light = false, href = '/' }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-[10px]">
      <span
        className={cx(
          'flex size-9 items-center justify-center rounded-[10px] font-display text-[14px] font-bold',
          light ? 'bg-gold text-cardinal' : 'bg-cardinal text-gold',
        )}
      >
        TP
      </span>
      <span className={cx('font-display text-[20px] font-bold', light ? 'text-white' : 'text-ink')}>Trojan Path</span>
    </Link>
  );
}

/** Gold dotted trail doodle used on cardinal panels. */
export function PathDoodle({ className, width = 84, height = 34 }: { className?: string; width?: number; height?: number }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 84 34" fill="none" aria-hidden>
      <path
        d="M3 31 C 18 30, 22 20, 36 20 S 56 14, 64 9 S 74 6, 77 6"
        stroke="#FFCC00"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.1 5"
      />
      <circle cx="79" cy="5.5" r="3.5" fill="#FFCC00" />
    </svg>
  );
}

export function Avatar({
  initials,
  size = 40,
  className,
  textClass = 'text-gold',
  bg = 'bg-cardinal',
}: {
  initials: string;
  size?: number;
  className?: string;
  textClass?: string;
  bg?: string;
}) {
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center rounded-full font-display font-bold', bg, textClass, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
    >
      {initials}
    </span>
  );
}
