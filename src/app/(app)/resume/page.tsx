'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Sparkles } from 'lucide-react';
import type { ResumeEntry, ResumeItem } from '@/types';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Button, Chip, Modal, PageHeader, cx, type ChipTone } from '@/components/ui';

const SECTIONS: ResumeEntry['section'][] = ['Education', 'Projects', 'Activities', 'Skills'];
const SECTION_TONE: Record<ResumeEntry['section'], ChipTone> = {
  Education: 'blue',
  Projects: 'blue',
  Activities: 'blue',
  Skills: 'blue',
};

interface Line {
  text: string;
  isNew: boolean;
}
interface PreviewItem {
  title: string;
  date?: string;
  lines: Line[];
  isNew: boolean;
}

/** Merge the existing resume with approved entries, newest highlighted. */
function buildPreview(items: ResumeItem[], approved: ResumeEntry[], recent: string[]) {
  const out: Record<string, PreviewItem[]> = {};
  for (const sec of SECTIONS) {
    out[sec] = items.filter((i) => i.section === sec).map((i) => ({ ...i, isNew: false, lines: i.bullets.map((b) => ({ text: b, isNew: false })) }));
  }
  for (const e of approved) {
    const isNew = recent.includes(e.id);
    const list = out[e.section];
    const standalone = e.title && (e.section === 'Projects' || e.section === 'Activities');
    if (standalone) {
      list.unshift({ title: e.title!, date: 'Fall 2026', isNew, lines: [{ text: e.text, isNew }] });
    } else if (list.length) {
      list[0].lines.push({ text: e.text, isNew });
    } else {
      list.push({ title: e.section === 'Skills' ? 'Technical' : e.title ?? e.section, isNew, lines: [{ text: e.text, isNew }] });
    }
  }
  return out;
}

function EntryCard({ entry, onApprove }: { entry: ResumeEntry; onApprove: (text: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.text);
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await onApprove(text.trim());
  };

  return (
    <div className="animate-fade-in flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-[18px]">
      <div className="flex items-center justify-between">
        <Chip tone={SECTION_TONE[entry.section]}>{entry.section}</Chip>
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          <Sparkles size={13} fill="currentColor" strokeWidth={1.5} /> AI draft
        </span>
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-[12px] border-[1.5px] border-cardinal/50 bg-bg px-3 py-2.5 text-[15px] leading-[1.5] text-ink outline-none"
        />
      ) : (
        <p className="text-[15px] leading-[1.5] text-ink">
          {entry.section === 'Skills' && <span className="text-muted">Add to skills: </span>}
          {text}
        </p>
      )}
      <p className="text-[13px] text-muted">From {entry.source}</p>
      <div className="flex gap-2">
        <button
          onClick={approve}
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-cardinal px-[14px] py-[8px] text-[13px] font-semibold text-white transition-colors hover:bg-cardinal-dark disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          {editing ? 'Save and approve' : 'Approve'}
        </button>
        <button
          onClick={() => {
            if (editing) setText(entry.text);
            setEditing((v) => !v);
          }}
          className="rounded-full border-[1.5px] border-border bg-surface px-[14px] py-[7px] text-[13px] font-semibold text-ink hover:border-muted/40"
        >
          {editing ? 'Cancel' : 'Edit wording'}
        </button>
      </div>
    </div>
  );
}

