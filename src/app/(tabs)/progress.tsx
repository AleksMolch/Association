/**
 * (tabs)/progress.tsx — локальная статистика обучения.
 *
 * Источник данных — таблица reviews и cards. График за 7 дней и распределение
 * по состояниям FSRS строятся без сторонних chart-библиотек.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getWord } from '@/content';
import { stateLabel } from '@/domain/fsrs';
import { useApp } from '@/state/app-context';
import { radius, spacing, useAppTheme } from '@/theme/theme';
import { AdPlaceholder, Card, EmptyState, SectionTitle, Screen, StatTile } from '@/components/ui';

const STATE_ORDER = [0, 1, 2, 3];

function shortWeekday(day: string): string {
  const date = new Date(day + 'T12:00:00');
  return date.toLocaleDateString('ru-RU', { weekday: 'short' });
}

export default function ProgressScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { stats } = useApp();
  const max = Math.max(1, ...stats.lastSevenDays.map((d) => d.count));

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>Прогресс</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
          Только это устройство. Без аккаунта и синхронизации.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatTile label="Серия" value={stats.streak + ' дн.'} hint="подряд" />
        <StatTile label="Сегодня" value={String(stats.reviewsToday)} hint="повторений" />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatTile label="Изучается" value={String(stats.introduced)} hint="слов" />
        <StatTile label="К повторению" value={String(stats.dueNow)} hint="сейчас" />
      </View>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle title="Повторения за 7 дней" hint="Количество оценённых карточек" />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 110 }}>
          {stats.lastSevenDays.map((d) => {
            const height = d.count === 0 ? 2 : Math.max(8, Math.round((d.count / max) * 84));
            return (
              <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <Text style={{ color: theme.textMuted, fontSize: 10 }}>{d.count}</Text>
                <View
                  accessibilityLabel={`${d.day}: ${d.count} повторений`}
                  style={{
                    width: '70%',
                    height,
                    borderRadius: radius.sm,
                    backgroundColor: d.count > 0 ? theme.accent : theme.line,
                  }}
                />
                <Text style={{ color: theme.textMuted, fontSize: 10, textTransform: 'capitalize' }}>
                  {shortWeekday(d.day)}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle title="Состояния FSRS" hint="Распределение карточек" />
        {STATE_ORDER.map((state) => {
          const count = stats.stateCounts[state] ?? 0;
          const ratio = stats.introduced > 0 ? count / stats.introduced : 0;
          return (
            <View key={state} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.text, fontSize: 13 }}>{stateLabel(state)}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>{count}</Text>
              </View>
              <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: theme.accentSoft, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${Math.round(ratio * 100)}%`,
                    height: '100%',
                    backgroundColor: state === 0 ? theme.accent : state === 1 ? theme.warning : theme.success,
                  }}
                />
              </View>
            </View>
          );
        })}
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle title="Сложные слова" hint="3+ срыва" />
        {stats.leeches.length === 0 ? (
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>Пока нет слов с частыми срывами.</Text>
        ) : (
          stats.leeches.slice(0, 5).map((card) => {
            const word = getWord(card.wordId);
            if (!word) return null;
            return (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                accessibilityLabel={`Открыть ${word.lemma}`}
                onPress={() => router.push({ pathname: '/word/[id]', params: { id: String(word.id) } })}
                style={({ pressed }) => [
                  styles.leech,
                  { borderColor: theme.line },
                  pressed && { opacity: 0.75 },
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{word.lemma}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>{word.meanings[0]}</Text>
                </View>
                <Text style={{ color: theme.coral, fontSize: 12, fontWeight: '700' }}>{card.lapses}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </Pressable>
            );
          })
        )}
      </Card>

      {stats.introduced === 0 ? (
        <EmptyState
          title="Статистика появится после первого занятия"
          text="Выберите ассоциации для новых слов и оцените первые повторения."
        />
      ) : null}

      <AdPlaceholder />
    </Screen>
  );
}

const styles = StyleSheet.create({
  leech: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
});
