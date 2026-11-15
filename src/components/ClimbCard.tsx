'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronsUp } from 'lucide-react';
import type { Pathway, Theme } from '@/types';
import { levelFor } from '@/lib/points';
import { Progress, cx } from './ui';

// Scene coordinates match the Figma "Climb" frame (640 x 699).
const W = 640;
const H = 699;

/** Stage centers, bottom to top, zigzagging up the mountain. */
const POINTS: [number, number][] = [
  [109, 598],
  [429, 488],
  [199, 368],
  [449, 243],
  [299, 108],
];
/** Which side of the marker each label sits on. */
const LABEL_SIDE: ('right' | 'left')[] = ['right', 'left', 'right', 'left', 'right'];

const THEMES: Record<Theme, { from: string; to: string; back: string; front: string; chip: string; label: string }> = {
  software: { from: '#FCF7ED', to: '#E5EDFA', back: '#ECE1D1', front: '#E3D5C1', chip: 'bg-blue-soft text-blue', label: 'Software theme' },
  health: { from: '#F8FBF3', to: '#DCEFE2', back: '#CFE5D4', front: '#BBD8C3', chip: 'bg-success-soft text-success', label: 'Health theme' },
  music: { from: '#FBF7FC', to: '#E9E1F7', back: '#DED2F0', front: '#CDBFE6', chip: 'bg-[#EFE8FA] text-[#6A4CA3]', label: 'Music theme' },
};

