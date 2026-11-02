/**
 * types.ts — доменные типы приложения.
 *
 * Отделяет модель обучения (карточки, оценки, настройки) от контент-пака.
 */

export type Direction = 'en-ru';

export type ExerciseType = 'review' | 'introduction';

export type RatingValue = 1 | 2 | 3 | 4;

export type CardRow = {
  id: string;
  wordId: number;
  meaningId: string;
  direction: Direction;
  due: string;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningSteps: number;
  state: number;
  lastReview: string | null;
  createdAt: string;
};

export type ReviewRow = {
  id: string;
  cardId: string;
  exerciseType: ExerciseType;
  rating: RatingValue;
  usedHint: boolean;
  answer: string | null;
  createdAt: string;
};

export type SessionItem = {
  kind: 'new' | 'review';
  wordId: number;
};

export type Settings = {
  dailyGoal: 5 | 10 | 15 | 20;
  ttsRate: number;
  hintsEnabled: boolean;
  writingEnabled: boolean;
  remindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  reducedMotion: boolean;
  associationSwipeHintSeen: boolean;
};

export const defaultSettings: Settings = {
  dailyGoal: 10,
  ttsRate: 0.9,
  hintsEnabled: true,
  writingEnabled: false,
  remindersEnabled: false,
  reminderHour: 19,
  reminderMinute: 0,
  reducedMotion: false,
  associationSwipeHintSeen: false,
};

export type DayCount = { day: string; count: number };

export type LearningStats = {
  totalWords: number;
  introduced: number;
  dueNow: number;
  reviewsToday: number;
  streak: number;
  newToday: number;
  leeches: CardRow[];
  stateCounts: Record<number, number>;
  lastSevenDays: DayCount[];
};
