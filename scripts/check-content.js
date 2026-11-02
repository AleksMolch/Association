#!/usr/bin/env node
/**
 * check-content.js — проверка целостности контент-пака.
 *
 * Проверяет уникальность id, наличие ассоциаций, существование изображений
 * или явную замену плейсхолдером. Запускается в CI/локально перед сборкой.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const pack = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "content", "words.json"), "utf8"));
const images = new Set(fs.readdirSync(path.join(ROOT, "assets", "images", "words")).filter((f) => f.endsWith(".webp")));

const wordIds = new Set();
const mnemonicIds = new Set();
const problems = [];
let totalMnemonics = 0;
let placeholders = 0;

for (const word of pack.words) {
  if (wordIds.has(word.id)) problems.push("duplicate word id " + word.id);
  wordIds.add(word.id);
  if (!word.lemma || !word.ipa || !word.meanings?.length) {
    problems.push("word " + word.id + " has empty required fields");
  }
  if (!Array.isArray(word.mnemonics) || word.mnemonics.length === 0) {
    problems.push("word " + word.id + " has no mnemonics");
    continue;
  }
  for (const m of word.mnemonics) {
    totalMnemonics += 1;
    if (mnemonicIds.has(m.id)) problems.push("duplicate mnemonic id " + m.id);
    mnemonicIds.add(m.id);
    if (!m.cueWord || !m.sceneText) problems.push("mnemonic " + m.id + " has empty cue/scene");
    if (m.image === "placeholder.png") {
      placeholders += 1;
    } else if (!images.has(m.image)) {
      problems.push("missing image " + m.image + " for " + m.id);
    }
  }
}

console.log("Слов:", pack.words.length);
console.log("Ассоциаций:", totalMnemonics);
console.log("Плейсхолдеров:", placeholders);
console.log("Проблем:", problems.length);
for (const p of problems.slice(0, 20)) console.log(" -", p);
if (problems.length) process.exit(1);
