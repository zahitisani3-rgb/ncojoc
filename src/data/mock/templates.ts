import type { Interest, OnboardingAnswers, Pathway, Task, Theme } from '@/types';
import { maya } from './maya';
import { daniel } from './daniel';

// Templates used by the mock generatePathway() for students who finish
// onboarding (not the two demo personas).
// TODO(resources): music resource names are placeholders to verify.

type TaskSeed = Omit<Task, 'id' | 'done' | 'points'>;

export interface PathTemplate {
  theme: Theme;
  title: string;
  base: Pathway;
  firstWeek: TaskSeed[];
  /** Tasks the mock adjust_week draws from for later weeks. */
  pool: TaskSeed[];
  whyTail: string;
}

const softwareFirst: TaskSeed[] = [
  { title: 'Skim the CSCI 467 syllabus and star one topic', tier: 'quick', resource_id: 101, resource_name: 'CSCI 467', why: 'Know what the ML course covers before you register for spring.' },
  { title: 'Attend a CAIS++ info session', tier: 'standard', resource_id: 102, resource_name: 'CAIS++', why: 'Student project teams are the fastest way to real ML work.' },
  { title: 'Train a tiny model in a starter notebook', tier: 'major', resource_id: 101, resource_name: 'CSCI 467', why: 'One working model beats ten tutorials you only watched.' },
  { title: 'Bookmark three ML internships on Handshake', tier: 'quick', resource_id: 108, resource_name: 'Handshake', why: 'See what skills the postings ask for so you can plan backwards.' },
];

const softwarePool: TaskSeed[] = [
  { title: 'Go to an ACM at USC project night', tier: 'standard', resource_id: 109, resource_name: 'ACM at USC', why: 'Meet people already building things you want to build.' },
  { title: 'Book a resume review at Career Connections', tier: 'quick', resource_id: 107, resource_name: 'Career Connections', why: 'A 20 minute review now saves a rewrite before the career fair.' },
  { title: 'Rebuild one homework problem as a notebook demo', tier: 'major', resource_id: 101, resource_name: 'CSCI 467', why: 'Turns coursework into something you can show.' },
  { title: 'Ask a CURVE mentor about undergrad research', tier: 'standard', resource_id: 112, resource_name: 'CURVE', why: 'Research is a strong route to ML experience before junior year.' },
  { title: 'Attend an AI@USC speaker talk', tier: 'standard', resource_id: 118, resource_name: 'AI@USC', why: 'Hear what ML engineers actually do day to day.' },
  { title: 'Solve two array problems before Friday', tier: 'quick', resource_id: 114, resource_name: 'Interview workshops', why: 'Small, steady interview prep keeps it from piling up.' },
  { title: 'Ship one small feature for your club project', tier: 'major', resource_id: 102, resource_name: 'CAIS++', why: 'Shipped features become resume bullets.' },
  { title: 'Sign up for HackSC and find a teammate', tier: 'standard', resource_id: 111, resource_name: 'HackSC', why: 'A weekend build is a quick portfolio piece.' },
];

const healthFirst: TaskSeed[] = [
  { title: 'Book an intro meeting with Pre-Health Advisement', tier: 'standard', resource_id: 202, resource_name: 'Pre-Health Advisement', why: 'An advisor maps your prerequisites to a realistic timeline.' },
  { title: 'Join the Pre-Dental Society mailing list', tier: 'quick', resource_id: 204, resource_name: 'Pre-Dental Society', why: 'Shadowing leads and study groups are shared there first.' },
  { title: 'Apply for the Ostrow shadowing program', tier: 'major', resource_id: 201, resource_name: 'Ostrow shadowing', why: 'Shadowing hours take months to build, so start now.' },
  { title: 'Start a shadowing and service hours log', tier: 'quick', resource_id: 202, resource_name: 'Pre-Health Advisement', why: 'Schools ask for exact hours. Tracking now avoids guessing later.' },
];

const healthPool: TaskSeed[] = [
  { title: 'Volunteer a shift with the Mobile Dental Clinic', tier: 'standard', resource_id: 203, resource_name: 'Mobile Dental Clinic', why: 'Service plus patient contact in one shift.' },
  { title: 'Do one DAT biology practice set', tier: 'quick', resource_id: 208, resource_name: 'DAT study group', why: 'Twenty minutes keeps content warm.' },
  { title: 'Shadow a clinician for a half day', tier: 'major', resource_id: 201, resource_name: 'Ostrow shadowing', why: 'Hours are the biggest gap on most pre-health timelines.' },
  { title: 'Go to the pre-health application workshop', tier: 'standard', resource_id: 211, resource_name: 'Career Center', why: 'Learn what a strong application looks like early.' },
  { title: 'Tutor one session with JEP', tier: 'standard', resource_id: 210, resource_name: 'JEP', why: 'Teaching shows communication skills admissions look for.' },
  { title: 'Write a short reflection on your last clinic visit', tier: 'quick', resource_id: 202, resource_name: 'Pre-Health Advisement', why: 'Notes now make the personal statement easier later.' },
];

