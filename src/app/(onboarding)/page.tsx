'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/lib/store';
import type { PersonaId } from '@/data/mock';
import { Avatar, Button, Chip, cx } from '@/components/ui';
import { inputClass } from '@/components/OnboardingShell';

const DEMOS: { id: PersonaId; name: string; initials: string; desc: string; chip: string; tone: 'blue' | 'success'; bg: string }[] = [
  { id: 'maya', name: 'Maya Chen', initials: 'MC', desc: 'CS sophomore, wants ML engineering', chip: 'Software path', tone: 'blue', bg: 'bg-cardinal' },
  { id: 'daniel', name: 'Daniel Park', initials: 'DP', desc: 'Biology junior, pre-dental track', chip: 'Health path', tone: 'success', bg: 'bg-success' },
];

const HOW = [
  { title: 'Answer four quick questions', body: 'Who you are, where you are headed, and how much time you have.' },
  { title: 'Get a path built for you', body: 'Stages and tasks drawn from real USC resources.' },
  { title: 'Check in every Sunday', body: 'Two minutes, and next week adjusts to you.' },
];

export default function WelcomePage() {
  const router = useRouter();
  const startFresh = useApp((s) => s.startFresh);
  const setAnswers = useApp((s) => s.setAnswers);
  const loadPersona = useApp((s) => s.loadPersona);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    startFresh();
    const clean = email.trim();
    const first = clean ? clean.split('@')[0].replace(/[._\d]+/g, ' ').trim().split(' ')[0] : '';
    setAnswers({ email: clean, name: first ? first[0].toUpperCase() + first.slice(1) : '' });
    router.push('/onboarding/about');
  };

  const demo = (id: PersonaId) => {
    setLoading(id);
    loadPersona(id);
    router.push('/path');
  };

  return (
    <div className="flex flex-1 flex-col justify-center py-6">
      <div>
        <Chip tone="gold">Built for USC students</Chip>
      </div>
      <h2 className="mt-5 font-display text-[44px] leading-[1.1] font-bold text-ink">Welcome to Trojan Path</h2>
      <p className="mt-3 text-[16px] text-muted">
        Sign in with your USC account to build your path. Four quick steps, then your first week of tasks.
      </p>

      <form onSubmit={signIn} className="mt-8 rounded-[20px] border border-border bg-surface p-6">
        <label htmlFor="email" className="text-[14px] font-semibold text-ink">
          USC email
        </label>
        <div className="mt-3 flex gap-3">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ttrojan@usc.edu"
            className={inputClass}
          />
          <Button type="submit" className="shrink-0">
            Continue with USC NetID
          </Button>
        </div>
        <p className="mt-3 text-[13px] text-muted">We only use your account to save your path.</p>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[13px] text-muted">or try a demo student</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {DEMOS.map((d) => (
          <button
            key={d.id}
            onClick={() => demo(d.id)}
            disabled={!!loading}
            className={cx(
              'group flex items-center gap-4 rounded-[20px] border border-border bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cardinal/40 hover:shadow-[0_10px_24px_rgba(28,22,22,0.07)]',
              loading === d.id && 'border-cardinal',
            )}
          >
            <Avatar initials={d.initials} size={48} className={d.bg} textClass={d.id === 'maya' ? 'text-gold' : 'text-white'} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[16px] font-semibold text-ink">{d.name}</p>
              <p className="text-[13px] text-muted">{d.desc}</p>
              <div className="mt-1">
                <Chip tone={d.tone}>{d.chip}</Chip>
              </div>
            </div>
            <ArrowRight size={18} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-3 gap-8">
        {HOW.map((h, i) => (
          <div key={h.title} className="flex flex-col gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-cardinal-soft text-[13px] font-bold text-cardinal">{i + 1}</span>
            <p className="mt-1 text-[15px] font-semibold text-ink">{h.title}</p>
            <p className="text-[13px] leading-[1.5] text-muted">{h.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
