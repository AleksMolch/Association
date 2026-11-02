/**
 * (tabs)/settings.tsx — настройки обучения и данные.
 *
 * Здесь меняются дневная цель, скорость TTS, подсказки, напоминания и
 * reduced motion. Очистка прогресса требует подтверждения.
 */

import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { content } from '@/content';
import { disableDailyReminder, enableDailyReminder } from '@/notifications/reminders';
import { useApp } from '@/state/app-context';
import { spacing, useAppTheme } from '@/theme/theme';
import { AppButton, Card, Chip, Divider, SectionTitle, Screen } from '@/components/ui';

const GOALS = [5, 10, 15, 20] as const;
const TTS_RATES = [0.7, 0.9, 1.1] as const;

function Row({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right: React.ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{title}</Text>
        {hint ? <Text style={{ color: theme.textMuted, fontSize: 12 }}>{hint}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { settings, updateSetting, clearAll, stats } = useApp();
  const [busy, setBusy] = useState(false);
  const mnemonicsCount = content.words.reduce((sum, word) => sum + word.mnemonics.length, 0);

  const toggleReminder = async (value: boolean) => {
    if (value) {
      setBusy(true);
      const ok = await enableDailyReminder(settings.reminderHour, settings.reminderMinute);
      setBusy(false);
      if (!ok) {
        Alert.alert(
          'Не удалось включить напоминание',
          'Разрешите уведомления в настройках устройства. На web напоминания недоступны.'
        );
        return;
      }
      updateSetting('remindersEnabled', true);
    } else {
      await disableDailyReminder();
      updateSetting('remindersEnabled', false);
    }
  };

  const confirmClear = () => {
    Alert.alert(
      'Очистить прогресс?',
      'Будут удалены карточки, история повторений и выбранные ассоциации. Контент слов останется.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: () => {
            clearAll();
            Alert.alert('Готово', 'Прогресс обучения очищен.');
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>Настройки</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>Всё хранится только на этом устройстве.</Text>
      </View>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle title="Занятие" hint="Дневная цель новых слов" />
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {GOALS.map((goal) => (
            <Chip
              key={goal}
              label={`${goal} слов`}
              selected={settings.dailyGoal === goal}
              onPress={() => updateSetting('dailyGoal', goal)}
            />
          ))}
        </View>
        <Divider />
        <Row
          title="Подсказки"
          hint="Показывать основную ассоциацию во время повторения"
          right={
            <Switch
              value={settings.hintsEnabled}
              onValueChange={(value) => updateSetting('hintsEnabled', value)}
              trackColor={{ false: theme.lineStrong, true: theme.accentSoft }}
              thumbColor={settings.hintsEnabled ? theme.accent : theme.card}
            />
          }
        />
        <Row
          title="Письменные упражнения"
          hint="Появятся в следующем обновлении"
          right={
            <Switch
              value={settings.writingEnabled}
              onValueChange={(value) => updateSetting('writingEnabled', value)}
              trackColor={{ false: theme.lineStrong, true: theme.accentSoft }}
              thumbColor={settings.writingEnabled ? theme.accent : theme.card}
            />
          }
        />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle title="Произношение" hint="Скорость встроенного TTS" />
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {TTS_RATES.map((rate) => (
            <Chip
              key={rate}
              label={rate.toFixed(1) + 'x'}
              selected={settings.ttsRate === rate}
              onPress={() => updateSetting('ttsRate', rate)}
            />
          ))}
        </View>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          Используется системный английский голос. Если его нет, установите голос в настройках ОС.
        </Text>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle title="Напоминания" hint="Локальные уведомления" />
        <Row
          title="Ежедневное напоминание"
          hint={`${String(settings.reminderHour).padStart(2, '0')}:${String(settings.reminderMinute).padStart(2, '0')}`}
          right={
            <Switch
              disabled={busy}
              value={settings.remindersEnabled}
              onValueChange={(value) => void toggleReminder(value)}
              trackColor={{ false: theme.lineStrong, true: theme.accentSoft }}
              thumbColor={settings.remindersEnabled ? theme.accent : theme.card}
            />
          }
        />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle title="Внешний вид" hint="Системная тема" />
        <Row
          title="Уменьшить движение"
          hint="Отключает лишние анимации"
          right={
            <Switch
              value={settings.reducedMotion}
              onValueChange={(value) => updateSetting('reducedMotion', value)}
              trackColor={{ false: theme.lineStrong, true: theme.accentSoft }}
              thumbColor={settings.reducedMotion ? theme.accent : theme.card}
            />
          }
        />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle title="Данные" hint="Локальный контент-пак" />
        <Row title="Версия контента" right={<Text style={{ color: theme.textMuted }}>{content.version}</Text>} />
        <Row title="Слов" right={<Text style={{ color: theme.textMuted }}>{content.words.length}</Text>} />
        <Row title="Ассоциаций" right={<Text style={{ color: theme.textMuted }}>{mnemonicsCount}</Text>} />
        <Row title="Изучается" right={<Text style={{ color: theme.textMuted }}>{stats.introduced}</Text>} />
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          Экспорт и синхронизация в MVP отсутствуют. Реклама подключается отдельным адаптером.
        </Text>
        <AppButton
          label="Очистить прогресс"
          variant="danger"
          onPress={confirmClear}
          icon={<Ionicons name="trash-outline" size={18} color="#fff" />}
        />
      </Card>

      <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center' }}>
        Association · English → Russian · офлайн-обучение
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
});
