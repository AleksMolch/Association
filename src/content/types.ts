/**
 * types.ts — типы контент-пака приложения.
 *
 * Слово содержит перевод, произношение и 1–5 ассоциаций.
 * Ассоциация ссылается на локальный файл иллюстрации по имени.
 */

export type MnemonicStatus = 'approved';

export type Mnemonic = {
  id: string;
  cueWord: string;
  sceneText: string;
  image: string;
  sortOrder: number;
  status: MnemonicStatus;
};

export type Word = {
  id: number;
  lemma: string;
  ipa: string;
  ruPronunciation: string;
  meanings: string[];
  mnemonics: Mnemonic[];
};

export type ContentPack = {
  version: number;
  generatedAt: string;
  words: Word[];
};
