// Shared data contract between the frontend and the Supabase backend.
// generate_pathway and adjust_week must return these shapes.

export type Tier = 'quick' | 'standard' | 'major'; // 10, 25, 60 points
export type ResourceType = 'course' | 'club' | 'event' | 'service' | 'program';
export type Theme = 'software' | 'health' | 'music';

export interface Resource {
  id: number;
  name: string;
  type: ResourceType;
  link?: string;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  tier: Tier;
  points: number;
  resource_id: number | null;
  resource_name: string;
  why: string; // one line, shown on the card
  done: boolean;
  proof_url?: string;
}

export interface Stage {
  name: string; // Explore, Build Skills, Projects, Experience, Launch
  timing: string; // "Week 4 of 6", "Spring 2027"
  description: string;
  status: 'done' | 'current' | 'next';
}

export interface Pathway {
  id: string;
  title: string; // "Machine Learning Engineer"
  theme: Theme;
  why: string;
  resources: Resource[]; // cited on the Pathway screen
  stages: Stage[];
  created_at: string;
}

export interface Week {
  number: number;
  start: string;
  end: string;
  tasks: Task[];
  adjustmentNote: string; // the "Adjusted for you" text
  pointsGoal: number;
}

export type Scale = 1 | 2 | 3 | 4 | 5;

export interface Checkin {
  week: number;
  enjoyment: Scale;
  workload: Scale;
  confidence: Scale;
  reflection: string;
  proof_url?: string;
}

export interface ResumeEntry {
  id: string;
  section: 'Education' | 'Projects' | 'Activities' | 'Skills';
  text: string;
  source: string; // "Week 4 · Train your first classifier"
  status: 'pending' | 'approved';
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  initials: string;
  streak: number; // weeks
  checkinRate: number; // 0..1
  points: number;
  isYou?: boolean;
}

// ---- Frontend-only shapes ----

export type School = 'Viterbi' | 'Dornsife' | 'Marshall' | 'Annenberg' | 'Thornton' | 'Other';
export type Year = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';
export type Interest = 'software' | 'health' | 'music' | 'business' | 'research' | 'unsure';
export type HoursBand = '1-2' | '3-4' | '5-7' | '8+';

export interface OnboardingAnswers {
  name: string;
  email: string;
  school: School | null;
  experience: string[];
  resumeFileName?: string;
  major: string;
  year: Year | null;
  interests: Interest[];
  notes: string;
  hours: HoursBand | null;
  internshipTarget: string | null;
  workStyles: string[];
  checkinDay: number; // 0 = Monday ... 6 = Sunday
  dailyNudge: boolean;
}

export interface Profile {
  name: string;
  initials: string;
  majorShort: string; // "CS"
  year: Year;
  school: string;
  email: string;
}

export interface TrendPoint {
  week: number;
  enjoyment: Scale;
  workload: Scale;
  confidence: Scale;
  points: number;
}
