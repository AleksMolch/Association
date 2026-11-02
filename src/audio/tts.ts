/**
 * tts.ts — произношение английских слов.
 *
 * Единственная точка работы с expo-speech: экран не знает деталей движка.
 * Перед новым словом останавливаем предыдущую озвучку.
 */

import * as Speech from 'expo-speech';

export function speakEnglish(text: string, rate: number): void {
  if (!text) return;
  void Speech.stop();
  Speech.speak(text, {
    language: 'en-US',
    rate,
    pitch: 1,
  });
}

export function stopSpeech(): void {
  void Speech.stop();
}
