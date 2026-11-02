/**
 * theme.ts — визуальные токены приложения.
 *
 * Палитра повторяет «Иллюстрированный атлас»: бумажный фон, графитовый текст,
 * бирюзовый и коралловый акценты. Тёмная тема — производная той же палитры.
 */

import { useColorScheme } from 'react-native';

export type AppTheme = {
  dark: boolean;
  background: string;
  card: string;
  cardMuted: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  coral: string;
  coralSoft: string;
  line: string;
  lineStrong: string;
  success: string;
  warning: string;
  danger: string;
  imageBackground: string;
  overlay: string;
};

export const lightTheme: AppTheme = {
  dark: false,
  background: '#F5F7F7',
  card: '#FFFFFF',
  cardMuted: '#EDF2F2',
  text: '#24282B',
  textMuted: '#5C686C',
  accent: '#12786F',
  accentSoft: 'rgba(18,120,111,0.10)',
  coral: '#CE514F',
  coralSoft: 'rgba(206,81,79,0.10)',
  line: '#D6DEDE',
  lineStrong: '#A9B7B7',
  success: '#2E7D5B',
  warning: '#A86B17',
  danger: '#B23A38',
  imageBackground: '#E8EEEE',
  overlay: 'rgba(36,40,43,0.35)',
};

export const darkTheme: AppTheme = {
  dark: true,
  background: '#101515',
  card: '#182020',
  cardMuted: '#202A2A',
  text: '#F2F5F5',
  textMuted: '#A9B7B7',
  accent: '#4FB3A8',
  accentSoft: 'rgba(79,179,168,0.14)',
  coral: '#E0736F',
  coralSoft: 'rgba(224,115,111,0.14)',
  line: '#2C3838',
  lineStrong: '#3D4D4D',
  success: '#6CC49A',
  warning: '#E0A85C',
  danger: '#F08A86',
  imageBackground: '#1B2424',
  overlay: 'rgba(0,0,0,0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
