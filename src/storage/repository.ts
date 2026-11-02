/**
 * repository.ts — доступ к локальным данным обучения.
 *
 * Все запросы синхронные: база маленькая, а синхронный API expo-sqlite
 * упрощает транзакции и исключает гонки при быстром нажатии оценок.
 */

import { db } from './database';
import { defaultSettings, type CardRow, type DayCount, type LearningStats, type ReviewRow, type Settings } from '@/domain/types';
import { cardIdFor } from '@/domain/fsrs';

type SettingRow = { key: string; value: string };

export function getSettings(): Settings {
  const rows = db.getAllSync<SettingRow>('SELECT key, value FROM settings');
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const merged = { ...defaultSettings };
  for (const key of Object.keys(defaultSettings) as (keyof Settings)[]) {
    const raw = map.get(key);
    if (raw !== undefined) {
      try {
        (merged as Record<string, unknown>)[key] = JSON.parse(raw);
      } catch {
        // повреждённое значение оставляем дефолтным
      }
    }
  }
  return merged;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  db.runSync(
    'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value)
  );
}

export function seedSettings(): void {
  for (const key of Object.keys(defaultSettings) as (keyof Settings)[]) {
    db.runSync(
      'INSERT OR IGNORE INTO settings(key, value) VALUES(?, ?)',
      key,
      JSON.stringify(defaultSettings[key])
    );
  }
}

export function getPreferredMap(): Map<number, string> {
  const rows = db.getAllSync<{ word_id: number; mnemonic_id: string }>(
    'SELECT word_id, mnemonic_id FROM preferred_mnemonic'
  );
  return new Map(rows.map((r) => [r.word_id, r.mnemonic_id]));
}

export function getPreferred(wordId: number): string | null {
  const row = db.getFirstSync<{ mnemonic_id: string }>(
    'SELECT mnemonic_id FROM preferred_mnemonic WHERE word_id = ?',
    wordId
  );
  return row ? row.mnemonic_id : null;
}

