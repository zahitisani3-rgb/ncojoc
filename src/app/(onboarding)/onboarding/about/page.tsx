'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, X } from 'lucide-react';
import type { School } from '@/types';
import { useApp } from '@/lib/store';
import { Button, cx } from '@/components/ui';
import { FieldLabel, Pill, StepError, StepFrame, inputClass } from '@/components/OnboardingShell';

const SCHOOLS: School[] = ['Viterbi', 'Dornsife', 'Marshall', 'Annenberg', 'Thornton', 'Other'];
const EXPERIENCE = ['Joined a club', 'Class project', 'Research', 'Internship', 'Part time job', 'Volunteering', 'Nothing yet'];

export default function AboutPage() {
  const router = useRouter();
  const answers = useApp((s) => s.answers);
  const setAnswers = useApp((s) => s.setAnswers);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleExp = (x: string) => {
    const has = answers.experience.includes(x);
    if (x === 'Nothing yet') return setAnswers({ experience: has ? [] : ['Nothing yet'] });
    const rest = answers.experience.filter((e) => e !== 'Nothing yet');
    setAnswers({ experience: has ? rest.filter((e) => e !== x) : [...rest, x] });
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setAnswers({ resumeFileName: f.name });
  };

  const next = () => {
    if (!answers.name.trim()) return setError('Add the name you want us to use.');
    if (!/^\S+@\S+\.\S+$/.test(answers.email.trim())) return setError('Add your USC email so we can save your path.');
    if (!answers.school) return setError('Pick your school.');
    setError(null);
    router.push('/onboarding/goals');
  };

  return (
    <StepFrame
      step={1}
      title="Tell us about you"
      subtitle="Your path starts from where you are now, not from zero."
      footer={
        <>
          <Button variant="secondary" href="/">
            Back
          </Button>
          <div className="flex items-center gap-5">
            <StepError message={error} />
            {!error && <span className="text-[13px] text-muted">About 3 minutes left</span>}
            <Button onClick={next}>Continue</Button>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_1.6fr] gap-5">
        <div>
          <FieldLabel htmlFor="name">Preferred name</FieldLabel>
          <input id="name" className={inputClass} value={answers.name} onChange={(e) => setAnswers({ name: e.target.value })} placeholder="Tommy" />
        </div>
        <div>
          <FieldLabel htmlFor="email">USC email</FieldLabel>
          <input
            id="email"
            type="email"
            className={inputClass}
            value={answers.email}
            onChange={(e) => setAnswers({ email: e.target.value })}
            placeholder="ttrojan@usc.edu"
          />
        </div>
      </div>

      <div>
        <FieldLabel>School</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SCHOOLS.map((s) => (
            <Pill key={s} selected={answers.school === s} onClick={() => setAnswers({ school: s })}>
              {s}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel hint="Pick all that apply">What have you done so far?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE.map((x) => (
            <Pill key={x} selected={answers.experience.includes(x)} onClick={() => toggleExp(x)}>
              {x}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel hint="Optional">Have a resume?</FieldLabel>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFile(e.dataTransfer.files?.[0]);
          }}
          className={cx(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed px-6 py-8 text-center transition-colors',
            dragging ? 'border-cardinal bg-cardinal-soft/50' : 'border-border bg-surface hover:border-cardinal/40',
          )}
        >
          {answers.resumeFileName ? (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-success-soft text-success">
                <FileText size={18} />
              </span>
              <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                {answers.resumeFileName}
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnswers({ resumeFileName: undefined });
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="rounded p-0.5 text-muted hover:bg-bg hover:text-ink"
                >
                  <X size={16} />
                </button>
              </p>
              <p className="text-[13px] text-muted">Attached. We will use it to prefill your path.</p>
            </>
          ) : (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-cardinal-soft text-cardinal">
                <Upload size={18} />
              </span>
              <p className="text-[15px] font-semibold text-ink">Drop your resume here, or browse</p>
              <p className="text-[13px] text-muted">PDF or DOCX. We only use it to prefill your path.</p>
            </>
          )}
        </div>
      </div>
    </StepFrame>
  );
}
