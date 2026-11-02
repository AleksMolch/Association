/**
 * ui.tsx — базовые компоненты интерфейса.
 *
 * Единые кнопки, карточки, чипы и состояния. Все размеры рассчитаны на
 * минимальную область нажатия 44 pt и системное масштабирование текста.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, useAppTheme } from '@/theme/theme';

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const content = (
    <View style={[{ padding: spacing.lg, gap: spacing.lg }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const palette = {
    primary: { bg: theme.accent, border: theme.accent, text: '#FFFFFF' },
    secondary: { bg: theme.card, border: theme.lineStrong, text: theme.text },
    ghost: { bg: 'transparent', border: 'transparent', text: theme.text },
    danger: { bg: theme.coral, border: theme.coral, text: '#FFFFFF' },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && { opacity: 0.82 },
        (disabled || loading) && { opacity: 0.45 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonLabel, { color: palette.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderColor: theme.line,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.md,
          padding: spacing.lg,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accentSoft : theme.card,
          borderColor: selected ? theme.accent : theme.line,
        },
        pressed && { opacity: 0.75 },
      ]}>
      <Text style={{ color: selected ? theme.accent : theme.text, fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ height: 8, borderRadius: radius.pill, backgroundColor: theme.accentSoft, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${clamped * 100}%`, backgroundColor: theme.accent }} />
    </View>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 120,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.line,
        backgroundColor: theme.card,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: 2,
      }}>
      <Text style={{ color: theme.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700' }}>{value}</Text>
      {hint ? <Text style={{ color: theme.textMuted, fontSize: 11 }}>{hint}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      {hint ? <Text style={{ color: theme.textMuted, fontSize: 13 }}>{hint}</Text> : null}
    </View>
  );
}

export function Divider() {
  const theme = useAppTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.line }} />;
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 320 }}>{text}</Text>
      {action}
    </View>
  );
}

export function AdPlaceholder() {
  const theme = useAppTheme();
  return (
    <View
      accessibilityLabel="Рекламное место"
      style={{
        borderWidth: StyleSheet.hairlineWidth,
        borderStyle: 'dashed',
        borderColor: theme.lineStrong,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'center',
        gap: 2,
      }}>
      <Text style={{ color: theme.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        Реклама
      </Text>
      <Text style={{ color: theme.textMuted, fontSize: 12 }}>Место для баннера</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