const music: Pathway = {
  id: 'pw-music',
  title: 'Music Producer',
  theme: 'music',
  why: '',
  created_at: '',
  stages: [
    { name: 'Explore', timing: 'Week 1 of 2', status: 'current', description: 'Try production, songwriting, and engineering to find your lane.' },
    { name: 'Build Craft', timing: 'Weeks 3 to 8', status: 'next', description: 'Daily DAW reps and one finished track every two weeks.' },
    { name: 'Portfolio', timing: 'Spring 2027', status: 'next', description: 'A five track portfolio with credits you can share.' },
    { name: 'Experience', timing: 'Summer 2027', status: 'next', description: 'Studio assisting, live sound, or a label internship.' },
    { name: 'Launch', timing: 'Senior year', status: 'next', description: 'Release, pitch, and land your first paid production work.' },
  ],
  resources: [
    { id: 301, name: 'Thornton intro to music production course', type: 'course' },
    { id: 302, name: 'Thornton recording studio open hours', type: 'service' },
    { id: 303, name: 'Trojan Records student label', type: 'club' },
    { id: 304, name: 'Songwriters Showcase · spring', type: 'event' },
    { id: 305, name: 'Music industry career panel', type: 'event' },
    { id: 306, name: 'Thornton popular music program', type: 'program' },
    { id: 307, name: 'Audio engineering society student chapter', type: 'club' },
    { id: 308, name: 'Career Center arts and entertainment advising', type: 'service' },
  ],
};

const musicFirst: TaskSeed[] = [
  { title: 'Book an hour in the Thornton recording studio', tier: 'standard', resource_id: 302, resource_name: 'Thornton studio', why: 'Hands on time in a real room beats watching tutorials.' },
  { title: 'Finish an 8 bar loop in your DAW', tier: 'quick', resource_id: 301, resource_name: 'Intro to production', why: 'Small finished things build the habit.' },
  { title: 'Produce one full rough demo', tier: 'major', resource_id: 301, resource_name: 'Intro to production', why: 'Your first portfolio piece, even if it is rough.' },
  { title: 'Go to a Trojan Records listening session', tier: 'quick', resource_id: 303, resource_name: 'Trojan Records', why: 'Meet artists who need producers.' },
];

const musicPool: TaskSeed[] = [
  { title: 'Remix one track from a Trojan Records artist', tier: 'major', resource_id: 303, resource_name: 'Trojan Records', why: 'Collaboration credits open doors.' },
  { title: 'Attend the music industry career panel', tier: 'standard', resource_id: 305, resource_name: 'Career panel', why: 'Hear how working producers got their start.' },
  { title: 'Mix a song a friend recorded', tier: 'standard', resource_id: 302, resource_name: 'Thornton studio', why: 'Mixing other people’s work sharpens your ears.' },
  { title: 'Post one track to your portfolio page', tier: 'quick', resource_id: 308, resource_name: 'Career Center', why: 'Make your work easy to share.' },
  { title: 'Sign up for the Songwriters Showcase', tier: 'standard', resource_id: 304, resource_name: 'Songwriters Showcase', why: 'A deadline is the best motivator.' },
  { title: 'Learn one new synth patch from scratch', tier: 'quick', resource_id: 301, resource_name: 'Intro to production', why: 'Sound design is a skill clients pay for.' },
];

export const templates: Record<Theme, PathTemplate> = {
  software: {
    theme: 'software',
    title: maya.pathway.title,
    base: maya.pathway,
    firstWeek: softwareFirst,
    pool: softwarePool,
    whyTail: 'So foundations and a student project team come first, giving you something real to show at the Viterbi Career Fair in February.',
  },
  health: {
    theme: 'health',
    title: 'Pre-Health Track',
    base: daniel.pathway,
    firstWeek: healthFirst,
    pool: healthPool,
    whyTail: 'So advising and shadowing start now, because clinical hours take the longest to build.',
  },
  music: {
    theme: 'music',
    title: music.title,
    base: music,
    firstWeek: musicFirst,
    pool: musicPool,
    whyTail: 'So studio time and finished demos come first, because a portfolio is what gets you work.',
  },
};

export function themeForInterests(interests: Interest[]): Theme {
  if (interests.includes('health')) return 'health';
  if (interests.includes('music')) return 'music';
  // Business, research and "not sure" fall back to the software template for now.
  return 'software';
}

export function firstWeekStages(template: PathTemplate): Pathway['stages'] {
  return template.base.stages.map((s, i) => ({
    ...s,
    status: i === 0 ? 'current' : 'next',
    timing: i === 0 ? 'Week 1 of 2' : s.timing.startsWith('Done') ? 'Coming up' : s.timing,
  }));
}

export function interestLabel(a: OnboardingAnswers): string {
  const map: Record<Interest, string> = {
    software: 'software and AI',
    health: 'medicine and health',
    music: 'music and the arts',
    business: 'business and finance',
    research: 'research',
    unsure: 'a few different fields',
  };
  return a.interests.map((i) => map[i]).join(' and ') || 'a few different fields';
}