export default function ResumePage() {
  const userId = useApp((s) => s.userId);
  const profile = useApp((s) => s.profile)!;
  const resume = useApp((s) => s.resume);
  const base = useApp((s) => s.resumeBase);
  const recent = useApp((s) => s.recentlyApproved);
  const setResume = useApp((s) => s.setResume);
  const approveEntry = useApp((s) => s.approveEntry);

  const [postOpen, setPostOpen] = useState(false);
  const [post, setPost] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch drafts from the API if this student has none cached yet.
  useEffect(() => {
    if (resume.length === 0) {
      api.getResumeEntries(userId).then((entries) => entries.length && setResume(entries));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const pending = resume.filter((e) => e.status === 'pending');
  const approved = resume.filter((e) => e.status === 'approved');
  const preview = buildPreview(base.items, approved, recent);

  const onApprove = async (id: string, text: string) => {
    await api.approveResumeEntry(id, text);
    approveEntry(id, text);
  };

  const draftPost = async () => {
    setPostOpen(true);
    setPost(null);
    setCopied(false);
    const source = approved.length ? approved : resume;
    const fromBase: ResumeEntry[] = base.items
      .filter((i) => i.section !== 'Education')
      .map((i, n) => ({ id: `base-${n}`, section: i.section, text: i.bullets[0] ?? i.title, source: 'Resume', status: 'approved' }));
    setPost(await api.draftLinkedInPost([...source, ...fromBase]));
  };

  const copy = async () => {
    if (!post) return;
    try {
      await navigator.clipboard.writeText(post);
    } catch {
      /* clipboard can be blocked; the text is still selectable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <PageHeader
        eyebrow="Auto-updating resume"
        title="Your resume, always current"
        subtitle="Every task you log becomes a draft entry. You approve every line."
        actions={
          <>
            <Button variant="secondary" onClick={draftPost}>
              Draft LinkedIn post
            </Button>
            <Button onClick={() => window.print()}>Export PDF</Button>
          </>
        }
      />

      <div className="flex w-full flex-1 items-start gap-7">
        <div className="flex w-[372px] shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-semibold text-ink">New entries to review</p>
            <Chip tone="cardinal">{pending.length} new</Chip>
          </div>
          {pending.map((e) => (
            <EntryCard key={e.id} entry={e} onApprove={(text) => onApprove(e.id, text)} />
          ))}
          {pending.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-border bg-surface px-6 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-success-soft text-success">
                <Check size={20} strokeWidth={3} />
              </span>
              <p className="text-[15px] font-semibold text-ink">All caught up</p>
              <p className="text-[13px] leading-[1.5] text-muted">
                Finish a major task and check in. New draft lines show up here for you to review.
              </p>
            </div>
          )}
        </div>

        <article className="print-paper min-w-0 flex-1 rounded-[4px] bg-white px-12 py-10 shadow-[0_12px_40px_rgba(28,22,22,0.08),0_1px_3px_rgba(28,22,22,0.06)]">
          <h2 className="font-display text-[30px] font-bold text-ink">{profile.name}</h2>
          <p className="mt-1 text-[13px] text-muted">
            {base.headline}
            {profile.email ? ` · ${profile.email}` : ''}
          </p>
          {SECTIONS.map((sec) =>
            preview[sec].length ? (
              <section key={sec} className="mt-6">
                <h3 className="border-b border-border pb-2 text-[12px] font-semibold tracking-[0.1em] text-cardinal uppercase">{sec}</h3>
                <div className="mt-3 flex flex-col gap-3">
                  {preview[sec].map((item, i) => (
                    <div key={`${item.title}-${i}`} className={item.isNew ? 'animate-fade-in' : ''}>
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                          {item.title}
                          {item.isNew && (
                            <Chip tone="goldSolid" className="no-print">
                              New
                            </Chip>
                          )}
                        </p>
                        {item.date && <p className="shrink-0 text-[13px] text-muted">{item.date}</p>}
                      </div>
                      <ul className="mt-1 flex flex-col gap-1">
                        {item.lines.map((l, j) => (
                          <li
                            key={j}
                            className={cx(
                              'print-plain rounded-[6px] text-[14px] leading-[1.5] text-ink',
                              l.isNew && 'animate-fade-in -mx-2 bg-gold-soft px-2 py-1',
                            )}
                          >
                            <span className="mr-2">•</span>
                            {l.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </article>
      </div>

      <Modal open={postOpen} onClose={() => setPostOpen(false)} title="Draft LinkedIn post" width="w-[600px]">
        {post === null ? (
          <div className="flex items-center gap-3 py-10 text-[15px] text-muted">
            <Loader2 size={18} className="animate-spin" /> Writing a draft from your approved entries…
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <textarea
              value={post}
              onChange={(e) => setPost(e.target.value)}
              rows={11}
              className="w-full resize-none rounded-[14px] border border-border bg-bg px-4 py-3 text-[14px] leading-[1.6] text-ink outline-none focus:border-cardinal/50"
            />
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted">Review before posting. Nothing is shared automatically.</p>
              <Button onClick={copy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
