'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, CalendarPlus, Check, CheckCircle2, MapPin, Sparkles } from 'lucide-react';
import { interestTerms, type CampusEvent, type EventsResponse, type MatchedEvent } from '@/lib/campus-events';
import { useApp } from '@/lib/store';
import { USE_MOCK } from '@/lib/api';
import { EVENT_ATTENDED_POINTS, EVENT_GOING_POINTS } from '@/lib/points';
import { Button, Chip, Modal, PageHeader, cx } from '@/components/ui';

function formatWhen(iso: string | null) {
  if (!iso) return 'Date to be announced';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
}

function EventCard({
  ev,
  matched,
  now,
  onAttend,
}: {
  ev: CampusEvent | MatchedEvent;
  matched?: boolean;
  now: number;
  onAttend: (ev: CampusEvent) => void;
}) {
  const hits = 'matchedOn' in ev ? ev.matchedOn : [];
  const log = useApp((s) => s.eventLog?.[ev.id]);
  const toggleGoing = useApp((s) => s.toggleGoing);
  // Attendance opens once the event has started. Demo mode skips the wait so
  // the flow can be shown live.
  const started = !ev.startsOn || Date.parse(ev.startsOn) <= now;
  const canAttend = started || USE_MOCK;

  return (
    <div
      className={cx(
        'flex min-w-0 flex-col gap-2 rounded-[20px] border p-[22px] transition hover:border-cardinal',
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
      <a
        href={ev.url}
        target="_blank"
        rel="noreferrer"
        className="group flex items-start justify-between gap-3 text-[17px] leading-[1.3] font-semibold text-ink hover:text-cardinal"
      >
        {ev.title}
        <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-muted group-hover:text-cardinal" />
      </a>
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

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {log?.attended ? (
          <Chip tone="success">
            <CheckCircle2 size={13} />
            You went · +{EVENT_ATTENDED_POINTS + EVENT_GOING_POINTS} XP earned
          </Chip>
        ) : (
          <>
            <button
              type="button"
              onClick={() => toggleGoing(ev)}
              aria-pressed={!!log?.going}
              className={cx(
                'inline-flex min-h-[38px] items-center gap-1.5 rounded-[10px] border px-3 text-[14px] font-semibold transition',
                log?.going
                  ? 'border-cardinal bg-cardinal text-white'
                  : 'border-border bg-surface text-ink hover:border-cardinal',
              )}
            >
              {log?.going ? <Check size={15} /> : <CalendarPlus size={15} />}
              {log?.going ? 'Going' : "I'm going"}
              <span className={cx('text-[12px]', log?.going ? 'text-white/85' : 'text-muted')}>+{EVENT_GOING_POINTS} XP</span>
            </button>
            <button
              type="button"
              onClick={() => onAttend(ev)}
              disabled={!canAttend}
              title={canAttend ? undefined : 'Opens once the event starts'}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3 text-[14px] font-semibold text-ink transition hover:border-cardinal disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={15} />I went
              <span className="text-[12px] text-muted">+{EVENT_ATTENDED_POINTS} XP</span>
            </button>
          </>
        )}
        <a href={ev.url} target="_blank" rel="noreferrer" className="ml-auto text-[14px] font-semibold text-cardinal hover:underline">
          View event
        </a>
      </div>
    </div>
  );
}

function AttendModal({ ev, onClose }: { ev: CampusEvent | null; onClose: () => void }) {
  const markAttended = useApp((s) => s.markAttended);
  const going = useApp((s) => (ev ? !!s.eventLog?.[ev.id]?.going : false));
  const [note, setNote] = useState('');
  const ok = note.trim().length >= 15;
  const xp = EVENT_ATTENDED_POINTS + (going ? 0 : EVENT_GOING_POINTS);

  const close = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal open={!!ev} onClose={close} title="Log your event">
      {ev && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ok) return;
            markAttended(ev, note);
            close();
          }}
        >
          <p className="text-[15px] font-semibold text-ink">{ev.title}</p>
          <label className="flex flex-col gap-2 text-[14px] text-muted">
            What&apos;s one thing you took away from it?
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              autoFocus
              placeholder="e.g. Learned how data centers limit how fast AI can scale, and met a Price PhD student working on energy policy."
              className="resize-none rounded-[12px] border border-border bg-bg p-3 text-[15px] text-ink outline-none focus:border-cardinal"
            />
          </label>
          <p className="text-[13px] text-muted">
            This becomes a draft line on your Resume page, so you can keep it or reword it later.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" type="button" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ok}>
              Claim +{xp} XP
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function ResourcesPage() {
  const interests = useApp((s) => s.answers.interests);
  const major = useApp((s) => s.answers.major);
  const pathwayTitle = useApp((s) => s.pathway?.title ?? '');
  const [data, setData] = useState<EventsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [attending, setAttending] = useState<CampusEvent | null>(null);
  const [now] = useState(() => Date.now());

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
        subtitle="Upcoming USC events, with the two that fit your path pinned at the top. Earn XP for going."
        actions={
          data && (
            <Chip tone={data.source === 'live' ? 'success' : 'neutral'}>
              {data.source === 'live' ? 'Live from calendar.usc.edu' : 'Saved events · USC calendar offline'}
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
                  <EventCard key={ev.id} ev={ev} matched now={now} onAttend={setAttending} />
                ))}
              </div>
            </section>
          )}

          {more.length > 0 && (
            <section className="flex flex-col gap-3">
              <p className="text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">More upcoming events</p>
              <div className="grid grid-cols-3 gap-5">
                {more.map((ev) => (
                  <EventCard key={ev.id} ev={ev} now={now} onAttend={setAttending} />
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
      <AttendModal ev={attending} onClose={() => setAttending(null)} />
    </>
  );
}
