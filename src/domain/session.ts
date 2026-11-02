/**
 * session.ts — планирование занятия.
 *
 * Сначала идут просроченные повторения, затем новые слова в пределах дневной
 * цели. Слово попадает в новые, только если для него ещё нет FSRS-карточки.
 */

import type { CardRow, SessionItem, Settings } from '@/domain/types';
import type { Word } from '@/content/types';

export function newRemainingToday(stats: { newToday: number }, settings: Settings): number {
  return Math.max(0, settings.dailyGoal - stats.newToday);
}

export function buildSession(params: {
  cards: CardRow[];
  newWords: Word[];
  stats: { newToday: number };
  settings: Settings;
  now?: Date;
}): SessionItem[] {
  const now = params.now ?? new Date();
  const due = params.cards
    .filter((card) => new Date(card.due).getTime() <= now.getTime())
    .sort((a, b) => a.due.localeCompare(b.due))
    .map<SessionItem>((card) => ({ kind: 'review', wordId: card.wordId }));
  const already = new Set(due.map((item) => item.wordId));
  const limit = newRemainingToday(params.stats, params.settings);
  const fresh = params.newWords
    .filter((word) => !already.has(word.id))
    .slice(0, limit)
    .map<SessionItem>((word) => ({ kind: 'new', wordId: word.id }));
  return [...due, ...fresh];
}
