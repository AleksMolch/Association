/**
 * database.ts — локальная SQLite-база приложения.
 *
 * Схема создаётся при старте. Все учебные данные хранятся только на устройстве.
 * Оценка карточки и запись Review выполняются в одной транзакции (repository.ts).
 */

import { openDatabaseSync } from 'expo-sqlite';

export const db = openDatabaseSync('association.db');

export function initDatabase(): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS preferred_mnemonic (
      word_id INTEGER PRIMARY KEY NOT NULL,
      mnemonic_id TEXT NOT NULL,
      selected_at TEXT NOT NULL,
      replaced_from_id TEXT
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      word_id INTEGER NOT NULL,
      meaning_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      due TEXT NOT NULL,
      stability REAL NOT NULL,
      difficulty REAL NOT NULL,
      scheduled_days INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      lapses INTEGER NOT NULL,
      learning_steps INTEGER NOT NULL DEFAULT 0,
      state INTEGER NOT NULL,
      last_review TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(word_id, meaning_id, direction)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY NOT NULL,
      card_id TEXT NOT NULL,
      exercise_type TEXT NOT NULL,
      rating INTEGER NOT NULL,
      used_hint INTEGER NOT NULL,
      answer TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS selection_history (
      id TEXT PRIMARY KEY NOT NULL,
      word_id INTEGER NOT NULL,
      previous_mnemonic_id TEXT,
      next_mnemonic_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(due);
    CREATE INDEX IF NOT EXISTS idx_cards_word ON cards(word_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at);
    CREATE INDEX IF NOT EXISTS idx_reviews_card ON reviews(card_id);
  `);
}
