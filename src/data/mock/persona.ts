import type {
  LeaderboardRow,
  OnboardingAnswers,
  Pathway,
  Profile,
  ResumeEntry,
  TrendPoint,
  Week,
} from '@/types';

export type PersonaId = 'maya' | 'daniel';

/** Everything the demo needs to fully load one student. */
export interface Persona {
  id: PersonaId;
  profile: Profile;
  answers: OnboardingAnswers;
  totalPoints: number;
  streak: number;
  pathway: Pathway;
  week: Week;
  /** What submitCheckin returns from the mock for this persona's current week. */
  nextWeek: Week;
  resume: ResumeEntry[];
  trend: TrendPoint[];
  leaderboard: LeaderboardRow[];
}
