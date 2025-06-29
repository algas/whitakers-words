#!/usr/bin/env node

import { WordAnalyzer } from '../src/analyzer.js';
import { Dictionary } from '../src/dictionary.js';
import { InflectionDatabase } from '../src/inflections.js';
import { PartOfSpeech } from '../src/types.js';

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

// First, test findInflectionMatches directly
console.log('\n=== Direct call to findInflectionMatches ===');
const directResults = analyzer.findInflectionMatches('amatus');
console.log(`Found ${directResults.length} results:`);
directResults.forEach((result, i) => {
  const pofsDisplay = (result.inflection && result.inflection.qual.pofs === PartOfSpeech.VPAR) ? 'VPAR' : result.dictEntry.part.pofs;
  console.log(`${i + 1}. ${pofsDisplay} (from ${result.dictEntry.part.pofs}) - ${result.dictEntry.mean.substring(0, 30)}...`);
});

// Now test the full analyze method
console.log('\n=== Full analyze method ===');
const fullResults = analyzer.analyze('amatus');
console.log(`Found ${fullResults.length} results:`);
fullResults.forEach((result, i) => {
  const pofsDisplay = (result.inflection && result.inflection.qual.pofs === PartOfSpeech.VPAR) ? 'VPAR' : result.dictEntry.part.pofs;
  console.log(`${i + 1}. ${pofsDisplay} (from ${result.dictEntry.part.pofs}) - ${result.dictEntry.mean.substring(0, 30)}...`);
});

// Let's manually check if the difference is in the exact matches
console.log('\n=== Manual step-by-step analysis ===');
const word = 'amatus';
const preprocessed = analyzer.preprocessWord(word);
console.log(`Preprocessed word: "${preprocessed}"`);

const exactMatches = analyzer.findExactMatches(preprocessed);
console.log(`Exact matches: ${exactMatches.length}`);

const hasExactPersonalPronoun = exactMatches.some(m => 
  m.dictEntry.part.pofs === PartOfSpeech.PRON && m.dictEntry.part.pron.decl === 5);
console.log(`Has exact personal pronoun: ${hasExactPersonalPronoun}`);

if (!hasExactPersonalPronoun) {
  console.log('Running inflection matches...');
  const inflectionMatches = analyzer.findInflectionMatches(preprocessed);
  console.log(`Inflection matches: ${inflectionMatches.length}`);
  inflectionMatches.forEach((result, i) => {
    const pofsDisplay = (result.inflection && result.inflection.qual.pofs === PartOfSpeech.VPAR) ? 'VPAR' : result.dictEntry.part.pofs;
    console.log(`  ${i + 1}. ${pofsDisplay} (from ${result.dictEntry.part.pofs})`);
  });
}

const trickMatches = analyzer.applyPrefixTricks(preprocessed);
console.log(`Trick matches: ${trickMatches.length}`);

const allResults = [...exactMatches, ...analyzer.findInflectionMatches(preprocessed), ...trickMatches];
console.log(`Total combined results: ${allResults.length}`);
allResults.forEach((result, i) => {
  const pofsDisplay = (result.inflection && result.inflection.qual.pofs === PartOfSpeech.VPAR) ? 'VPAR' : result.dictEntry.part.pofs;
  console.log(`  ${i + 1}. ${pofsDisplay} (from ${result.dictEntry.part.pofs})`);
});