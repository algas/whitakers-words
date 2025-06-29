#!/usr/bin/env node

import { WordAnalyzer } from './src/analyzer.js';
import { Dictionary } from './src/dictionary.js';
import { InflectionDatabase } from './src/inflections.js';

// Test with real data files
const dictFile = '/Users/yamauchi/temp/whitakers-words/DICTLINE.GEN';
const inflectsFile = '/Users/yamauchi/temp/whitakers-words/INFLECTS.LAT';

console.log('Loading real dictionary and inflections...');

const dictionary = new Dictionary();
dictionary.loadFromDictline(dictFile);

const inflectionDb = new InflectionDatabase(inflectsFile);
const analyzer = new WordAnalyzer(dictionary, inflectionDb);

console.log(`Loaded ${dictionary.entries.length} dictionary entries`);
console.log(`Loaded ${inflectionDb.inflections.length} inflections`);

// === DEBUG "ab" PREPOSITION ISSUE ===
console.log('\n=== Debugging "ab" preposition duplicates ===');

console.log('\n1. Raw Dictionary.findByStem("ab") results:');
const abEntries = dictionary.findByStem('ab');
console.log(`Found ${abEntries.length} dictionary entries for stem "ab":`);

abEntries.forEach((entry, i) => {
  console.log(`${i + 1}. Entry index in dictionary: ${dictionary.entries.indexOf(entry)}`);
  console.log(`   Part of Speech: ${entry.part.pofs}`);
  console.log(`   Stems: ${JSON.stringify(entry.stems)}`);
  console.log(`   Part details: ${JSON.stringify(entry.part)}`);
  console.log(`   Translation info: ${JSON.stringify(entry.tran)}`);
  console.log(`   Meaning: ${entry.mean}`);
  console.log('');
});

console.log('\n2. Stem index debug - what indexes are mapped to "ab":');
const stemIndexEntries = dictionary.stemIndex.get('ab') || [];
console.log(`Stem index for "ab" contains ${stemIndexEntries.length} entry indices: [${stemIndexEntries.join(', ')}]`);

stemIndexEntries.forEach((index, i) => {
  const entry = dictionary.entries[index];
  console.log(`${i + 1}. Index ${index}: ${entry.part.pofs} - stems: ${JSON.stringify(entry.stems)}`);
});

console.log('\n3. Full analysis of "ab" using WordAnalyzer:');
const results = analyzer.analyze('ab');
console.log(`WordAnalyzer.analyze("ab") returned ${results.length} results:`);

results.forEach((result, i) => {
  console.log(`\n${i + 1}. ${analyzer.formatOutput(result)}`);
  console.log(`   Raw result data:`);
  console.log(`   - Dictionary entry index: ${dictionary.entries.indexOf(result.dictEntry)}`);
  console.log(`   - Stems: ${JSON.stringify(result.stem)}`);
  console.log(`   - Part: ${JSON.stringify(result.dictEntry.part)}`);
  console.log(`   - Inflection: ${result.inflection ? JSON.stringify(result.inflection) : 'null'}`);
});

console.log('\n4. Checking for duplicate entries in dictionary:');
const seenEntries = new Map();
let duplicateCount = 0;

dictionary.entries.forEach((entry, index) => {
  // Create a unique key for each entry based on its content
  const key = `${JSON.stringify(entry.stems)}-${JSON.stringify(entry.part)}-${entry.mean.trim()}`;
  
  if (seenEntries.has(key)) {
    console.log(`DUPLICATE FOUND:`);
    console.log(`  Original at index: ${seenEntries.get(key)}`);
    console.log(`  Duplicate at index: ${index}`);
    console.log(`  Content: ${entry.part.pofs} - ${JSON.stringify(entry.stems)} - "${entry.mean.substring(0, 50)}..."`);
    duplicateCount++;
  } else {
    seenEntries.set(key, index);
  }
});

console.log(`\nTotal duplicate entries found in dictionary: ${duplicateCount}`);

console.log('\n5. Checking which stems contain "ab":');
const abStems = [];
dictionary.entries.forEach((entry, index) => {
  if (entry.stems.stem1.trim().toLowerCase() === 'ab' ||
      entry.stems.stem2.trim().toLowerCase() === 'ab' ||
      entry.stems.stem3.trim().toLowerCase() === 'ab' ||
      entry.stems.stem4.trim().toLowerCase() === 'ab') {
    abStems.push({ index, entry });
  }
});

console.log(`Found ${abStems.length} entries with "ab" in any stem position:`);
abStems.forEach(({ index, entry }, i) => {
  console.log(`${i + 1}. Index ${index}: ${entry.part.pofs}`);
  console.log(`   stem1: "${entry.stems.stem1}" | stem2: "${entry.stems.stem2}" | stem3: "${entry.stems.stem3}" | stem4: "${entry.stems.stem4}"`);
  console.log(`   Meaning: ${entry.mean.substring(0, 60)}...`);
});