#!/usr/bin/env node

import { WordAnalyzer } from '../src/analyzer.js';
import { Dictionary } from '../src/dictionary.js';
import { InflectionDatabase } from '../src/inflections.js';

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

// Test with "amatus"
console.log('\n=== Testing "amatus" with real data ===');
const results = analyzer.analyze('amatus');

console.log(`Found ${results.length} results:`);
results.forEach((result, i) => {
  console.log(`\n${i + 1}. ${analyzer.formatOutput(result)}`);
});

// Let's also check what's in the dictionary for "amo" and "amatus"
console.log('\n=== Dictionary entries for "am" stem ===');
const amEntries = dictionary.findByStem('am');
console.log(`Found ${amEntries.length} entries for "am":`);
amEntries.forEach((entry, i) => {
  console.log(`${i + 1}. ${entry.part.pofs} - stems: ${JSON.stringify(entry.stems)} - ${entry.mean.substring(0, 50)}...`);
});

console.log('\n=== Dictionary entries for "amat" stem ===');
const amatEntries = dictionary.findByStem('amat');
console.log(`Found ${amatEntries.length} entries for "amat":`);
amatEntries.forEach((entry, i) => {
  console.log(`${i + 1}. ${entry.part.pofs} - stems: ${JSON.stringify(entry.stems)} - ${entry.mean.substring(0, 50)}...`);
});

// Check VPAR inflections
console.log('\n=== VPAR inflections with "us" ending ===');
const vparInflections = inflectionDb.inflections.filter(inf => 
  inf.qual.pofs === 'VPAR' && inf.ending === 'us'
);
console.log(`Found ${vparInflections.length} VPAR inflections with "us" ending:`);
vparInflections.forEach((inf, i) => {
  console.log(`${i + 1}. ${JSON.stringify(inf)}`);
});