/**
 * (tabs)/_layout.tsx — нижняя навигация приложения.
 *
 * Четыре раздела MVP: Сегодня, Слова, Прогресс, Настройки.
 * Иконки Ionicons, активный цвет — бирюзовый акцент темы.
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/theme/theme';

export default function TabsLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.line,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Сегодня',
          tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={typeof color === 'string' ? color : theme.textMuted} />,
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: 'Слова',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={typeof color === 'string' ? color : theme.textMuted} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Прогресс',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={typeof color === 'string' ? color : theme.textMuted} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={typeof color === 'string' ? color : theme.textMuted} />,
        }}
      />
    </Tabs>
  );
}
