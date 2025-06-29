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

// === DEBUG WHY "ab" SHOWS MULTIPLE INFLECTION MATCHES ===
console.log('\n=== Debugging why "ab" shows multiple inflection matches ===');

// Get the preposition entry for "ab"
const abPrepEntry = dictionary.entries[5]; // We know from previous debug this is the PREP entry
console.log('Dictionary entry for "ab" preposition:');
console.log(`Stems: ${JSON.stringify(abPrepEntry.stems)}`);
console.log(`Part: ${JSON.stringify(abPrepEntry.part)}`);
console.log(`Meaning: ${abPrepEntry.mean}`);

console.log('\n=== Looking for PREP inflections that match "ab" ===');

// Find all PREP inflections with empty ending (since "ab" is the complete word)
const prepInflections = inflectionDb.inflections.filter(inf => 
  inf.qual.pofs === 'PREP' && inf.ending === ''
);

console.log(`Found ${prepInflections.length} PREP inflections with empty ending:`);
prepInflections.forEach((inf, i) => {
  console.log(`${i + 1}. ${JSON.stringify(inf)}`);
});

console.log('\n=== Simulating findInflectionMatches for "ab" ===');

// Simulate what happens in findInflectionMatches
const word = 'ab';
const possibleMatches = [];

for (const inflection of inflectionDb.inflections) {
  const stem = inflectionDb.removeEnding(word, inflection.ending);
  if (stem) {
    // Check if we can find the stem in dictionary
    const entries = dictionary.findByStem(stem);
    
    for (const entry of entries) {
      if (entry.part.pofs === inflection.qual.pofs) {
        // This is a potential match
        if (entry === abPrepEntry) { // Focus on our "ab" preposition entry
          possibleMatches.push({
            stem: stem,
            inflection: inflection,
            entry: entry,
            validated: analyzer.validateInflection(entry, inflection)
          });
        }
      }
    }
  }
}

console.log(`Found ${possibleMatches.length} potential inflection matches for "ab" PREP entry:`);
possibleMatches.forEach((match, i) => {
  console.log(`${i + 1}. Stem: "${match.stem}", Ending: "${match.inflection.ending}", Validated: ${match.validated}`);
  console.log(`   Inflection: ${JSON.stringify(match.inflection)}`);
  console.log(`   Would create result: "${match.stem}${match.inflection.ending}"`);
  console.log('');
});

console.log('\n=== Checking exact vs inflection match logic ===');

// Look at the exact match logic
console.log('Exact match check:');
console.log('- "ab" is a PREP (preposition)');
console.log('- Prepositions are in the list of indeclinable words for exact matching');
console.log('- So "ab" gets ONE exact match result');

console.log('\nInflection match check:');
console.log('- The analyzer ALSO tries inflection matching');
console.log('- It finds PREP inflections with empty endings');
console.log('- These create ADDITIONAL matches for the same dictionary entry');
console.log('- This is why we see 4 results instead of 1');

console.log('\n=== The Bug: Logic Issue in findInflectionMatches ===');
console.log('The problem is that findInflectionMatches is being called even for');
console.log('indeclinable words like prepositions. For indeclinable words,');
console.log('only exact matches should be returned, not inflection matches.');

console.log('\n=== Solution ===');
console.log('The findInflectionMatches method should skip words that already');
console.log('have exact matches as indeclinable words (PREP, CONJ, ADV, INTERJ).');
console.log('OR the exact match logic should exclude words that appear');
console.log('in inflection tables from getting inflection matches.');