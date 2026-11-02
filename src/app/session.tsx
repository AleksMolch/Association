/**
 * session.tsx — занятие: знакомство с новыми словами и повторение.
 *
 * Новое слово: слово → перевод → свайп-дек ассоциаций → подтверждение →
 * «Проверь себя». Повторение: вопрос → подсказка/ответ → оценка FSRS.
 * Незавершённая сессия сохраняется и может быть продолжена.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getMnemonic, getWord, primaryMnemonic } from '@/content';
import type { Mnemonic } from '@/content/types';
import { formatNextReview, stateLabel } from '@/domain/fsrs';
import { buildSession } from '@/domain/session';
import type { CardRow, RatingValue, SessionItem } from '@/domain/types';
import { speakEnglish } from '@/audio/tts';
import { useApp } from '@/state/app-context';
import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
} from '@/state/session-store';
import { spacing, useAppTheme } from '@/theme/theme';
import {
  AppButton,
  Card,
  EmptyState,
  ProgressBar,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { AssociationView, MnemonicDeck, WordHeader } from '@/components/word';

type Phase = 'deck' | 'check' | 'question' | 'answer' | 'rated';

export default function SessionScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ resume?: string }>();
  const { cards, newWords, stats, settings, cardByWord, preferred, selectMnemonic, rateCard } = useApp();

  const [items, setItems] = useState<SessionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phase, setPhase] = useState<Phase>('question');
  const [deckIndex, setDeckIndex] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [chosen, setChosen] = useState<Mnemonic | null>(null);
  const [updatedCard, setUpdatedCard] = useState<CardRow | null>(null);
  const [sessionStats, setSessionStats] = useState({ reviews: 0, introduced: 0 });

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const resumable = params.resume === '1' ? await loadSessionSnapshot() : null;
      let queue = resumable?.items ?? [];
      let start = resumable?.index ?? 0;
      if (!resumable || !queue.length) {
        queue = buildSession({ cards, newWords, stats, settings });
        start = 0;
        if (queue.length) await saveSessionSnapshot({ items: queue, index: 0 });
      }
      if (cancelled) return;
      setItems(queue);
      setIndex(Math.min(start, Math.max(0, queue.length - 1)));
      setLoaded(true);
      setFinished(queue.length === 0);
    };
    void init();
    return () => {
      cancelled = true;
    };
    // очередь строится один раз при открытии занятия
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = items[index];
  const word = current ? getWord(current.wordId) : undefined;
  const card = current ? cardByWord.get(current.wordId) : undefined;
  const preferredMnemonic = word ? getMnemonic(word, preferred.get(word.id)) : undefined;
  const reviewMnemonic = preferredMnemonic ?? (word ? primaryMnemonic(word) : undefined);
  const mnemonics = word ? [...word.mnemonics].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const deckMnemonic = mnemonics[deckIndex] ?? mnemonics[0];

  useEffect(() => {
    if (!loaded || !items.length) return;
    void saveSessionSnapshot({ items, index });
  }, [items, index, loaded]);

  // Смена текущей карточки должна сбрасывать локальное состояние ответа.
  // Это намеренный переход, а не синхронизация с внешней системой.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!current) return;
    setHintShown(false);
    setUsedHint(false);
    setUpdatedCard(null);
    setChosen(null);
    setDeckIndex(0);
    setPhase(current.kind === 'new' ? 'deck' : 'question');
  }, [current]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const finish = useCallback(() => {
    setFinished(true);
    void clearSessionSnapshot();
  }, []);

  const advance = useCallback(() => {
    if (index + 1 >= items.length) {
      finish();
      return;
    }
    setIndex(index + 1);
  }, [index, items.length, finish]);

  const close = () => {
    // Если карточка уже оценена или новая ассоциация выбрана, при продолжении
    // сразу переходим к следующей: повторно предлагать её не нужно.
    const nextIndex = phase === 'rated' || phase === 'check' ? index + 1 : index;
    if (!finished && nextIndex < items.length) {
      void saveSessionSnapshot({ items, index: nextIndex });
    } else {
      void clearSessionSnapshot();
    }
    router.back();
  };

  const persistNext = () => {
    const next = index + 1;
    if (next >= items.length) void clearSessionSnapshot();
    else void saveSessionSnapshot({ items, index: next });
  };

  const choose = () => {
    if (!word || !deckMnemonic) return;
    selectMnemonic(word.id, deckMnemonic.id, 'initial');
    setChosen(deckMnemonic);
    setPhase('check');
    setSessionStats((s) => ({ ...s, introduced: s.introduced + 1 }));
    persistNext();
  };

  const rate = (rating: RatingValue) => {
    if (!card) {
      advance();
      return;
    }
    const updated = rateCard(card, rating, usedHint, phase === 'answer' && word ? word.meanings[0] : null);
    setUpdatedCard(updated);
    setPhase('rated');
    setSessionStats((s) => ({ ...s, reviews: s.reviews + 1 }));
    persistNext();
  };

  if (!loaded) {
    return (
      <Screen scroll={false}>
        <EmptyState title="Загрузка занятия" text="Готовим карточки…" />
      </Screen>
    );
  }

  if (finished) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl }}>
          <Ionicons name="checkmark-circle" size={56} color={theme.accent} />
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>Занятие завершено</Text>
          <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>
            Повторений: {sessionStats.reviews} · новых слов: {sessionStats.introduced}
          </Text>
          <AppButton
            label="На главную"
            onPress={() => router.replace('/(tabs)')}
            style={{ alignSelf: 'stretch', marginTop: spacing.md }}
          />
        </View>
      </Screen>
    );
  }

  if (!current || !word) {
    return (
      <Screen>
        <EmptyState title="Карточка не найдена" text="Вернитесь на главный экран и начните занятие заново." />
        <AppButton label="На главную" onPress={() => router.replace('/(tabs)')} />
      </Screen>
    );
  }

  if (current.kind === 'review' && !card) {
    return (
      <Screen>
        <EmptyState
          title="Карточка не найдена"
          text="Возможно, прогресс был очищен. Пропустите эту карточку."
        />
        <AppButton label="Пропустить" onPress={advance} />
        <AppButton label="Закрыть занятие" variant="ghost" onPress={close} />
      </Screen>
    );
  }

  const progress = items.length > 0 ? (index + 1) / items.length : 0;
  const translation = word.meanings[0];

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть занятие"
          onPress={close}
          hitSlop={8}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
              {current.kind === 'new' ? 'Новое слово' : 'Повторение'}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>
              {index + 1} / {items.length}
            </Text>
          </View>
          <ProgressBar value={progress} />
        </View>
      </View>

      <WordHeader word={word} onSpeak={() => speakEnglish(word.lemma, settings.ttsRate)} />

      {current.kind === 'new' ? (
        <View style={{ gap: spacing.md }}>
          <Card style={{ gap: 4 }}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>Перевод</Text>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '600' }}>{translation}</Text>
          </Card>

          {phase === 'check' && chosen ? (
            <View style={{ gap: spacing.md }}>
              <SectionTitle title="Проверь себя" hint="Свяжите ключ с переводом" />
              <AssociationView mnemonic={chosen} />
              <AppButton label="Понятно, дальше" onPress={advance} />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <SectionTitle
                title="Выберите ассоциацию"
                hint="Свайпните варианты и подтвердите выбор"
              />
              <MnemonicDeck mnemonics={mnemonics} index={deckIndex} onChange={setDeckIndex} />
              <AppButton
                label={deckMnemonic ? `Выбрать «${deckMnemonic.cueWord}»` : 'Выбрать ассоциацию'}
                onPress={choose}
                disabled={!deckMnemonic}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          {phase === 'question' ? (
            <View style={{ gap: spacing.md }}>
              <Card>
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                  Вспомните перевод слова. При необходимости откройте подсказку или ответ.
                </Text>
              </Card>
              {hintShown && reviewMnemonic ? (
                <AssociationView mnemonic={reviewMnemonic} />
              ) : null}
              {settings.hintsEnabled && !hintShown ? (
                <AppButton
                  label="Показать подсказку"
                  variant="secondary"
                  onPress={() => {
                    setHintShown(true);
                    setUsedHint(true);
                  }}
                />
              ) : null}
              <AppButton label="Показать ответ" onPress={() => setPhase('answer')} />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <Card style={{ gap: 4 }}>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>Перевод</Text>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700' }}>{translation}</Text>
              </Card>
              {reviewMnemonic ? <AssociationView mnemonic={reviewMnemonic} /> : null}
              {card ? (
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {stateLabel(card.state)} · {formatNextReview(card.due)}
                </Text>
              ) : null}

              {phase === 'rated' && updatedCard ? (
                <View style={{ gap: spacing.md }}>
                  <Card>
                    <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700' }}>
                      Следующий повтор: {formatNextReview(updatedCard.due)}
                    </Text>
                    {usedHint ? (
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                        Использована подсказка
                      </Text>
                    ) : null}
                  </Card>
                  <AppButton label="Дальше" onPress={advance} />
                </View>
              ) : (
                <View style={styles.ratingGrid}>
                  <AppButton
                    label="Again"
                    variant="danger"
                    onPress={() => rate(1)}
                    style={styles.ratingButton}
                  />
                  <AppButton
                    label="Hard"
                    variant="secondary"
                    onPress={() => rate(2)}
                    style={styles.ratingButton}
                  />
                  <AppButton
                    label="Good"
                    onPress={() => rate(3)}
                    style={styles.ratingButton}
                  />
                  <AppButton
                    label="Easy"
                    variant="secondary"
                    onPress={() => rate(4)}
                    style={styles.ratingButton}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ratingButton: {
    flexBasis: '48%',
    flexGrow: 1,
  },
});
