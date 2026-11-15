'use client';

import { Check, Link2 } from 'lucide-react';
import type { Task } from '@/types';
import { TIER_TONE } from '@/lib/labels';
import { Chip, cx } from './ui';

export function TaskCard({ task, onToggle, busy }: { task: Task; onToggle: (t: Task) => void; busy?: boolean }) {
  const tier = TIER_TONE[task.tier];
  return (
    <div
      className={cx(
        'flex w-full items-start gap-4 rounded-[16px] border border-border px-5 py-[18px] transition-colors duration-300',
        task.done ? 'bg-bg' : 'bg-surface',
      )}
    >
      <button
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        disabled={busy}
        onClick={() => onToggle(task)}
        className={cx(
          'mt-[1px] flex size-6 shrink-0 items-center justify-center rounded-[7px] border-2 transition-all duration-200',
          task.done ? 'border-success bg-success text-white' : 'border-border bg-surface hover:border-cardinal/60',
        )}
      >
        {task.done && <Check size={16} strokeWidth={3} className="animate-pop" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <div className="flex items-center gap-2">
          <Chip tone={tier.tone}>{tier.label}</Chip>
          <p className="truncate text-[13px] font-medium text-muted">{task.resource_name}</p>
        </div>
        <p className={cx('text-[17px] font-semibold text-ink', task.done && 'text-ink/80')}>{task.title}</p>
        <p className="text-[14px] leading-[1.4] text-muted">{task.why}</p>
        {task.done && task.proof_url && (
          <a
            href={task.proof_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 self-start text-[13px] font-medium text-success hover:underline"
          >
            <Link2 size={14} /> Proof linked
          </a>
        )}
      </div>
      <span
        className={cx(
          'shrink-0 rounded-full px-3 py-[6px] text-[14px] font-bold transition-colors duration-300',
          task.done ? 'bg-success-soft text-success' : 'bg-cardinal-soft text-cardinal',
        )}
      >
        +{task.points}
      </span>
    </div>
  );
}
