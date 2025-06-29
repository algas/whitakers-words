import { test } from 'node:test';
import assert from 'node:assert';
import { WordAnalyzer } from '../src/analyzer.js';
import { Dictionary } from '../src/dictionary.js';
import { InflectionDatabase } from '../src/inflections.js';
import { EnglishLookup } from '../src/english-lookup.js';

test('Inflection database loads correctly', () => {
  const db = new InflectionDatabase('../INFLECTS.LAT');
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
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('amat');
  assert(results.length > 0, 'Should parse "amat"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'V', 'Should be a verb');
  assert(result.dictEntry.mean.includes('love'), 'Should mean "love"');
});

test('Word analyzer can parse "puella"', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('puella');
  assert(results.length > 0, 'Should parse "puella"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'N', 'Should be a noun');
  assert(result.dictEntry.mean.includes('girl'), 'Should mean "girl"');
});

test('Word analyzer can parse "bonum"', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('bonum');
  assert(results.length > 0, 'Should parse "bonum"');
  
  // Should find multiple entries (noun and adjective)
  const adjResult = results.find(r => r.dictEntry.part.pofs === 'ADJ');
  assert(adjResult, 'Should find adjective result');
  assert(adjResult.dictEntry.mean.includes('good'), 'Should mean "good"');
  
  const nounResult = results.find(r => r.dictEntry.part.pofs === 'N');
  assert(nounResult, 'Should find noun result');
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
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('et');
  assert(results.length > 0, 'Should parse "et"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'CONJ', 'Should be a conjunction');
  assert(result.dictEntry.mean.includes('and'), 'Should mean "and"');
});

test('Macron handling', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  // Test that mōrēs is converted to mores
  const results1 = analyzer.analyze('mōrēs');
  const results2 = analyzer.analyze('mores');
  
  assert(results1.length > 0, 'Should parse "mōrēs"');
  assert(results2.length > 0, 'Should parse "mores"');
  assert.equal(results1.length, results2.length, 'Should give same results');
  
  // Test preprocessWord function
  assert.equal(analyzer.preprocessWord('mōrēs'), 'mores', 'Should remove macrons');
  assert.equal(analyzer.preprocessWord('amāt'), 'amat', 'Should remove macrons');
  assert.equal(analyzer.preprocessWord('AMĀT'), 'amat', 'Should handle uppercase and macrons');
});

test('Operational examples - agricolarum', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('agricolarum');
  assert(results.length > 0, 'Should parse "agricolarum"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'N', 'Should be a noun');
  assert(result.dictEntry.mean.includes('farmer'), 'Should mean "farmer"');
  
  // Should be genitive plural
  if (result.inflection) {
    assert.equal(result.inflection.qual.n.cs, 'GEN', 'Should be genitive');
    assert.equal(result.inflection.qual.n.number, 'P', 'Should be plural');
  }
});

test('Operational examples - feminae', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('feminae');
  assert(results.length > 0, 'Should parse "feminae"');
  
  // Should find multiple interpretations (gen/dat sing, nom/voc plural)
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'N', 'Should be a noun');
  assert(result.dictEntry.mean.includes('woman'), 'Should mean "woman"');
});

test('Operational examples - ego', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('ego');
  assert.equal(results.length, 1, 'Should parse "ego" with single result');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'PRON', 'Should be a pronoun');
  assert(result.dictEntry.mean.includes('I'), 'Should mean "I"');
  assert(result.dictEntry.mean.includes('PERS'), 'Should include PERS');
  assert(result.dictEntry.mean.includes('REFLEX'), 'Should include REFLEX');
});

test('4th declension - cornu', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('cornu');
  assert(results.length > 0, 'Should parse "cornu"');
  
  // Should find both feminine (cornus) and neuter (cornu) entries
  const femResult = results.find(r => r.dictEntry.part.n.gender === 'F');
  const neutResult = results.find(r => r.dictEntry.part.n.gender === 'N');
  
  assert(femResult, 'Should find feminine result');
  assert(neutResult, 'Should find neuter result');
  
  assert.equal(femResult.dictEntry.part.n.decl, 4, 'Should be 4th declension');
  assert.equal(neutResult.dictEntry.part.n.decl, 4, 'Should be 4th declension');
  
  assert(femResult.dictEntry.mean.includes('cornel'), 'Should mean cornel');
  assert(neutResult.dictEntry.mean.includes('horn'), 'Should mean horn');
});

test('Demonstrative pronoun - illud', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('illud');
  assert(results.length > 0, 'Should parse "illud"');
  
  // Should find multiple forms (NOM and ACC)
  const nomResult = results.find(r => 
    r.inflection && r.inflection.qual.pron.cs === 'NOM' && r.inflection.qual.pron.gender === 'N');
  const accResult = results.find(r => 
    r.inflection && r.inflection.qual.pron.cs === 'ACC' && r.inflection.qual.pron.gender === 'N');
  
  assert(nomResult, 'Should find nominative result');
  assert(accResult, 'Should find accusative result');
  
  assert.equal(nomResult.dictEntry.part.pofs, 'PRON', 'Should be a pronoun');
  assert.equal(nomResult.dictEntry.part.pron.decl, 6, 'Should be 6th declension');
  assert(nomResult.dictEntry.mean.includes('that'), 'Should mean "that"');
});

test('3rd declension adjective and adverb - facile', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('facile');
  assert(results.length > 0, 'Should parse "facile"');
  
  // Should find both adjective and adverb entries
  const adjResults = results.filter(r => r.dictEntry.part.pofs === 'ADJ');
  const advResults = results.filter(r => r.dictEntry.part.pofs === 'ADV');
  
  assert(adjResults.length > 0, 'Should find adjective results');
  assert(advResults.length > 0, 'Should find adverb result');
  
  // Check adjective
  const adjResult = adjResults[0];
  assert.equal(adjResult.dictEntry.part.adj.decl, 3, 'Should be 3rd declension adjective');
  assert(adjResult.dictEntry.mean.includes('easy'), 'Should mean "easy"');
  
  // Should find neuter forms (NOM, VOC, ACC)
  const nomResult = adjResults.find(r => 
    r.inflection && r.inflection.qual.adj.cs === 'NOM' && r.inflection.qual.adj.gender === 'N');
  const vocResult = adjResults.find(r => 
    r.inflection && r.inflection.qual.adj.cs === 'VOC' && r.inflection.qual.adj.gender === 'N');
  const accResult = adjResults.find(r => 
    r.inflection && r.inflection.qual.adj.cs === 'ACC' && r.inflection.qual.adj.gender === 'N');
  
  assert(nomResult, 'Should find nominative neuter result');
  assert(vocResult, 'Should find vocative neuter result');
  assert(accResult, 'Should find accusative neuter result');
  
  // Check adverb
  const advResult = advResults[0];
  assert.equal(advResult.dictEntry.part.pofs, 'ADV', 'Should be an adverb');
  assert(advResult.dictEntry.mean.includes('easily'), 'Should mean "easily"');
});

console.log('All tests completed!');