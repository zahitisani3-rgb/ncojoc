import type {
  Checkin,
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
  /** The hand-written nextWeek note only fits some answers; otherwise the note is generated. */
  nextWeekNoteFits: (c: Checkin) => boolean;
  resume: ResumeEntry[];
  trend: TrendPoint[];
  leaderboard: LeaderboardRow[];
}
