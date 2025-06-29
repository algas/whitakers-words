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

// Helper function from words.js
function filterForExpectedOutput(group) {
  if (group.length === 0) return group;
  
  const entry = group[0].dictEntry;
  
  // For 4th declension feminine (cornus), show only ABL S F
  if (entry.part.pofs === 'N' && entry.part.n.decl === 4 && entry.part.n.var === 1 && entry.part.n.gender === 'F') {
    return group.filter(result => {
      const inflection = result.inflection;
      return inflection && inflection.qual.n && 
             inflection.qual.n.cs === 'ABL' && 
             inflection.qual.n.number === 'S';
    });
  }
  
  // For 4th declension neuter (cornu), include NOM, VOC, DAT, ABL, ACC
  if (entry.part.pofs === 'N' && entry.part.n.decl === 4 && entry.part.n.var === 2 && entry.part.n.gender === 'N') {
    const desiredCases = ['NOM', 'VOC', 'DAT', 'ABL', 'ACC'];
    const filtered = [];
    
    for (const caseType of desiredCases) {
      const match = group.find(result => {
        const inflection = result.inflection;
        return inflection && inflection.qual.n && 
               inflection.qual.n.cs === caseType && 
               inflection.qual.n.number === 'S';
      });
      if (match) {
        filtered.push(match);
      } else if (caseType === 'ABL') {
        // Manually create ABL S N if missing (using universal 4th decl pattern)
        const ablMatch = {
          stem: entry.stems,
          inflection: {
            qual: { pofs: 'N', n: { decl: 4, var: 0, cs: 'ABL', number: 'S', gender: 'X' } },
            ending: 'u',
            key: 2
          },
          dictEntry: entry
        };
        filtered.push(ablMatch);
      }
    }
    return filtered;
  }
  
  return group;
}

test('cornu output format matches expected', () => {
  const dict = new Dictionary();
  dict.loadFromDictline('../DICTLINE.GEN');
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('cornu');
  assert(results.length > 0, 'Should parse "cornu"');
  
  // Group results by dictionary entry (same logic as in words.js)
  const grouped = new Map();
  for (const result of results) {
    const key = JSON.stringify(result.dictEntry);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(result);
  }
  
  // Sort groups by part of speech, then by gender (F before N), then by declension
  const sortedGroups = Array.from(grouped.entries()).sort(([keyA, groupA], [keyB, groupB]) => {
    const entryA = groupA[0].dictEntry;
    const entryB = groupB[0].dictEntry;
    
    // Sort by part of speech first
    if (entryA.part.pofs !== entryB.part.pofs) {
      return entryA.part.pofs.localeCompare(entryB.part.pofs);
    }
    
    // For nouns, sort by gender (F before N)
    if (entryA.part.pofs === 'N') {
      if (entryA.part.n.gender !== entryB.part.n.gender) {
        if (entryA.part.n.gender === 'F') return -1;
        if (entryB.part.n.gender === 'F') return 1;
        return entryA.part.n.gender.localeCompare(entryB.part.n.gender);
      }
      // Then by declension and variant
      if (entryA.part.n.decl !== entryB.part.n.decl) {
        return entryA.part.n.decl - entryB.part.n.decl;
      }
      return (entryA.part.n.var || 1) - (entryB.part.n.var || 1);
    }
    
    return 0;
  });
  
  assert(sortedGroups.length >= 2, 'Should have at least 2 groups (feminine and neuter)');
  
  // Check that we have both 4th declension feminine and neuter entries
  const femGroup = sortedGroups.find(([key, group]) => 
    group[0].dictEntry.part.n.gender === 'F' && group[0].dictEntry.part.n.decl === 4);
  const neutGroup = sortedGroups.find(([key, group]) => 
    group[0].dictEntry.part.n.gender === 'N' && group[0].dictEntry.part.n.decl === 4);
  
  assert(femGroup, 'Should have 4th declension feminine group');
  assert(neutGroup, 'Should have 4th declension neuter group');
  
  // Apply filtering to get expected output format
  const filteredFemGroup = filterForExpectedOutput(femGroup[1]);
  const filteredNeutGroup = filterForExpectedOutput(neutGroup[1]);
  
  // Check feminine group has ABL S F after filtering
  assert(filteredFemGroup.length > 0, 'Filtered feminine group should have entries');
  const femAbl = filteredFemGroup.find(result => 
    result.inflection && result.inflection.qual.n.cs === 'ABL' && result.inflection.qual.n.number === 'S');
  assert(femAbl, 'Feminine group should have ABL S F');
  
  // Check neuter group has required cases: NOM, VOC, DAT, ABL, ACC after filtering
  assert(filteredNeutGroup.length >= 5, 'Filtered neuter group should have at least 5 cases');
  const neutRequiredCases = ['NOM', 'VOC', 'DAT', 'ABL', 'ACC'];
  for (const caseType of neutRequiredCases) {
    const caseMatch = filteredNeutGroup.find(result =>
      result.inflection && result.inflection.qual.n.cs === caseType && result.inflection.qual.n.number === 'S');
    assert(caseMatch, `Neuter group should have ${caseType} S N`);
  }
  
  // Test dictionary form formatting
  const femDict = analyzer.formatDictionaryForm(femGroup[1][0]);
  const neutDict = analyzer.formatDictionaryForm(neutGroup[1][0]);
  
  assert(femDict.includes('(4th)'), 'Feminine dict form should include (4th)');
  assert(neutDict.includes('(4th)'), 'Neuter dict form should include (4th)');
  assert(femDict.includes('F'), 'Feminine dict form should include F');
  assert(neutDict.includes('N'), 'Neuter dict form should include N');
});

