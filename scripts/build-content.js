#!/usr/bin/env node
/**
 * build-content.js — собирает локальный контент-пак приложения из выгрузки STAGE_2.
 *
 * Источники:
 *   content-source/candidates.json      — слова и переводы
 *   content-source/image_inventory.json — выбранные ассоциации и имена файлов
 *   assets/images/words/*.webp          — готовые иллюстрации
 *
 * Результат:
 *   src/content/words.json              — слова + ассоциации для приложения
 *   src/content/imageMap.ts             — статическая карта require() для Metro
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "content-source");
const IMAGES = path.join(ROOT, "assets", "images", "words");
const OUT_JSON = path.join(ROOT, "src", "content", "words.json");
const OUT_MAP = path.join(ROOT, "src", "content", "imageMap.ts");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function main() {
  const db = readJson(path.join(SRC, "candidates.json"));
  const inventory = readJson(path.join(SRC, "image_inventory.json"));
  const byId = new Map(db.words.map((w) => [w.id, w]));
  const images = new Set(fs.readdirSync(IMAGES).filter((f) => f.endsWith(".webp")));

  const grouped = new Map();
  for (const item of inventory.items) {
    if (!grouped.has(item.wordId)) grouped.set(item.wordId, []);
    grouped.get(item.wordId).push(item);
  }

  const words = [];
  let missing = 0;
  for (const [wordId, items] of grouped) {
    const word = byId.get(wordId);
    if (!word) continue;
    items.sort((a, b) => a.variant - b.variant);
    const mnemonics = items.map((it) => {
      const exists = images.has(it.filename);
      if (!exists) missing += 1;
      return {
        id: wordId + "-" + it.variant,
        cueWord: it.cue,
        sceneText: it.sceneRu || "",
        image: exists ? it.filename : "placeholder.png",
        sortOrder: it.variant,
        status: "approved",
      };
    });
    words.push({
      id: word.id,
      lemma: word.lemma,
      ipa: word.ipa,
      ruPronunciation: word.ruPron,
      meanings: [word.translation],
      mnemonics,
    });
  }

  words.sort((a, b) => a.id - b.id);
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), words }, null, 1),
    "utf8"
  );

  const files = [...images].sort();
  const mapLines = files.map(
    (f) => "  " + JSON.stringify(f) + ": require(\"../../assets/images/words/" + f + "\"),"
  );
  const out = [
    "/**",
    " * imageMap.ts — статическая карта иллюстраций для Metro.",
    " *",
    " * Файл сгенерирован scripts/build-content.js. Не редактировать вручную.",
    " * Metro не умеет динамические require(), поэтому каждая картинка объявлена статически.",
    " */",
    "// @ts-nocheck",
    "",
    "export const WORD_IMAGES: Record<string, number> = {",
    ...mapLines,
    "  \"placeholder.png\": require(\"../../assets/images/placeholder.png\"),",
    "};",
    "",
  ];
  fs.writeFileSync(OUT_MAP, out.join("\n"), "utf8");

  const totalMnemonics = words.reduce((sum, w) => sum + w.mnemonics.length, 0);
  console.log("Слов:", words.length);
  console.log("Ассоциаций:", totalMnemonics);
  console.log("Изображений найдено:", images.size, "| заменено плейсхолдером:", missing);
  console.log("Записано:", path.relative(ROOT, OUT_JSON), "|", path.relative(ROOT, OUT_MAP));
}

main();
