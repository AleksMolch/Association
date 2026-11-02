/**
 * (tabs)/index.tsx — экран «Сегодня».
 *
 * Показывает streak, дневной план, кнопку старта/продолжения занятия,
 * ближайшее новое слово и сложные слова. Все данные локальные.
 */

import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { getWord, primaryMnemonic } from '@/content';
import { WORD_IMAGES } from '@/content/imageMap';
import { buildSession, newRemainingToday } from '@/domain/session';
import { useApp } from '@/state/app-context';
import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
  type SessionSnapshot,
} from '@/state/session-store';
import { radius, spacing, useAppTheme } from '@/theme/theme';
import { AdPlaceholder, AppButton, Card, ProgressBar, SectionTitle, Screen, StatTile } from '@/components/ui';

function greeting(hour: number): string {
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export default function TodayScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { cards, newWords, stats, settings } = useApp();
  const [resume, setResume] = useState<SessionSnapshot | null>(null);
  const [starting, setStarting] = useState(false);

  const loadResume = useCallback(() => {
    void loadSessionSnapshot().then((snapshot) => {
      if (snapshot && snapshot.index < snapshot.items.length) setResume(snapshot);
      else {
        setResume(null);
        if (snapshot) void clearSessionSnapshot();
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadResume();
    }, [loadResume])
  );

  const newRemaining = newRemainingToday(stats, settings);
  const previewWord = newWords[0];
  const previewMnemonic = previewWord ? primaryMnemonic(previewWord) : null;
  const previewImage = previewMnemonic ? WORD_IMAGES[previewMnemonic.image] : undefined;
  const canStart = stats.dueNow > 0 || (newRemaining > 0 && newWords.length > 0);
  const resumeLeft = resume ? Math.max(0, resume.items.length - resume.index) : 0;
  const goalProgress = settings.dailyGoal > 0 ? stats.newToday / settings.dailyGoal : 0;

  const startNew = async () => {
    const queue = buildSession({ cards, newWords, stats, settings });
    if (!queue.length) {
      Alert.alert('На сегодня всё', 'Нет слов к повторению и новых слов в пределах дневной цели.');
      return;
    }
    setStarting(true);
    await saveSessionSnapshot({ items: queue, index: 0 });
    setStarting(false);
    router.push('/session?resume=1');
  };

  const continueSession = () => {
    if (!resume) return;
    router.push('/session?resume=1');
  };

  const now = new Date();
  const dateLabel = now.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <Text style={{ color: theme.textMuted, fontSize: 14 }}>{greeting(now.getHours())}</Text>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>Сегодня</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13, textTransform: 'capitalize' }}>{dateLabel}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatTile label="Серия" value={stats.streak + ' дн.'} hint="подряд" />
        <StatTile label="Сегодня" value={String(stats.reviewsToday)} hint="повторений" />
        <StatTile label="К повторению" value={String(stats.dueNow)} hint="сейчас" />
      </View>

      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionTitle title="План на день" hint={`Новая цель: ${settings.dailyGoal} слов`} />
          <Ionicons name="flag-outline" size={22} color={theme.accent} />
        </View>
        <ProgressBar value={goalProgress} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            Новых сегодня: {stats.newToday} / {settings.dailyGoal}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            Осталось: {newRemaining}
          </Text>
        </View>

        {resume ? (
          <View style={{ gap: spacing.sm }}>
            <AppButton label={`Продолжить занятие (${resumeLeft})`} onPress={continueSession} />
            <AppButton label="Начать новое занятие" variant="ghost" onPress={startNew} loading={starting} />
          </View>
        ) : (
          <AppButton
            label={canStart ? 'Начать занятие' : 'На сегодня всё'}
            onPress={startNew}
            disabled={!canStart}
            loading={starting}
          />
        )}
      </Card>

      {previewWord && previewMnemonic ? (
        <Card style={{ gap: spacing.sm }}>
          <SectionTitle title="Следующее новое слово" hint="Можно посмотреть заранее" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Открыть слово ${previewWord.lemma}`}
            onPress={() => router.push({ pathname: '/word/[id]', params: { id: String(previewWord.id) } })}
            style={({ pressed }) => [{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }, pressed && { opacity: 0.8 }]}>
            {previewImage ? (
              <Image
                source={previewImage}
                style={{ width: 96, height: 72, borderRadius: radius.sm, backgroundColor: theme.imageBackground }}
                contentFit="cover"
              />
            ) : null}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{previewWord.lemma}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>{previewWord.meanings[0]}</Text>
              <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>
                Ключ: {previewMnemonic.cueWord}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
        </Card>
      ) : null}

      {stats.leeches.length > 0 ? (
        <Card style={{ gap: spacing.sm }}>
          <SectionTitle title="Сложные слова" hint="Требуют внимания" />
          {stats.leeches.slice(0, 3).map((card) => {
            const word = getWord(card.wordId);
            if (!word) return null;
            return (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                accessibilityLabel={`Открыть сложное слово ${word.lemma}`}
                onPress={() => router.push({ pathname: '/word/[id]', params: { id: String(word.id) } })}
                style={({ pressed }) => [
                  styles.leechRow,
                  { borderColor: theme.line },
                  pressed && { opacity: 0.75 },
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{word.lemma}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>{word.meanings[0]}</Text>
                </View>
                <Text style={{ color: theme.coral, fontSize: 12, fontWeight: '700' }}>
                  {card.lapses} срывов
                </Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <AdPlaceholder />
    </Screen>
  );
}

const styles = StyleSheet.create({
  leechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
});
