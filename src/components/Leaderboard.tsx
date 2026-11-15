'use client';

import type { LeaderboardRow } from '@/types';
import { Avatar, cx } from './ui';

const MEDALS = [
  { disc: '#FFCC00', rim: '#E0A800', ribbon: '#990000' },
  { disc: '#E4E4EA', rim: '#A9A9B6', ribbon: '#2F5DA8' },
  { disc: '#EBB27F', rim: '#B8743D', ribbon: '#2E7D4F' },
];

/** Ribbon plus disc with the rank number, used for places 1 to 3. */
export function Medal({ rank, size = 26 }: { rank: 1 | 2 | 3; size?: number }) {
  const m = MEDALS[rank - 1];
  return (
    <svg width={size} height={(size * 28) / 26} viewBox="0 0 26 28" aria-label={`Rank ${rank}`} role="img">
      <path d="M6 1 H11 L14 10 H9 Z" fill={m.ribbon} />
      <path d="M20 1 H15 L12 10 H17 Z" fill={m.ribbon} opacity="0.8" />
      <circle cx="13" cy="17.5" r="9" fill={m.disc} stroke={m.rim} strokeWidth="1.5" />
      <text
        x="13"
        y="21"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="#1C1616"
        fontFamily="var(--font-dm-sans), sans-serif"
      >
        {rank}
      </text>
    </svg>
  );
}

export function LeaderRow({ row, large = false, showStats = false }: { row: LeaderboardRow; large?: boolean; showStats?: boolean }) {
  const medal = row.rank <= 3 && !row.isYou;
  return (
    <div
      className={cx(
        'flex w-full items-center gap-[10px] rounded-[10px] px-[10px]',
        large ? 'py-3' : 'py-[9px]',
        row.isYou && 'bg-cardinal-soft',
      )}
    >
      <span className="flex w-[26px] shrink-0 justify-center">
        {medal ? (
          <Medal rank={row.rank as 1 | 2 | 3} />
        ) : (
          <span className={cx('font-display text-[14px] font-bold', row.isYou ? 'text-cardinal' : 'text-muted')}>{row.rank}</span>
        )}
      </span>
      {large && (
        <Avatar
          initials={row.initials}
          size={34}
          className={row.isYou ? '' : 'bg-border'}
          textClass={row.isYou ? 'text-gold' : 'text-muted'}
        />
      )}
      <p className={cx('min-w-0 flex-1 truncate text-[14px] font-semibold', row.isYou ? 'text-cardinal' : 'text-ink')}>
        {row.isYou && !large ? 'You' : row.name}
        {row.isYou && large && <span className="ml-2 text-[12px] font-semibold text-cardinal/70">You</span>}
      </p>
      {showStats && (
        <>
          <span className="w-[110px] text-right text-[13px] text-muted">{Math.round(row.checkinRate * 100)}% check-ins</span>
          <span className="w-[80px] text-right text-[13px] text-muted">{row.points} pts</span>
        </>
      )}
      <span className="w-[86px] shrink-0 text-right text-[13px] whitespace-nowrap text-muted">{row.streak} wk streak</span>
    </div>
  );
}
