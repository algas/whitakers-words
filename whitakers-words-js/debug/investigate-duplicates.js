#!/usr/bin/env node

import { WordAnalyzer } from '../src/analyzer.js';
import { Dictionary } from '../src/dictionary.js';
import { InflectionDatabase } from '../src/inflections.js';

// Configuration
const DICT_FILE = '../DICTLINE.GEN';
const INFLECTS_FILE = '../INFLECTS.LAT';

// Get word from command line argument
const word = process.argv[2];
if (!word) {
  console.log('Usage: node debug/investigate-duplicates.js [word]');
  console.log('Example: node debug/investigate-duplicates.js ab');
  process.exit(1);
}

console.log(`=== Investigating duplicates for "${word}" ===\n`);

// Load data
console.log('Loading dictionary and inflections...');
const dictionary = new Dictionary();
dictionary.loadFromDictline(DICT_FILE);

const inflectionDb = new InflectionDatabase(INFLECTS_FILE);
const analyzer = new WordAnalyzer(dictionary, inflectionDb);

console.log(`Loaded ${dictionary.entries.length} dictionary entries`);
console.log(`Loaded ${inflectionDb.inflections.length} inflections\n`);

// 1. Check dictionary entries for the word
console.log('=== Dictionary Entries ===');
const entries = dictionary.findByStem(word);
console.log(`Found ${entries.length} dictionary entries for stem "${word}":\n`);

entries.forEach((entry, i) => {
  const index = dictionary.entries.indexOf(entry);
  console.log(`${i + 1}. Entry index: ${index}`);
  console.log(`   Part of Speech: ${entry.part.pofs}`);
  console.log(`   Stems: ${JSON.stringify({
    stem1: entry.stems.stem1.trim(),
    stem2: entry.stems.stem2.trim(), 
    stem3: entry.stems.stem3.trim(),
    stem4: entry.stems.stem4.trim()
  })}`);
  console.log(`   Part details: ${JSON.stringify(entry.part)}`);
  console.log(`   Translation: ${JSON.stringify(entry.tran)}`);
  console.log(`   Meaning: ${entry.mean}`);
  console.log('');
});

// 2. Check stem index
console.log('=== Stem Index ===');
const stemIndexEntries = dictionary.stemIndex.get(word.toLowerCase()) || [];
console.log(`Stem index for "${word}" contains ${stemIndexEntries.length} entry indices: [${stemIndexEntries.join(', ')}]\n`);

stemIndexEntries.forEach((index, i) => {
  const entry = dictionary.entries[index];
  console.log(`${i + 1}. Index ${index}: ${entry.part.pofs}`);
  console.log(`   Stems: ${entry.stems.stem1.trim()} | ${entry.stems.stem2.trim()} | ${entry.stems.stem3.trim()} | ${entry.stems.stem4.trim()}`);
  console.log(`   Meaning: ${entry.mean.substring(0, 60)}...`);
  console.log('');
});

// 3. Full analysis results
console.log('=== Analysis Results ===');
const results = analyzer.analyze(word);
console.log(`WordAnalyzer.analyze("${word}") returned ${results.length} results:\n`);

results.forEach((result, i) => {
  const entryIndex = dictionary.entries.indexOf(result.dictEntry);
  console.log(`${i + 1}. ${analyzer.formatInflectionLine(result)}`);
  console.log(`   Dictionary entry index: ${entryIndex}`);
  console.log(`   Inflection: ${result.inflection ? 'present' : 'null'}`);
  console.log('');
});

// 4. Check for duplicate entries in dictionary
console.log('=== Duplicate Detection ===');
const seenEntries = new Map();
let duplicateCount = 0;
const duplicates = [];

dictionary.entries.forEach((entry, index) => {
  // Create a unique key for each entry based on its content
  const key = `${JSON.stringify(entry.stems)}-${JSON.stringify(entry.part)}-${entry.mean.trim()}`;
  
  if (seenEntries.has(key)) {
    duplicates.push({
      original: seenEntries.get(key),
      duplicate: index,
      entry: entry
    });
    duplicateCount++;
  } else {
    seenEntries.set(key, index);
  }
});

console.log(`Total duplicate entries found in dictionary: ${duplicateCount}\n`);

if (duplicates.length > 0) {
  console.log('Sample duplicates:');
  duplicates.slice(0, 5).forEach((dup, i) => {
    console.log(`${i + 1}. Original at index ${dup.original}, duplicate at index ${dup.duplicate}`);
    console.log(`   ${dup.entry.part.pofs} - "${dup.entry.mean.substring(0, 50)}..."`);
  });
}

// 5. Check which entries contain the word in any stem position
console.log('\n=== All Entries Containing Word ===');
const allMatches = [];
dictionary.entries.forEach((entry, index) => {
  const stems = [
    entry.stems.stem1.trim().toLowerCase(),
    entry.stems.stem2.trim().toLowerCase(),
    entry.stems.stem3.trim().toLowerCase(), 
    entry.stems.stem4.trim().toLowerCase()
  ];
  
  if (stems.includes(word.toLowerCase())) {
    allMatches.push({ index, entry });
  }
});

console.log(`Found ${allMatches.length} entries with "${word}" in any stem position:\n`);
allMatches.forEach(({ index, entry }, i) => {
  console.log(`${i + 1}. Index ${index}: ${entry.part.pofs}`);
  console.log(`   Stems: "${entry.stems.stem1.trim()}" | "${entry.stems.stem2.trim()}" | "${entry.stems.stem3.trim()}" | "${entry.stems.stem4.trim()}"`);
  console.log(`   Meaning: ${entry.mean.substring(0, 60)}...`);
  console.log('');
});

console.log('=== Investigation Complete ===');