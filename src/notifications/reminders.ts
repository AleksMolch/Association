/**
 * reminders.ts — локальные напоминания о занятии.
 *
 * Уведомления включаются только после явного согласия пользователя.
 * В Expo Go часть возможностей может быть ограничена; ошибки не ломают UI.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function enableDailyReminder(hour: number, minute: number): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) return false;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Пора повторить слова',
        body: 'Короткое занятие поможет удержать прогресс.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function disableDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ничего не делаем: напоминание могло быть уже отключено
  }
}
