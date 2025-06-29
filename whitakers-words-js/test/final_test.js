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

// Test various forms to ensure VPAR is working correctly
const testWords = ['amatus', 'laudatus', 'vocatus', 'monitus', 'auditus'];

console.log('\n=== Testing VPAR recognition for various words ===');

for (const word of testWords) {
  console.log(`\n--- Testing "${word}" ---`);
  const results = analyzer.analyze(word);
  
  const vparResults = results.filter(r => r.inflection && r.inflection.qual.pofs === PartOfSpeech.VPAR);
  const adjResults = results.filter(r => r.dictEntry.part.pofs === PartOfSpeech.ADJ);
  
  console.log(`Total results: ${results.length}`);
  console.log(`VPAR results: ${vparResults.length}`);
  console.log(`ADJ results: ${adjResults.length}`);
  
  if (vparResults.length > 0) {
    console.log('VPAR analysis:');
    vparResults.forEach((result, i) => {
      console.log(`  ${i+1}. ${analyzer.formatInflectionLine(result)}`);
      console.log(`     ${analyzer.formatDictionaryForm(result)}`);
    });
  }
  
  if (adjResults.length > 0) {
    console.log('ADJ analysis:');
    adjResults.forEach((result, i) => {
      console.log(`  ${i+1}. ${analyzer.formatInflectionLine(result)}`);
      console.log(`     ${analyzer.formatDictionaryForm(result)}`);
    });
  }
}

// Test a word that should clearly be a participle
console.log('\n=== Testing clear participle case ===');
const participle = 'amatus';
const results = analyzer.analyze(participle);

console.log(`\nComplete analysis of "${participle}":`);
results.forEach((result, i) => {
  console.log(`\n${i + 1}. ${analyzer.formatOutput(result)}`);
  console.log('    ---');
});