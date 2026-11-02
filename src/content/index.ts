/**
 * index.ts — доступ к локальному контент-паку.
 *
 * Слова импортируются из сгенерированного words.json; карта изображений
 * импортируется отдельно, чтобы Metro заранее включил все ассеты в бандл.
 */

import pack from './words.json';
import type { ContentPack, Mnemonic, Word } from './types';

export const content = pack as ContentPack;

export const words: Word[] = content.words;

export const wordById: Map<number, Word> = new Map(words.map((word) => [word.id, word]));

export function getWord(id: number): Word | undefined {
  return wordById.get(id);
}

export function getMnemonic(word: Word, mnemonicId: string | null | undefined): Mnemonic | undefined {
  if (!mnemonicId) return undefined;
  return word.mnemonics.find((m) => m.id === mnemonicId);
}

export function primaryMnemonic(word: Word): Mnemonic {
  return [...word.mnemonics].sort((a, b) => a.sortOrder - b.sortOrder)[0];
}