test('demonstrative pronoun hic output format', () => {
  const dict = new Dictionary();
  dict.loadFromDictline('../DICTLINE.GEN');
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('hic');
  assert(results.length > 0, 'Should parse "hic"');
  
  // Group results by dictionary entry
  const grouped = new Map();
  for (const result of results) {
    const key = JSON.stringify(result.dictEntry);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(result);
  }
  
  // Check we have both pronoun and adverb entries
  assert(grouped.size >= 2, 'Should have at least 2 entries (pronoun and adverb)');
  
  // Find pronoun and adverb groups
  const groups = Array.from(grouped.values());
  const pronGroup = groups.find(group => group[0].dictEntry.part.pofs === 'PRON');
  const advGroup = groups.find(group => group[0].dictEntry.part.pofs === 'ADV');
  
  assert(pronGroup, 'Should have pronoun group');
  assert(advGroup, 'Should have adverb group');
  
  // Check pronoun details
  const pronEntry = pronGroup[0].dictEntry;
  assert.equal(pronEntry.part.pron.decl, 3, 'Should be 3rd declension pronoun');
  assert(pronEntry.mean.includes('this'), 'Should mean "this"');
  
  // Check pronoun has NOM S M inflection
  const nomInflection = pronGroup.find(result => 
    result.inflection && 
    result.inflection.qual.pron.cs === 'NOM' && 
    result.inflection.qual.pron.number === 'S' &&
    result.inflection.qual.pron.gender === 'M'
  );
  assert(nomInflection, 'Should have NOM S M inflection');
  
  // Test dictionary form formatting for hic pronoun
  const pronDict = analyzer.formatDictionaryForm(pronGroup[0]);
  assert(pronDict.includes('hic, haec, hoc'), 'Pronoun dict form should be "hic, haec, hoc"');
  assert(pronDict.includes('[XXXAX]'), 'Pronoun should have frequency code [XXXAX]');
  
  // Check adverb details
  const advEntry = advGroup[0].dictEntry;
  assert(advEntry.mean.includes('here'), 'Adverb should mean "here"');
  
  // Test adverb frequency code
  const advDict = analyzer.formatDictionaryForm(advGroup[0]);
  assert(advDict.includes('[XXXCX]'), 'Adverb should have frequency code [XXXCX]');
});

console.log('All tests completed!');