'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ClimbCard } from '@/components/ClimbCard';
import { Button, Card, Chip, Eyebrow, PageHeader, Progress } from '@/components/ui';
import { RESOURCE_TONE } from '@/lib/labels';

function stageProgress(timing: string): number {
  const m = timing.match(/Week (\d+) of (\d+)/);
  return m ? Number(m[1]) / Number(m[2]) : 0.15;
}

export default function PathwayPage() {
  const pathway = useApp((s) => s.pathway)!;
  const profile = useApp((s) => s.profile);
  const xp = useApp((s) => s.totalPoints);
  const advanceStage = useApp((s) => s.advanceStage);
  const [showAll, setShowAll] = useState(false);

  const current = pathway.stages.find((s) => s.status === 'current') ?? pathway.stages[0];
  const created = new Date(pathway.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const resources = showAll ? pathway.resources : pathway.resources.slice(0, 3);
  const weekChip = current.timing.match(/Week \d+ of \d+/)?.[0] ?? current.timing;

  return (
    <>
      <PageHeader
        eyebrow="Your pathway"
        title={pathway.title}
        subtitle={`Built from your intake on ${created} · grounded in ${pathway.resources.length} USC resources`}
        actions={
          <>
            <Button variant="secondary" href="/onboarding/goals">
              Retake intake
            </Button>
            <Button href="/week">See this week</Button>
          </>
        }
      />

      <div className="flex min-h-[640px] w-full flex-1 items-stretch gap-6">
        <div className="min-w-[500px] flex-[0_1_640px]">
          <ClimbCard pathway={pathway} initials={profile?.initials ?? 'ME'} xp={xp} onAdvance={advanceStage} />
        </div>

        <div className="flex min-w-[340px] flex-1 flex-col gap-[14px]">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Eyebrow>Current stage</Eyebrow>
              <Chip tone="gold">{weekChip}</Chip>
            </div>
            <p key={current.name} className="animate-fade-in font-display text-[24px] font-bold text-ink">
              {current.name}
            </p>
            <p className="text-[15px] leading-[1.45] text-muted">{current.description}</p>
            <Progress value={stageProgress(current.timing)} />
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-cardinal" fill="currentColor" strokeWidth={1.5} />
              <p className="text-[16px] font-semibold text-ink">Why this path</p>
            </div>
            <p className="text-[14px] leading-[1.5] text-ink">{pathway.why}</p>
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted">GROUNDED IN USC RESOURCES</p>
            <div className="flex flex-col gap-2">
              {resources.map((r) => {
                const t = RESOURCE_TONE[r.type];
                const inner = (
                  <>
                    <Chip tone={t.tone}>{t.label}</Chip>
                    <span className="min-w-0 flex-1 text-[14px] font-medium text-ink">{r.name}</span>
                  </>
                );
                return r.link ? (
                  <a
                    key={r.id}
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-[10px] rounded-[12px] bg-bg px-3 py-[10px] hover:bg-cardinal-soft/40"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={r.id} className="flex items-center gap-[10px] rounded-[12px] bg-bg px-3 py-[10px]">
                    {inner}
                  </div>
                );
              })}
            </div>
            {pathway.resources.length > 3 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="self-start text-[13px] font-semibold text-cardinal hover:underline"
              >
                {showAll ? 'Show fewer' : `Show all ${pathway.resources.length} resources`}
              </button>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-semibold text-ink">Trojans who took this path</p>
              <Chip tone="neutral">Coming next</Chip>
            </div>
            <div className="flex items-center gap-[14px]">
              <div className="flex shrink-0">
                {[
                  ['PR', 'bg-blue'],
                  ['DK', 'bg-success'],
                  ['SL', 'bg-cardinal'],
                ].map(([i, bg], n) => (
                  <span
                    key={i}
                    className={`flex size-9 items-center justify-center rounded-full border-2 border-white text-[12px] font-bold text-white ${bg}`}
                    style={{ marginLeft: n ? -10 : 0 }}
                  >
                    {i}
                  </span>
                ))}
              </div>
              <p className="text-[13px] leading-[1.4] text-muted">
                Now at Snap, Google, and a robotics startup. Alumni Connect launches in spring.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
