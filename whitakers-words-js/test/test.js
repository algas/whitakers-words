import { test } from 'node:test';
import assert from 'node:assert';
import { WordAnalyzer } from '../src/analyzer.js';
import { Dictionary } from '../src/dictionary.js';
import { InflectionDatabase } from '../src/inflections.js';
import { EnglishLookup } from '../src/english-lookup.js';

test('Inflection database loads correctly', () => {
  const db = new InflectionDatabase();
  assert(db.inflections.length > 0, 'Should have inflections loaded');
});

test('Dictionary can find stems', () => {
  const dict = Dictionary.createSampleDictionary();
  
  const results = dict.findByStem('am');
  assert(results.length > 0, 'Should find "am" stem');
  assert.equal(results[0].part.pofs, 'V', 'Should be a verb');
});

test('Word analyzer can parse "amat"', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase();
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('amat');
  assert(results.length > 0, 'Should parse "amat"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'V', 'Should be a verb');
  assert(result.dictEntry.mean.includes('love'), 'Should mean "love"');
});

test('Word analyzer can parse "puella"', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase();
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('puella');
  assert(results.length > 0, 'Should parse "puella"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'N', 'Should be a noun');
  assert(result.dictEntry.mean.includes('girl'), 'Should mean "girl"');
});

test('Word analyzer can parse "bonum"', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase();
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('bonum');
  assert(results.length > 0, 'Should parse "bonum"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'ADJ', 'Should be an adjective');
  assert(result.dictEntry.mean.includes('good'), 'Should mean "good"');
});

test('English lookup works', () => {
  const dict = Dictionary.createSampleDictionary();
  const lookup = new EnglishLookup(dict);
  
  const results = lookup.lookup('love');
  assert(results.size > 0, 'Should find "love"');
  assert(results.has('V'), 'Should have verb entries');
});

test('Exact match for conjunctions', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase();
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('et');
  assert(results.length > 0, 'Should parse "et"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'CONJ', 'Should be a conjunction');
  assert(result.dictEntry.mean.includes('and'), 'Should mean "and"');
});

console.log('All tests completed!');