export function setPreferred(
  wordId: number,
  mnemonicId: string,
  reason: 'initial' | 'replace',
  previousMnemonicId?: string | null
): void {
  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO preferred_mnemonic(word_id, mnemonic_id, selected_at, replaced_from_id)
       VALUES(?, ?, ?, ?)
       ON CONFLICT(word_id) DO UPDATE SET
         mnemonic_id = excluded.mnemonic_id,
         selected_at = excluded.selected_at,
         replaced_from_id = excluded.replaced_from_id`,
      wordId,
      mnemonicId,
      now,
      previousMnemonicId ?? null
    );
    db.runSync(
      `INSERT INTO selection_history(id, word_id, previous_mnemonic_id, next_mnemonic_id, reason, created_at)
       VALUES(?, ?, ?, ?, ?, ?)`,
      'sel-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      wordId,
      previousMnemonicId ?? null,
      mnemonicId,
      reason,
      now
    );
  });
}

type CardDbRow = {
  id: string;
  word_id: number;
  meaning_id: string;
  direction: string;
  due: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: number;
  last_review: string | null;
  created_at: string;
};

function mapCard(row: CardDbRow): CardRow {
  return {
    id: row.id,
    wordId: row.word_id,
    meaningId: row.meaning_id,
    direction: 'en-ru',
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    scheduledDays: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    learningSteps: row.learning_steps,
    state: row.state,
    lastReview: row.last_review,
    createdAt: row.created_at,
  };
}

export function getAllCards(): CardRow[] {
  return db.getAllSync<CardDbRow>('SELECT * FROM cards ORDER BY due ASC').map(mapCard);
}

export function getDueCards(now = new Date()): CardRow[] {
  return db
    .getAllSync<CardDbRow>('SELECT * FROM cards WHERE due <= ? ORDER BY due ASC', now.toISOString())
    .map(mapCard);
}

export function getCard(wordId: number, meaningId = '0'): CardRow | null {
  const row = db.getFirstSync<CardDbRow>(
    'SELECT * FROM cards WHERE id = ?',
    cardIdFor(wordId, meaningId)
  );
  return row ? mapCard(row) : null;
}

export function upsertCard(card: CardRow): void {
  db.runSync(
    `INSERT INTO cards(
      id, word_id, meaning_id, direction, due, stability, difficulty, scheduled_days,
      reps, lapses, learning_steps, state, last_review, created_at
    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      due = excluded.due,
      stability = excluded.stability,
      difficulty = excluded.difficulty,
      scheduled_days = excluded.scheduled_days,
      reps = excluded.reps,
      lapses = excluded.lapses,
      learning_steps = excluded.learning_steps,
      state = excluded.state,
      last_review = excluded.last_review`,
    card.id,
    card.wordId,
    card.meaningId,
    card.direction,
    card.due,
    card.stability,
    card.difficulty,
    card.scheduledDays,
    card.reps,
    card.lapses,
    card.learningSteps,
    card.state,
    card.lastReview,
    card.createdAt
  );
}

export function saveRating(card: CardRow, review: ReviewRow): void {
  db.withTransactionSync(() => {
    upsertCard(card);
    db.runSync(
      `INSERT INTO reviews(id, card_id, exercise_type, rating, used_hint, answer, created_at)
       VALUES(?, ?, ?, ?, ?, ?, ?)`,
      review.id,
      review.cardId,
      review.exerciseType,
      review.rating,
      review.usedHint ? 1 : 0,
      review.answer,
      review.createdAt
    );
  });
}

export function getReviewCountsByDay(days = 7): DayCount[] {
  const now = new Date();
  const result: DayCount[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toLocaleDateString('sv-SE');
    const row = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM reviews WHERE date(created_at, 'localtime') = ?",
      key
    );
    result.push({ day: key, count: row?.count ?? 0 });
  }
  return result;
}

export function getStreak(): number {
  const rows = db.getAllSync<{ day: string }>(
    "SELECT DISTINCT date(created_at, 'localtime') AS day FROM reviews ORDER BY day DESC"
  );
  if (rows.length === 0) return 0;
  const days = rows.map((r) => r.day);
  const today = new Date();
  const todayKey = today.toLocaleDateString('sv-SE');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toLocaleDateString('sv-SE');
  let cursor = days[0] === todayKey ? 0 : days[0] === yesterdayKey ? 1 : -1;
  if (cursor === -1) return 0;
  let count = 0;
  let expected = new Date(today);
  if (cursor === 1) expected.setDate(expected.getDate() - 1);
  for (const day of days) {
    const expectedKey = expected.toLocaleDateString('sv-SE');
    if (day !== expectedKey) break;
    count += 1;
    expected.setDate(expected.getDate() - 1);
  }
  return count;
}

export function getStats(totalWords: number): LearningStats {
  const now = new Date();
  const todayKey = now.toLocaleDateString('sv-SE');
  const introduced = db.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM cards')?.count ?? 0;
  const dueNow =
    db.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM cards WHERE due <= ?', now.toISOString())
      ?.count ?? 0;
  const reviewsToday =
    db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM reviews WHERE date(created_at, 'localtime') = ?",
      todayKey
    )?.count ?? 0;
  const newToday =
    db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM cards WHERE date(created_at, 'localtime') = ?",
      todayKey
    )?.count ?? 0;
  const stateRows = db.getAllSync<{ state: number; count: number }>(
    'SELECT state, COUNT(*) AS count FROM cards GROUP BY state'
  );
  const stateCounts: Record<number, number> = {};
  for (const row of stateRows) stateCounts[row.state] = row.count;
  const leeches = db
    .getAllSync<CardDbRow>('SELECT * FROM cards WHERE lapses >= 3 ORDER BY lapses DESC LIMIT 10')
    .map(mapCard);
  return {
    totalWords,
    introduced,
    dueNow,
    reviewsToday,
    streak: getStreak(),
    newToday,
    leeches,
    stateCounts,
    lastSevenDays: getReviewCountsByDay(7),
  };
}

export function clearLearningData(): void {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM reviews');
    db.runSync('DELETE FROM cards');
    db.runSync('DELETE FROM preferred_mnemonic');
    db.runSync('DELETE FROM selection_history');
  });
}
