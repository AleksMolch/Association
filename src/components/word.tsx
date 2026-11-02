/**
 * word.tsx — карточка слова и свайп-дек ассоциаций.
 *
 * Дек — горизонтальный FlatList с постраничной прокруткой: он надёжно работает
 * на iOS, Android и web, а точки и стрелки дублируют свайп для доступности.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { WORD_IMAGES } from '@/content/imageMap';
import type { Mnemonic, Word } from '@/content/types';
import { useApp } from '@/state/app-context';
import { radius, spacing, useAppTheme } from '@/theme/theme';

const PLACEHOLDER = WORD_IMAGES['placeholder.png'];

export function MnemonicImage({ mnemonic }: { mnemonic: Mnemonic }) {
  const theme = useAppTheme();
  const { settings } = useApp();
  const source = WORD_IMAGES[mnemonic.image] ?? PLACEHOLDER;
  return (
    <Image
      source={source}
      style={[styles.image, { backgroundColor: theme.imageBackground }]}
      contentFit="cover"
      transition={settings.reducedMotion ? 0 : 120}
      accessibilityLabel={'Иллюстрация: ' + mnemonic.sceneText}
    />
  );
}

export function WordHeader({ word, onSpeak }: { word: Word; onSpeak: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Text
          selectable
          style={{ flexShrink: 1, color: theme.text, fontSize: 32, fontWeight: '800', lineHeight: 38 }}>
          {word.lemma}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Произнести ' + word.lemma}
          onPress={onSpeak}
          hitSlop={8}
          style={({ pressed }) => [
            styles.speak,
            { borderColor: theme.line, backgroundColor: theme.card },
            pressed && { opacity: 0.7 },
          ]}>
          <Ionicons name="volume-high" size={20} color={theme.accent} />
        </Pressable>
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 14 }}>
        {word.ipa} · {word.ruPronunciation}
      </Text>
    </View>
  );
}

export function AssociationView({
  mnemonic,
  index,
  total,
}: {
  mnemonic: Mnemonic;
  index?: number;
  total?: number;
}) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <MnemonicImage mnemonic={mnemonic} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        <View
          style={{
            backgroundColor: theme.accentSoft,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.md,
            paddingVertical: 4,
          }}>
          <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 14 }}>
            Ключ: {mnemonic.cueWord}
          </Text>
        </View>
        {typeof index === 'number' && typeof total === 'number' ? (
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            Вариант {index + 1} из {total}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: theme.text, fontSize: 15, lineHeight: 21 }}>{mnemonic.sceneText}</Text>
    </View>
  );
}

export function MnemonicDeck({
  mnemonics,
  index,
  onChange,
}: {
  mnemonics: Mnemonic[];
  index: number;
  onChange: (index: number) => void;
}) {
  const theme = useAppTheme();
  const { settings } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const listRef = useRef<FlatList<Mnemonic>>(null);

  useEffect(() => {
    if (width <= 0) return;
    if (mnemonics.length <= 1) return;
    listRef.current?.scrollToOffset({ offset: index * width, animated: !settings.reducedMotion });
  }, [index, width, mnemonics.length, settings.reducedMotion]);

  const goTo = (next: number) => {
    const bounded = Math.max(0, Math.min(mnemonics.length - 1, next));
    onChange(bounded);
    if (width > 0) {
      listRef.current?.scrollToOffset({ offset: bounded * width, animated: !settings.reducedMotion });
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ width: '100%', maxWidth: Math.min(windowWidth - spacing.lg * 2, 720) }}>
        {width > 0 ? (
          <FlatList
            ref={listRef}
            data={mnemonics}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(event) => {
              const next = Math.round(event.nativeEvent.contentOffset.x / width);
              onChange(Math.max(0, Math.min(mnemonics.length - 1, next)));
            }}
            renderItem={({ item, index: itemIndex }) => (
              <View style={{ width }}>
                <AssociationView mnemonic={item} index={itemIndex} total={mnemonics.length} />
              </View>
            )}
          />
        ) : null}
      </View>

      {mnemonics.length > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Предыдущая ассоциация"
            onPress={() => goTo(index - 1)}
            disabled={index === 0}
            hitSlop={8}
            style={{ opacity: index === 0 ? 0.35 : 1 }}>
            <Ionicons name="chevron-back" size={22} color={theme.accent} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {mnemonics.map((m, i) => (
              <View
                key={m.id}
                style={{
                  width: i === index ? 18 : 7,
                  height: 7,
                  borderRadius: radius.pill,
                  backgroundColor: i === index ? theme.accent : theme.lineStrong,
                }}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Следующая ассоциация"
            onPress={() => goTo(index + 1)}
            disabled={index === mnemonics.length - 1}
            hitSlop={8}
            style={{ opacity: index === mnemonics.length - 1 ? 0.35 : 1 }}>
            <Ionicons name="chevron-forward" size={22} color={theme.accent} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
  },
  speak: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
