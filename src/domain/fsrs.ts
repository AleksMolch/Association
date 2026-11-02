/**
 * fsrs.ts — адаптер FSRS для карточек слов.
 *
 * Храним FSRS-состояние в SQLite-совместимом виде (ISO-даты и числовые поля).
 * Домен не зависит от UI: экран передаёт Rating, получает обновлённую карточку
 * и подпись следующего интервала.
 */

import { createEmptyCard, fsrs, State } from 'ts-fsrs';

import type { CardRow, RatingValue } from './types';

const scheduler = fsrs();

type FsrsCard = ReturnType<typeof createEmptyCard>;

export const CARD_DIRECTION = 'en-ru';

export function cardIdFor(wordId: number, meaningId = '0'): string {
  return wordId + ':' + meaningId + ':' + CARD_DIRECTION;
}

export function createNewCard(wordId: number, now: Date, meaningId = '0'): CardRow {
  const id = cardIdFor(wordId, meaningId);
  const empty = createEmptyCard(now);
  return {
    id,
    wordId,
    meaningId,
    direction: CARD_DIRECTION,
    due: empty.due.toISOString(),
    stability: empty.stability,
    difficulty: empty.difficulty,
    scheduledDays: empty.scheduled_days,
    reps: empty.reps,
    lapses: empty.lapses,
    learningSteps: empty.learning_steps,
    state: empty.state,
    lastReview: null,
    createdAt: now.toISOString(),
  };
}

function toFsrsCard(row: CardRow): FsrsCard {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    scheduled_days: row.scheduledDays,
    reps: row.reps,
    lapses: row.lapses,
    learning_steps: row.learningSteps,
    state: row.state as State,
    last_review: row.lastReview ? new Date(row.lastReview) : undefined,
  };
}

function fromFsrsCard(base: CardRow, card: FsrsCard): CardRow {
  return {
    ...base,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learningSteps: card.learning_steps,
    state: card.state,
    lastReview: card.last_review ? card.last_review.toISOString() : null,
  };
}

export function applyRating(row: CardRow, rating: RatingValue, now: Date): CardRow {
  const result = scheduler.next(toFsrsCard(row), now, rating);
  return fromFsrsCard(row, result.card);
}

export function isDue(row: CardRow, now: Date): boolean {
  return new Date(row.due).getTime() <= now.getTime();
}

export function stateLabel(state: number): string {
  switch (state) {
    case State.New:
      return 'Новая';
    case State.Learning:
      return 'Изучается';
    case State.Review:
      return 'Повторение';
    case State.Relearning:
      return 'Переучивание';
    default:
      return 'Неизвестно';
  }
}

/** Человеческая подпись следующего повторения. */
export function formatNextReview(dueIso: string, now = new Date()): string {
  const due = new Date(dueIso);
  const diffMs = due.getTime() - now.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes <= 0) return 'сейчас';
  if (minutes < 60) return 'через ' + minutes + ' мин';
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    const sameDay = due.toDateString() === now.toDateString();
    const time = due.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return sameDay ? 'сегодня в ' + time : 'завтра в ' + time;
  }
  const days = Math.round(hours / 24);
  if (days < 7) return 'через ' + days + ' дн.';
  return due.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}
