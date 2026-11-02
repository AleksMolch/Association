/**
 * session-store.ts — сохранение незавершённой сессии.
 *
 * Нужно, чтобы после закрытия приложения можно было продолжить занятие
 * с той же карточки. Хранится только очередь wordId и текущий индекс;
 * оценки FSRS сохраняются в SQLite сразу.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SessionItem } from '@/domain/types';

const KEY = 'session_resume_v1';

export type SessionSnapshot = {
  items: SessionItem[];
  index: number;
};

export async function saveSessionSnapshot(snapshot: SessionSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Некритично: сессия просто не восстановится.
  }
}

export async function loadSessionSnapshot(): Promise<SessionSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSessionSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
