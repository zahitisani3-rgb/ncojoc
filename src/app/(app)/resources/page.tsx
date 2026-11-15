'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { interestTerms, type CampusEvent, type EventsResponse, type MatchedEvent } from '@/lib/campus-events';
import { useApp } from '@/lib/store';
import { Chip, PageHeader, cx } from '@/components/ui';

function formatWhen(iso: string | null) {
  if (!iso) return 'Date to be announced';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function EventCard({ ev, matched }: { ev: CampusEvent | MatchedEvent; matched?: boolean }) {
  const hits = 'matchedOn' in ev ? ev.matchedOn : [];
  return (
    <a
      href={ev.url}
      target="_blank"
      rel="noreferrer"
      className={cx(
        'group flex min-w-0 flex-col gap-2 rounded-[20px] border p-[22px] transition hover:-translate-y-0.5 hover:border-cardinal',
        matched ? 'border-gold bg-gold-soft' : 'border-border bg-surface',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {matched && (
          <Chip tone="goldSolid">
            <Sparkles size={12} />
            Matched to your path
          </Chip>
        )}
        {ev.sample && <Chip tone="neutral">Sample</Chip>}
        {ev.categories.slice(0, 2).map((c) => (
          <Chip key={c} tone="white">
            {c}
          </Chip>
        ))}
      </div>
      <p className="flex items-start justify-between gap-3 text-[17px] leading-[1.3] font-semibold text-ink">
        {ev.title}
        <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-muted group-hover:text-cardinal" />
      </p>
      <div className="flex flex-col gap-1 text-[14px] text-muted">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={14} /> {formatWhen(ev.startsOn)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={14} /> {ev.location}
        </span>
        {ev.org && <span>{ev.org}</span>}
      </div>
      {matched && hits.length > 0 ? (
        <p className="text-[14px] font-medium text-cardinal">Picked because your path includes {hits.join(', ')}.</p>
      ) : (
        ev.description && <p className="line-clamp-2 text-[14px] leading-[1.5] text-muted">{ev.description}</p>
      )}
      <span className="mt-auto pt-1 text-[14px] font-semibold text-cardinal">View event</span>
    </a>
  );
}

export default function ResourcesPage() {
  const interests = useApp((s) => s.answers.interests);
  const major = useApp((s) => s.answers.major);
  const pathwayTitle = useApp((s) => s.pathway?.title ?? '');
  const [data, setData] = useState<EventsResponse | null>(null);
  const [failed, setFailed] = useState(false);

  const terms = useMemo(() => interestTerms(interests, major, pathwayTitle), [interests, major, pathwayTitle]);

  useEffect(() => {
    let live = true;
    fetch(`/api/events?count=2&terms=${encodeURIComponent(terms.join(','))}`)
      .then((r) => (r.ok ? (r.json() as Promise<EventsResponse>) : Promise.reject(new Error(String(r.status)))))
      .then((d) => live && setData(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [terms]);

  const matchedIds = new Set(data?.matched.map((e) => e.id));
  const more = data?.events.filter((e) => !matchedIds.has(e.id)).slice(0, 9) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Campus resources"
        title="Happening at USC"
        subtitle="Upcoming USC events, with the two that fit your path pinned at the top."
        actions={
          data && (
            <Chip tone={data.source === 'live' ? 'success' : 'neutral'}>
              {data.source === 'live' ? 'Live from calendar.usc.edu' : 'USC calendar offline · sample data'}
            </Chip>
          )
        }
      />

      {failed && <p className="text-[14px] text-muted">Couldn&apos;t load campus events right now. Try again in a minute.</p>}

      {!data && !failed && (
        <div className="grid w-full grid-cols-2 gap-5">
          {[0, 1].map((i) => (
            <div key={i} className="h-[220px] animate-pulse rounded-[20px] bg-surface" />
          ))}
        </div>
      )}

      {data && (
        <div className="flex w-full flex-col gap-8">
          {data.matched.length > 0 && (
            <section className="flex flex-col gap-3">
              <p className="text-[13px] font-semibold tracking-[0.08em] text-cardinal uppercase">For you this week</p>
              <div className="grid grid-cols-2 gap-5">
                {data.matched.map((ev) => (
                  <EventCard key={ev.id} ev={ev} matched />
                ))}
              </div>
            </section>
          )}

          {more.length > 0 && (
            <section className="flex flex-col gap-3">
              <p className="text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">More upcoming events</p>
              <div className="grid grid-cols-3 gap-5">
                {more.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          )}

          <p className="text-[12px] text-muted">
            Events come from USC&apos;s public event calendar (calendar.usc.edu) and refresh about once an hour. For club events, browse engageSC directly. Check the event page for RSVP
            details. TrojanPath is an independent student project.
          </p>
        </div>
      )}
    </>
  );
}
