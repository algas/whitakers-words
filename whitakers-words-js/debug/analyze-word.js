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
  console.log('Usage: node debug/analyze-word.js [word]');
  console.log('Example: node debug/analyze-word.js populusque');
  process.exit(1);
}

console.log(`=== Analyzing "${word}" ===\n`);

// Load data
console.log('Loading dictionary and inflections...');
const dictionary = new Dictionary();
dictionary.loadFromDictline(DICT_FILE);

const inflectionDb = new InflectionDatabase(INFLECTS_FILE);
const analyzer = new WordAnalyzer(dictionary, inflectionDb);

console.log(`Loaded ${dictionary.entries.length} dictionary entries`);
console.log(`Loaded ${inflectionDb.inflections.length} inflections\n`);

// Full analysis
console.log('=== Complete Analysis ===');
const results = analyzer.analyze(word);
console.log(`Found ${results.length} analysis results:\n`);

results.forEach((result, i) => {
  console.log(`${i + 1}. ${analyzer.formatInflectionLine(result)}`);
  
  // Skip dictionary form for Roman numerals and TACKON
  const isRomanNumeral = result.dictEntry.mean.includes('as a ROMAN NUMERAL');
  const isTackon = result.dictEntry.part.pofs === 'TACKON';
  
  if (!isRomanNumeral && !isTackon) {
    console.log(`${analyzer.formatDictionaryForm(result)}`);
  }
  
  // Clean up pipe characters from continuation lines
  const cleanMeaning = result.dictEntry.mean.replace(/\n\|+/g, '\n').replace(/^\|+/, '');
  console.log(cleanMeaning);
  console.log('');
});

// Detailed breakdown
console.log('=== Step-by-Step Analysis ===');

const preprocessed = analyzer.preprocessWord(word);
console.log(`1. Preprocessed word: "${word}" -> "${preprocessed}"`);

// Check for Roman numerals
if (/^[IVXLCDM]+$/i.test(word)) {
  console.log('2. Roman numeral detected - skipping other analysis steps');
} else {
  // Check for enclitics first
  const enclitics = ['que', 've', 'ne'];
  let encliticFound = false;
  
  for (const suffix of enclitics) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const base = word.substring(0, word.length - suffix.length);
      console.log(`2. Enclitic "${suffix}" detected, base word: "${base}"`);
      encliticFound = true;
      break;
    }
  }
  
  if (!encliticFound) {
    console.log('2. No enclitics detected');
    
    // Exact matches
    const exactMatches = analyzer.findExactMatches(preprocessed);
    console.log(`3. Exact matches: ${exactMatches.length}`);
    
    if (exactMatches.length > 0) {
      exactMatches.forEach((match, i) => {
        console.log(`   ${i + 1}. ${match.dictEntry.part.pofs} - ${match.dictEntry.mean.substring(0, 50)}...`);
      });
    }
    
    // Inflection matches
    const inflectionMatches = analyzer.findInflectionMatches(preprocessed);
    console.log(`4. Inflection matches: ${inflectionMatches.length}`);
    
    if (inflectionMatches.length > 0) {
      inflectionMatches.forEach((match, i) => {
        const displayPofs = (match.inflection && match.inflection.qual.pofs === PartOfSpeech.VPAR) ? 'VPAR' : match.dictEntry.part.pofs;
        console.log(`   ${i + 1}. ${displayPofs} - ${match.dictEntry.mean.substring(0, 50)}...`);
      });
    }
    
    // Prefix tricks
    const prefixMatches = analyzer.applyPrefixTricks(preprocessed);
    console.log(`5. Prefix matches: ${prefixMatches.length}`);
    
    if (prefixMatches.length > 0) {
      prefixMatches.forEach((match, i) => {
        console.log(`   ${i + 1}. Prefix "${match.prefix}" + ${match.dictEntry.part.pofs} - ${match.dictEntry.mean.substring(0, 50)}...`);
      });
    }
  }
}

// Dictionary lookup details
console.log('\n=== Dictionary Lookup Details ===');
const stemEntries = dictionary.findByStem(preprocessed);
console.log(`Entries with stem "${preprocessed}": ${stemEntries.length}`);

stemEntries.forEach((entry, i) => {
  console.log(`${i + 1}. ${entry.part.pofs} - ${entry.mean.substring(0, 60)}...`);
  console.log(`   Stems: ${JSON.stringify({
    stem1: entry.stems.stem1.trim(),
    stem2: entry.stems.stem2.trim(),
    stem3: entry.stems.stem3.trim(),
    stem4: entry.stems.stem4.trim()
  })}`);
});

console.log('\n=== Analysis Complete ===');