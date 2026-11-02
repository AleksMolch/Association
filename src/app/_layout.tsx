/**
 * _layout.tsx — корневой layout приложения.
 *
 * Подключает провайдер состояния, безопасные отступы и стек экранов.
 * Вкладки находятся в группе (tabs); занятие и карточка слова — отдельные
 * stack-экраны, чтобы их можно было открыть поверх вкладок.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '@/state/app-context';
import { useAppTheme } from '@/theme/theme';

export default function RootLayout() {
  const theme = useAppTheme();
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="session" options={{ gestureEnabled: false }} />
          <Stack.Screen name="word/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