/** Smooth Catmull-Rom curve through the stage points, as cubic Beziers. */
function trailPath(pts: [number, number][]): string {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const k = 1 / 5;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const TRAIL = trailPath(POINTS);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function ClimbCard({
  pathway,
  initials,
  xp,
  onAdvance,
}: {
  pathway: Pathway;
  initials: string;
  xp: number;
  onAdvance?: () => void;
}) {
  const theme = THEMES[pathway.theme] ?? THEMES.software;
  const stages = pathway.stages.slice(0, POINTS.length);
  const currentIdx = Math.max(0, stages.findIndex((s) => s.status === 'current'));
  const nextStage = stages[currentIdx + 1];
  const level = levelFor(xp);

  // ---- Fit the fixed-size scene into the card.
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.min(width / W, height / H, 1.15));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- Lengths along the trail for each stage.
  const pathRef = useRef<SVGPathElement>(null);
  const solidRef = useRef<SVGPathElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [lengths, setLengths] = useState<number[] | null>(null);
  useLayoutEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const total = p.getTotalLength();
    const out = POINTS.map(([x, y], i) => {
      if (i === 0) return 0;
      if (i === POINTS.length - 1) return total;
      let best = 0;
      let bestD = Infinity;
      for (let l = 0; l <= total; l += 1) {
        const pt = p.getPointAtLength(l);
        const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = l;
        }
      }
      return best;
    });
    setLengths(out);
  }, []);

  // ---- Animate the avatar (and the solid trail) to the current stage.
  const distRef = useRef(0);
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    if (!lengths) return;
    const p = pathRef.current;
    const target = lengths[currentIdx];
    const from = distRef.current;
    const place = (d: number) => {
      if (!p) return;
      const pt = p.getPointAtLength(d);
      if (avatarRef.current) {
        avatarRef.current.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
      }
      if (solidRef.current) solidRef.current.style.strokeDasharray = `${d} 4000`;
      distRef.current = d;
    };
    if (Math.abs(target - from) < 0.5) {
      place(target);
      return;
    }
    const duration = Math.min(2600, 900 + Math.abs(target - from) * 2.2);
    let raf = 0;
    let start = 0;
    const delay = from === 0 ? 350 : 0;
    const timer = setTimeout(() => {
      setMoving(true);
      const tick = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        place(from + (target - from) * ease(t));
        if (t < 1) raf = requestAnimationFrame(tick);
        else setMoving(false);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    place(from);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      setMoving(false);
    };
  }, [lengths, currentIdx]);

  return (
    <div
      ref={cardRef}
      className="relative h-full min-h-[600px] w-full overflow-hidden rounded-[24px] border border-border transition-[background] duration-700"
      style={{ background: `linear-gradient(to bottom, ${theme.from}, ${theme.to})` }}
    >
      {/* Mountains */}
      <svg
        className="absolute bottom-0 left-0 h-[46%] w-full"
        viewBox="0 0 640 320"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 178 L70 120 L110 92 L165 30 L205 58 L245 96 L300 66 L340 80 L420 8 L470 52 L520 98 L585 62 L640 90 L640 320 L0 320 Z"
          fill={theme.back}
          className="transition-[fill] duration-700"
        />
        <path
          d="M0 236 L60 204 L120 172 L200 210 L260 168 L320 132 L390 172 L440 196 L540 150 L600 168 L640 182 L640 320 L0 320 Z"
          fill={theme.front}
          className="transition-[fill] duration-700"
        />
      </svg>

      {/* Scaled scene in Figma coordinates */}
      <div
        className="absolute bottom-0 left-1/2 origin-bottom"
        style={{ width: W, height: H, transform: `translateX(-50%) scale(${scale})` }}
      >
        <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
          <path
            ref={pathRef}
            d={TRAIL}
            stroke="#CDBFAE"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="0.1 13"
          />
          <path
            ref={solidRef}
            d={TRAIL}
            stroke="#990000"
            strokeWidth={5}
            strokeLinecap="round"
            style={{ strokeDasharray: '0 4000' }}
          />
        </svg>

        {stages.map((s, i) => {
          const [x, y] = POINTS[i];
          const isCurrent = i === currentIdx;
          const done = s.status === 'done';
          const r = isCurrent ? 38 : done ? 22 : 20;
          const side = LABEL_SIDE[i];
          return (
            <div key={s.name + i}>
              {!isCurrent && (
                <div
                  className={cx(
                    'absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-500',
                    done
                      ? 'size-11 border-4 border-white bg-cardinal text-white'
                      : 'size-10 border-[3px] border-border bg-surface text-[14px] font-bold text-muted',
                  )}
                  style={{ left: x, top: y }}
                >
                  {done ? <Check size={18} strokeWidth={3} /> : i + 1}
                </div>
              )}
              <div
                className="absolute flex -translate-y-1/2 flex-col gap-[2px] rounded-[10px] bg-surface px-[10px] py-[6px] whitespace-nowrap shadow-[0_1px_2px_rgba(28,22,22,0.04)]"
                style={
                  side === 'right'
                    ? { left: x + r + 14, top: y - 4 }
                    : { right: W - (x - r - 12), top: y - 4 }
                }
              >
                <p className="text-[16px] leading-[normal] font-semibold text-ink">{s.name}</p>
                <p className={cx('text-[13px] leading-[normal]', isCurrent ? 'text-cardinal' : 'text-muted')}>{s.timing}</p>
              </div>
            </div>
          );
        })}

        {/* Level card */}
        <div className="absolute top-[23px] left-[23px] z-20 flex flex-col gap-2 rounded-[16px] bg-surface p-[18px]">
          <div>
            <span className={cx('inline-flex rounded-full px-[10px] py-[4px] text-[12px] font-semibold', theme.chip)}>{theme.label}</span>
          </div>
          <p className="font-display text-[18px] font-bold text-ink">
            Level {level.level} · {level.name}
          </p>
          <p className="text-[13px] text-muted">
            {xp} of {level.nextAt} XP{nextStage ? ` to reach ${nextStage.name}` : ' to the next level'}
          </p>
          <Progress value={level.pct} className="w-[210px]" />
        </div>

        {/* The climber */}
        <div
          ref={avatarRef}
          className="absolute top-0 left-0 z-10"
          style={{ transform: `translate(${POINTS[0][0]}px, ${POINTS[0][1]}px)` }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <span className="absolute -top-[34px] left-1/2 -translate-x-1/2 rounded-full bg-gold px-[10px] py-[5px] text-[12px] leading-[normal] font-bold whitespace-nowrap text-ink shadow-[0_2px_6px_rgba(28,22,22,0.08)]">
              You are here
            </span>
            <span
              className={cx(
                'flex size-[76px] items-center justify-center rounded-full border-[5px] border-gold bg-cardinal font-display text-[24px] font-bold text-gold shadow-[0_8px_20px_rgba(153,0,0,0.25)] transition-transform duration-300',
                moving && 'scale-105',
              )}
            >
              {initials}
            </span>
          </div>
        </div>
      </div>

      {onAdvance && currentIdx < stages.length - 1 && (
        <button
          onClick={onAdvance}
          disabled={moving}
          className="absolute right-4 bottom-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-[12px] font-semibold text-muted backdrop-blur transition hover:bg-white hover:text-cardinal disabled:opacity-50"
          title="Demo control: mark this stage complete"
        >
          <ChevronsUp size={14} /> Demo: finish stage
        </button>
      )}
    </div>
  );
}
