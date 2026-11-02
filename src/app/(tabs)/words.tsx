/**
 * (tabs)/words.tsx — список слов с поиском и фильтрами.
 *
 * Список не показывает ассоциацию постоянно: только слово, перевод и статус
 * FSRS. Детали и замена ассоциации открываются на отдельном экране.
 */

import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { words } from '@/content';
import type { Word } from '@/content/types';
import { isDue, stateLabel } from '@/domain/fsrs';
import { useApp } from '@/state/app-context';
import { radius, spacing, useAppTheme } from '@/theme/theme';
import { AdPlaceholder, Chip, EmptyState } from '@/components/ui';

type Filter = 'all' | 'due' | 'new' | 'learning' | 'hard';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'due', label: 'К повторению' },
  { key: 'new', label: 'Новые' },
  { key: 'learning', label: 'Изучаются' },
  { key: 'hard', label: 'Сложные' },
];

export default function WordsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { cardByWord, preferred } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    return words
      .filter((word) => {
        if (q) {
          const haystack = (word.lemma + ' ' + word.meanings.join(' ')).toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        const card = cardByWord.get(word.id);
        if (filter === 'due') return !!card && isDue(card, now);
        if (filter === 'new') return !card;
        if (filter === 'learning') return !!card && (card.state === 1 || card.state === 3);
        if (filter === 'hard') return !!card && card.lapses >= 3;
        return true;
      })
      .sort((a, b) => a.lemma.localeCompare(b.lemma, 'en'));
  }, [query, filter, cardByWord]);

  const renderItem = ({ item }: { item: Word }) => {
    const card = cardByWord.get(item.id);
    const hasMnemonic = preferred.has(item.id);
    const due = card ? isDue(card, new Date()) : false;
    const status = card ? (due ? 'К повторению' : stateLabel(card.state)) : 'Новое';
    const statusColor = !card ? theme.accent : due ? theme.coral : theme.textMuted;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть слово ${item.lemma}`}
        onPress={() => router.push({ pathname: '/word/[id]', params: { id: String(item.id) } })}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.card, borderColor: theme.line },
          pressed && { opacity: 0.8 },
        ]}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700' }}>{item.lemma}</Text>
            {hasMnemonic ? <Ionicons name="bookmark" size={12} color={theme.accent} /> : null}
          </View>
          <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 13 }}>
            {item.meanings[0]}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>{status}</Text>
          {card ? (
            <Text style={{ color: theme.textMuted, fontSize: 10 }}>
              {card.lapses > 0 ? `срывов: ${card.lapses}` : `повторов: ${card.reps}`}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>Слова</Text>
        <View
          style={[
            styles.search,
            { borderColor: theme.line, backgroundColor: theme.card },
          ]}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск: слово или перевод"
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, color: theme.text, fontSize: 15, paddingVertical: 0 }}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Поиск слов"
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск" onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110, gap: spacing.sm }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title="Ничего не найдено"
            text="Измените запрос или выберите другой фильтр."
          />
        }
        ListFooterComponent={rows.length > 0 ? <AdPlaceholder /> : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 60,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
});
