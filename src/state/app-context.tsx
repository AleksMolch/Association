/**
 * app-context.tsx — общее состояние приложения.
 *
 * Инициализирует SQLite, загружает настройки, выбранные ассоциации, карточки
 * и статистику. Экраны вызывают действия контекста и получают свежие данные.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { words } from '@/content';
import type { Word } from '@/content/types';
import { applyRating, createNewCard } from '@/domain/fsrs';
import type { CardRow, LearningStats, RatingValue, Settings } from '@/domain/types';
import { initDatabase } from '@/storage/database';
import {
  clearLearningData,
  getAllCards,
  getPreferredMap,
  getSettings,
  getStats,
  saveRating,
  seedSettings,
  setPreferred,
  setSetting,
  upsertCard,
} from '@/storage/repository';

type AppContextValue = {
  ready: boolean;
  settings: Settings;
  preferred: Map<number, string>;
  cards: CardRow[];
  cardByWord: Map<number, CardRow>;
  newWords: Word[];
  stats: LearningStats;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  selectMnemonic: (wordId: number, mnemonicId: string, reason: 'initial' | 'replace') => void;
  rateCard: (card: CardRow, rating: RatingValue, usedHint: boolean, answer: string | null) => CardRow;
  clearAll: () => void;
  refresh: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function emptyStats(totalWords: number): LearningStats {
  return {
    totalWords,
    introduced: 0,
    dueNow: 0,
    reviewsToday: 0,
    streak: 0,
    newToday: 0,
    leeches: [],
    stateCounts: {},
    lastSevenDays: [],
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [preferred, setPreferredMap] = useState<Map<number, string>>(new Map());
  const [cards, setCards] = useState<CardRow[]>([]);
  const [stats, setStats] = useState<LearningStats>(emptyStats(words.length));

  const load = useCallback(() => {
    const nextSettings = getSettings();
    const nextCards = getAllCards();
    setSettings(nextSettings);
    setPreferredMap(getPreferredMap());
    setCards(nextCards);
    setStats(getStats(words.length));
  }, []);

  useEffect(() => {
    try {
      initDatabase();
      seedSettings();
      load();
    } finally {
      setReady(true);
    }
  }, [load]);

  const cardByWord = useMemo(() => {
    const map = new Map<number, CardRow>();
    for (const card of cards) map.set(card.wordId, card);
    return map;
  }, [cards]);

  const newWords = useMemo(() => words.filter((word) => !cardByWord.has(word.id)), [cardByWord]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSetting(key, value);
    setSettings(getSettings());
  }, []);

  const selectMnemonic = useCallback(
    (wordId: number, mnemonicId: string, reason: 'initial' | 'replace') => {
      const previous = getPreferredMap().get(wordId) ?? null;
      if (reason === 'initial' && !cardByWord.has(wordId)) {
        const now = new Date();
        upsertCard(createNewCard(wordId, now));
      }
      setPreferred(wordId, mnemonicId, reason, previous);
      load();
    },
    [cardByWord, load]
  );

  const rateCard = useCallback(
    (card: CardRow, rating: RatingValue, usedHint: boolean, answer: string | null) => {
      const now = new Date();
      const updated = applyRating(card, rating, now);
      saveRating(updated, {
        id: 'rev-' + now.getTime() + '-' + Math.random().toString(36).slice(2, 8),
        cardId: updated.id,
        exerciseType: 'review',
        rating,
        usedHint,
        answer,
        createdAt: now.toISOString(),
      });
      load();
      return updated;
    },
    [load]
  );

  const clearAll = useCallback(() => {
    clearLearningData();
    load();
  }, [load]);

  const value = useMemo<AppContextValue | null>(() => {
    if (!settings) return null;
    return {
      ready,
      settings,
      preferred,
      cards,
      cardByWord,
      newWords,
      stats,
      updateSetting,
      selectMnemonic,
      rateCard,
      clearAll,
      refresh: load,
    };
  }, [
    ready,
    settings,
    preferred,
    cards,
    cardByWord,
    newWords,
    stats,
    updateSetting,
    selectMnemonic,
    rateCard,
    clearAll,
    load,
  ]);

  if (!value) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
