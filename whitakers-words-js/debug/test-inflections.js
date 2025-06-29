#!/usr/bin/env node

import { WordAnalyzer } from '../src/analyzer.js';
import { Dictionary } from '../src/dictionary.js';
import { InflectionDatabase } from '../src/inflections.js';
import { PartOfSpeech } from '../src/types.js';

// Configuration
const DICT_FILE = '../DICTLINE.GEN';
const INFLECTS_FILE = '../INFLECTS.LAT';

// Get word from command line argument
const word = process.argv[2];
if (!word) {
  console.log('Usage: node debug/test-inflections.js [word]');
  console.log('Example: node debug/test-inflections.js amatus');
  process.exit(1);
}

console.log(`=== Testing inflections for "${word}" ===\n`);

// Load data
console.log('Loading dictionary and inflections...');
const dictionary = new Dictionary();
dictionary.loadFromDictline(DICT_FILE);

const inflectionDb = new InflectionDatabase(INFLECTS_FILE);
const analyzer = new WordAnalyzer(dictionary, inflectionDb);

console.log(`Loaded ${dictionary.entries.length} dictionary entries`);
console.log(`Loaded ${inflectionDb.inflections.length} inflections\n`);

// 1. Test direct inflection matching
console.log('=== Direct Inflection Matching ===');
const directResults = analyzer.findInflectionMatches(word);
console.log(`findInflectionMatches("${word}") returned ${directResults.length} results:\n`);

directResults.forEach((result, i) => {
  const displayPofs = (result.inflection && result.inflection.qual.pofs === PartOfSpeech.VPAR) ? 'VPAR' : result.dictEntry.part.pofs;
  console.log(`${i + 1}. ${displayPofs} (from ${result.dictEntry.part.pofs})`);
  console.log(`   Stem: "${result.stem.stem1.trim()}"`);
  console.log(`   Inflection: ${JSON.stringify(result.inflection)}`);
  console.log(`   Meaning: ${result.dictEntry.mean.substring(0, 50)}...`);
  console.log('');
});

// 2. Test full analysis
console.log('=== Full Analysis ===');
const fullResults = analyzer.analyze(word);
console.log(`analyze("${word}") returned ${fullResults.length} results:\n`);

fullResults.forEach((result, i) => {
  const displayPofs = (result.inflection && result.inflection.qual.pofs === PartOfSpeech.VPAR) ? 'VPAR' : result.dictEntry.part.pofs;
  console.log(`${i + 1}. ${displayPofs} (from ${result.dictEntry.part.pofs})`);
  console.log(`   Meaning: ${result.dictEntry.mean.substring(0, 50)}...`);
});

// 3. Manual inflection analysis
console.log('\n=== Manual Inflection Analysis ===');
const preprocessed = analyzer.preprocessWord(word);
console.log(`Preprocessed word: "${word}" -> "${preprocessed}"`);

// Find possible endings
const possibleEndings = [];
for (const inflection of inflectionDb.inflections) {
  if (word.endsWith(inflection.ending) && inflection.ending.length > 0) {
    const stem = word.substring(0, word.length - inflection.ending.length);
    if (stem.length > 0) {
      possibleEndings.push({
        ending: inflection.ending,
        stem: stem,
        inflection: inflection
      });
    }
  }
}

console.log(`\nFound ${possibleEndings.length} possible ending matches:`);
possibleEndings.slice(0, 10).forEach((match, i) => {
  console.log(`${i + 1}. Ending: "${match.ending}", Stem: "${match.stem}", POFS: ${match.inflection.qual.pofs}`);
});

// 4. Test specific inflection types
console.log('\n=== Inflection Type Analysis ===');

const inflectionTypes = {};
for (const inflection of inflectionDb.inflections) {
  const pofs = inflection.qual.pofs;
  if (!inflectionTypes[pofs]) inflectionTypes[pofs] = [];
  inflectionTypes[pofs].push(inflection);
}

console.log('Available inflection types:');
Object.keys(inflectionTypes).forEach(pofs => {
  console.log(`- ${pofs}: ${inflectionTypes[pofs].length} inflections`);
});

// 5. Test specific endings that match the word
const wordEndings = [];
for (let i = 1; i <= word.length; i++) {
  const ending = word.substring(word.length - i);
  const matchingInflections = inflectionDb.inflections.filter(inf => inf.ending === ending);
  if (matchingInflections.length > 0) {
    wordEndings.push({
      ending: ending,
      count: matchingInflections.length,
      inflections: matchingInflections
    });
  }
}

console.log(`\nEndings in "${word}" that match inflection database:`);
wordEndings.forEach(endingInfo => {
  console.log(`- "${endingInfo.ending}": ${endingInfo.count} matching inflections`);
  endingInfo.inflections.slice(0, 3).forEach(inf => {
    console.log(`  * ${inf.qual.pofs} - ${JSON.stringify(inf.qual)}`);
  });
});

console.log('\n=== Testing Complete ===');