/**
 * word/[id].tsx — карточка слова и выбор/замена ассоциации.
 *
 * Замена ассоциации не сбрасывает FSRS: обновляется только основной mnemonic
 * и история выбора. Если карточки ещё нет, выбор ассоциации создаёт её.
 */

import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getMnemonic, getWord, primaryMnemonic } from '@/content';
import { formatNextReview, stateLabel } from '@/domain/fsrs';
import { speakEnglish } from '@/audio/tts';
import { useApp } from '@/state/app-context';
import { spacing, useAppTheme } from '@/theme/theme';
import { AppButton, Card, EmptyState, SectionTitle, Screen } from '@/components/ui';
import { AssociationView, MnemonicDeck, WordHeader } from '@/components/word';

export default function WordDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const wordId = Number(params.id);
  const word = getWord(wordId);
  const { cardByWord, preferred, settings, selectMnemonic } = useApp();
  const card = word ? cardByWord.get(word.id) : undefined;
  const preferredId = word ? preferred.get(word.id) : undefined;
  const preferredMnemonic = word ? getMnemonic(word, preferredId) : undefined;
  const initialMnemonic = word ? preferredMnemonic ?? primaryMnemonic(word) : undefined;
  const initialDeckIndex =
    word && initialMnemonic
      ? Math.max(0, word.mnemonics.findIndex((m) => m.id === initialMnemonic.id))
      : 0;
  const [showDeck, setShowDeck] = useState(!preferredMnemonic);
  const [deckIndex, setDeckIndex] = useState(initialDeckIndex);

  if (!word) {
    return (
      <Screen>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
          onPress={() => router.back()}
          style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <EmptyState title="Слово не найдено" text="Вернитесь к списку слов." />
      </Screen>
    );
  }

  const mnemonics = [...word.mnemonics].sort((a, b) => a.sortOrder - b.sortOrder);
  const deckMnemonic = mnemonics[deckIndex] ?? mnemonics[0];

  const choose = () => {
    if (!deckMnemonic) return;
    selectMnemonic(word.id, deckMnemonic.id, preferredMnemonic ? 'replace' : 'initial');
    setShowDeck(false);
    Alert.alert(
      'Ассоциация выбрана',
      preferredMnemonic
        ? 'Новая связка будет использоваться в будущих повторениях. Прогресс FSRS сохранён.'
        : 'Слово добавлено в изучение. Связка появится в повторениях.'
    );
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>Слово #{word.id}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть карточку слова"
          onPress={() => router.back()}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
      </View>

      <WordHeader word={word} onSpeak={() => speakEnglish(word.lemma, settings.ttsRate)} />

      <Card style={{ gap: 4 }}>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>Перевод</Text>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '600' }}>{word.meanings[0]}</Text>
      </Card>

      {card ? (
        <Card style={{ gap: 4 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>Статус FSRS</Text>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>
            {stateLabel(card.state)} · следующий повтор {formatNextReview(card.due)}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            Повторов: {card.reps} · срывов: {card.lapses}
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            Слово ещё не в изучении. Выберите ассоциацию — и оно появится в повторениях.
          </Text>
        </Card>
      )}

      {preferredMnemonic && !showDeck ? (
        <View style={{ gap: spacing.md }}>
          <SectionTitle title="Основная ассоциация" hint="Используется в повторениях" />
          <AssociationView mnemonic={preferredMnemonic} />
          <AppButton label="Заменить ассоциацию" variant="secondary" onPress={() => setShowDeck(true)} />
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <SectionTitle
            title="Выберите ассоциацию"
            hint="Свайпните варианты и подтвердите выбор кнопкой"
          />
          <MnemonicDeck mnemonics={mnemonics} index={deckIndex} onChange={setDeckIndex} />
          <AppButton
            label={deckMnemonic ? `Выбрать «${deckMnemonic.cueWord}»` : 'Выбрать ассоциацию'}
            onPress={choose}
            disabled={!deckMnemonic}
          />
          {preferredMnemonic ? (
            <AppButton label="Отмена" variant="ghost" onPress={() => setShowDeck(false)} />
          ) : null}
        </View>
      )}
    </Screen>
  );
}
