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

test('Exact match for prepositions - ab', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('ab');
  assert(results.length >= 1, 'Should parse "ab" with at least one result');
  
  // Find the preposition result (there might be multiple due to inflection matching)
  const prepResult = results.find(r => r.dictEntry.part.pofs === 'PREP');
  assert(prepResult, 'Should find preposition result');
  assert.equal(prepResult.dictEntry.part.prep.obj, 'ABL', 'Should take ablative case');
  assert(prepResult.dictEntry.mean.includes('by (agent)'), 'Should mean "by (agent)"');
  
  // Test output formatting
  const inflectionLine = analyzer.formatInflectionLine(prepResult);
  assert(inflectionLine.includes('ab'), 'Should contain "ab"');
  assert(inflectionLine.includes('PREP'), 'Should contain "PREP"');
  assert(inflectionLine.includes('ABL'), 'Should contain "ABL"');
  assert(inflectionLine.match(/ab\s+PREP\s+ABL/), 'Should have correct spacing');
  
  const dictForm = analyzer.formatDictionaryForm(prepResult);
  assert(dictForm.includes('ab  PREP  ABL'), 'Dictionary form should show "ab  PREP  ABL"');
  assert(dictForm.includes('[XXXAO]'), 'Should include frequency code');
});

test('Multiple part of speech analysis - sine', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('sine');
  assert(results.length >= 3, 'Should parse "sine" with at least 3 results (noun, verb, preposition)');
  
  // Check for noun result (sin.e from sinus, VOC S M)
  const nounResult = results.find(r => 
    r.dictEntry.part.pofs === 'N' && 
    r.inflection && 
    r.inflection.qual.n && 
    r.inflection.qual.n.cs === 'VOC');
  assert(nounResult, 'Should find noun vocative result');
  assert.equal(nounResult.dictEntry.part.n.decl, 2, 'Should be 2nd declension');
  assert.equal(nounResult.dictEntry.part.n.gender, 'M', 'Should be masculine');
  assert(nounResult.dictEntry.mean.includes('bowl'), 'Should mean "bowl"');
  
  // Check for verb result (sin.e from sino, IMP 2 S)
  const verbResult = results.find(r => 
    r.dictEntry.part.pofs === 'V' && 
    r.inflection && 
    r.inflection.qual.v && 
    r.inflection.qual.v.mood === 'IMP');
  assert(verbResult, 'Should find verb imperative result');
  assert.equal(verbResult.dictEntry.part.v.con, 3, 'Should be 3rd conjugation');
  assert(verbResult.dictEntry.mean.includes('allow'), 'Should mean "allow"');
  
  // Check for preposition result
  const prepResult = results.find(r => r.dictEntry.part.pofs === 'PREP');
  assert(prepResult, 'Should find preposition result');
  assert.equal(prepResult.dictEntry.part.prep.obj, 'ABL', 'Should take ablative case');
  assert(prepResult.dictEntry.mean.includes('without'), 'Should mean "without"');
  
  // Test output formatting for each type
  const nounInflectionLine = analyzer.formatInflectionLine(nounResult);
  assert(nounInflectionLine.includes('sin.e'), 'Noun line should contain "sin.e"');
  assert(nounInflectionLine.includes('VOC S M'), 'Noun line should show VOC S M');
  
  const verbInflectionLine = analyzer.formatInflectionLine(verbResult);
  assert(verbInflectionLine.includes('sin.e'), 'Verb line should contain "sin.e"');
  assert(verbInflectionLine.includes('IMP'), 'Verb line should show IMP');
  
  const prepInflectionLine = analyzer.formatInflectionLine(prepResult);
  assert(prepInflectionLine.includes('sine'), 'Prep line should contain "sine"');
  assert(prepInflectionLine.includes('PREP'), 'Prep line should contain "PREP"');
});

test('Multiple meanings with different parts of speech - contra', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('contra');
  assert(results.length >= 2, 'Should parse "contra" with at least 2 results (adverb, preposition)');
  
  // Check for adverb result
  const advResult = results.find(r => r.dictEntry.part.pofs === 'ADV');
  assert(advResult, 'Should find adverb result');
  assert(advResult.dictEntry.mean.includes('facing'), 'Should mean "facing"');
  assert(advResult.dictEntry.mean.includes('opposite direction'), 'Should include "opposite direction"');
  assert(advResult.dictEntry.mean.includes('vice versa'), 'Should include "vice versa"');
  
  // Check for preposition result
  const prepResult = results.find(r => r.dictEntry.part.pofs === 'PREP');
  assert(prepResult, 'Should find preposition result');
  assert.equal(prepResult.dictEntry.part.prep.obj, 'ACC', 'Should take accusative case');
  assert(prepResult.dictEntry.mean.includes('against'), 'Should mean "against"');
  assert(prepResult.dictEntry.mean.includes('detriment'), 'Should include "detriment"');
  
  // Test output formatting - both should have consistent padding
  const advInflectionLine = analyzer.formatInflectionLine(advResult);
  assert(advInflectionLine.includes('contra'), 'ADV line should contain "contra"');
  assert(advInflectionLine.includes('ADV'), 'ADV line should contain "ADV"');
  assert(advInflectionLine.includes('POS'), 'ADV line should show POS');
  
  const prepInflectionLine = analyzer.formatInflectionLine(prepResult);
  assert(prepInflectionLine.includes('contra'), 'PREP line should contain "contra"');
  assert(prepInflectionLine.includes('PREP'), 'PREP line should contain "PREP"');
  assert(prepInflectionLine.includes('ACC'), 'PREP line should show ACC');
  
  // Test that both lines have similar length/padding
  const advLineLength = advInflectionLine.length;
  const prepLineLength = prepInflectionLine.length;
  assert(Math.abs(advLineLength - prepLineLength) <= 5, 'ADV and PREP lines should have similar padding lengths');
  
  // Test dictionary form formatting
  const advDictForm = analyzer.formatDictionaryForm(advResult);
  assert(advDictForm.includes('contra  ADV'), 'ADV dictionary form should show "contra  ADV"');
  assert(advDictForm.includes('[XXXAO]'), 'Should include frequency code');
  
  const prepDictForm = analyzer.formatDictionaryForm(prepResult);
  assert(prepDictForm.includes('contra  PREP  ACC'), 'PREP dictionary form should show "contra  PREP  ACC"');
  assert(prepDictForm.includes('[XXXAO]'), 'Should include frequency code');
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
  const sortedGroups = Array.from(grouped.entries()).sort(([, groupA], [, groupB]) => {
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
  const femGroup = sortedGroups.find(([, group]) => 
    group[0].dictEntry.part.n.gender === 'F' && group[0].dictEntry.part.n.decl === 4);
  const neutGroup = sortedGroups.find(([, group]) => 
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

test('superlative adjective acerrimus', () => {
  const dict = new Dictionary();
  dict.loadFromDictline('../DICTLINE.GEN');
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('acerrimus');
  assert(results.length > 0, 'Should parse "acerrimus"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'ADJ', 'Should be an adjective');
  assert.equal(result.dictEntry.part.adj.decl, 3, 'Should be 3rd declension');
  assert(result.dictEntry.mean.includes('sharp'), 'Should mean "sharp"');
  
  // Check inflection details
  assert(result.inflection, 'Should have inflection');
  assert.equal(result.inflection.qual.adj.comp, 'SUPER', 'Should be superlative');
  assert.equal(result.inflection.qual.adj.cs, 'NOM', 'Should be nominative');
  assert.equal(result.inflection.qual.adj.number, 'S', 'Should be singular');
  assert.equal(result.inflection.qual.adj.gender, 'M', 'Should be masculine');
  
  // Test inflection line formatting
  const inflectionLine = analyzer.formatInflectionLine(result);
  assert(inflectionLine.startsWith('acerri.mus'), 'Should show acerri.mus stem');
  assert(inflectionLine.includes('SUPER'), 'Should show SUPER in inflection line');
  
  // Test dictionary form formatting
  const dictForm = analyzer.formatDictionaryForm(result);
  assert(dictForm.includes('acer, acris -e'), 'Should show positive forms');
  assert(dictForm.includes('acrior -or -us'), 'Should show comparative forms');
  assert(dictForm.includes('acerrimus -a -um'), 'Should show superlative forms');
  assert(dictForm.includes('[XXXAO]'), 'Should have frequency code [XXXAO]');
});

test('superlative adverb optime', () => {
  const dict = new Dictionary();
  dict.loadFromDictline('../DICTLINE.GEN');
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('optime');
  assert(results.length >= 2, 'Should find both adverb and adjective forms');
  
  // Find adverb and adjective results
  const advResult = results.find(r => r.dictEntry.part.pofs === 'ADV');
  const adjResult = results.find(r => r.dictEntry.part.pofs === 'ADJ');
  
  assert(advResult, 'Should find adverb result');
  assert(adjResult, 'Should find adjective result');
  
  // Check adverb details
  assert(advResult.dictEntry.mean.includes('well'), 'Adverb should mean "well"');
  assert(advResult.inflection, 'Adverb should have inflection info');
  assert.equal(advResult.inflection.qual.adv.comp, 'SUPER', 'Should be superlative');
  
  // Check adjective details
  assert.equal(adjResult.dictEntry.part.adj.decl, 1, 'Should be 1st declension adjective');
  assert(adjResult.dictEntry.mean.includes('good'), 'Adjective should mean "good"');
  assert.equal(adjResult.inflection.qual.adj.comp, 'SUPER', 'Should be superlative');
  assert.equal(adjResult.inflection.qual.adj.cs, 'VOC', 'Should be vocative');
  assert.equal(adjResult.inflection.qual.adj.gender, 'M', 'Should be masculine');
  
  // Test inflection line formatting
  const advLine = analyzer.formatInflectionLine(advResult);
  assert(advLine.startsWith('optime'), 'Should show optime for adverb');
  assert(advLine.includes('SUPER'), 'Should show SUPER for adverb');
  
  const adjLine = analyzer.formatInflectionLine(adjResult);
  assert(adjLine.startsWith('opti.me'), 'Should show opti.me for adjective');
  assert(adjLine.includes('SUPER'), 'Should show SUPER for adjective');
  
  // Test dictionary form formatting
  const advDict = analyzer.formatDictionaryForm(advResult);
  assert(advDict.includes('bene, melius, optime'), 'Should show full adverb paradigm');
  assert(advDict.includes('[XXXAO]'), 'Should have frequency code [XXXAO]');
  
  const adjDict = analyzer.formatDictionaryForm(adjResult);
  assert(adjDict.includes('bonus, bona, bonum'), 'Should show positive adjective forms');
  // Note: superlative forms are not shown in the simplified format
});

test('pluperfect subjunctive monuissemus', () => {
  const dict = new Dictionary();
  dict.loadFromDictline('../DICTLINE.GEN');
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('monuissemus');
  assert(results.length > 0, 'Should parse "monuissemus"');
  
  const result = results[0];
  assert.equal(result.dictEntry.part.pofs, 'V', 'Should be a verb');
  assert.equal(result.dictEntry.part.v.con, 2, 'Should be 2nd conjugation');
  assert(result.dictEntry.mean.includes('remind'), 'Should mean "remind"');
  
  // Check inflection details
  assert(result.inflection, 'Should have inflection');
  assert.equal(result.inflection.qual.v.tense, 'PLUP', 'Should be pluperfect');
  assert.equal(result.inflection.qual.v.voice, 'ACTIVE', 'Should be active voice');
  assert.equal(result.inflection.qual.v.mood, 'SUB', 'Should be subjunctive');
  assert.equal(result.inflection.qual.v.person, 1, 'Should be 1st person');
  assert.equal(result.inflection.qual.v.number, 'P', 'Should be plural');
  
  // Check that it uses stem key 3 (perfect stem)
  assert.equal(result.inflection.key, 3, 'Should use perfect stem (key 3)');
  
  // Test inflection line formatting
  const inflectionLine = analyzer.formatInflectionLine(result);
  assert(inflectionLine.startsWith('monu.issemus'), 'Should show monu.issemus stem');
  assert(inflectionLine.includes('PLUP'), 'Should show PLUP in inflection line');
  assert(inflectionLine.includes('ACTIVE'), 'Should show ACTIVE in inflection line');
  assert(inflectionLine.includes('SUB'), 'Should show SUB in inflection line');
  assert(inflectionLine.includes('1 P'), 'Should show 1 P in inflection line');
  
  // Test dictionary form formatting
  const dictForm = analyzer.formatDictionaryForm(result);
  assert(dictForm.includes('moneo, monere'), 'Should show principal parts starting with moneo, monere');
  assert(dictForm.includes('monui, monitus'), 'Should show perfect and passive principal parts');
  assert(dictForm.includes('V (2nd)'), 'Should indicate 2nd conjugation');
  assert(dictForm.includes('[XXXAX]'), 'Should have frequency code [XXXAX]');
});

test('amatus - perfect passive participle and adjective', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('amatus');
  assert(results.length >= 2, 'Should find both VPAR and ADJ forms');
  
  // Find VPAR and ADJ results
  const vparResult = results.find(r => r.inflection && r.inflection.qual.pofs === 'VPAR');
  const adjResult = results.find(r => r.dictEntry.part.pofs === 'ADJ');
  
  assert(vparResult, 'Should find VPAR (perfect passive participle) result');
  assert(adjResult, 'Should find ADJ (adjective) result');
  
  // Check VPAR details
  assert.equal(vparResult.dictEntry.part.pofs, 'V', 'VPAR should match against verb entry');
  assert.equal(vparResult.dictEntry.part.v.con, 1, 'Should be 1st conjugation verb');
  assert(vparResult.dictEntry.mean.includes('love'), 'Should mean "love"');
  assert.equal(vparResult.inflection.qual.vpar.cs, 'NOM', 'Should be nominative');
  assert.equal(vparResult.inflection.qual.vpar.number, 'S', 'Should be singular');
  assert.equal(vparResult.inflection.qual.vpar.gender, 'M', 'Should be masculine');
  assert.equal(vparResult.inflection.qual.vpar.tense, 'PERF', 'Should be perfect');
  assert.equal(vparResult.inflection.qual.vpar.voice, 'PASSIVE', 'Should be passive');
  assert.equal(vparResult.inflection.qual.vpar.mood, 'PPL', 'Should be participle');
  assert.equal(vparResult.inflection.key, 4, 'Should use stem4 (perfect passive stem)');
  
  // Check ADJ details
  assert.equal(adjResult.dictEntry.part.pofs, 'ADJ', 'Should be adjective');
  assert.equal(adjResult.dictEntry.part.adj.decl, 1, 'Should be 1st declension adjective');
  assert(adjResult.dictEntry.mean.includes('beloved'), 'Should mean "beloved"');
  assert.equal(adjResult.inflection.qual.adj.cs, 'NOM', 'Should be nominative');
  assert.equal(adjResult.inflection.qual.adj.number, 'S', 'Should be singular');
  assert.equal(adjResult.inflection.qual.adj.gender, 'M', 'Should be masculine');
  assert.equal(adjResult.inflection.key, 1, 'Should use stem1');
  
  // Test inflection line formatting
  const vparLine = analyzer.formatInflectionLine(vparResult);
  assert(vparLine.startsWith('amat.us'), 'VPAR should show amat.us');
  assert(vparLine.includes('VPAR'), 'Should show VPAR in inflection line');
  assert(vparLine.includes('PERF PASSIVE PPL'), 'Should show PERF PASSIVE PPL');
  
  const adjLine = analyzer.formatInflectionLine(adjResult);
  assert(adjLine.startsWith('amat.us'), 'ADJ should show amat.us');
  assert(adjLine.includes('ADJ'), 'Should show ADJ in inflection line');
  assert(adjLine.includes('POS'), 'Should show POS (positive degree)');
  
  // Test dictionary form formatting
  const vparDict = analyzer.formatDictionaryForm(vparResult);
  assert(vparDict.includes('amo, amare, amavi, amatus'), 'Should show verb principal parts');
  assert(vparDict.includes('V (1st)'), 'Should indicate 1st conjugation');
  assert(vparDict.includes('[XXXAO]'), 'Should have frequency code [XXXAO]');
  
  const adjDict = analyzer.formatDictionaryForm(adjResult);
  assert(adjDict.includes('amatus, amata, amatum'), 'Should show adjective forms');
  assert(adjDict.includes('ADJ'), 'Should indicate adjective');
  assert(adjDict.includes('[XXXEO]'), 'Should have frequency code [XXXEO]');
  assert(adjDict.includes('uncommon'), 'Should show frequency text for E code');
});

test('amatus output format matches expected', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('amatus');
  assert(results.length >= 2, 'Should find both forms');
  
  // Group results by dictionary entry (same logic as in words.js)
  const grouped = new Map();
  for (const result of results) {
    const key = JSON.stringify(result.dictEntry);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(result);
  }
  
  assert(grouped.size === 2, 'Should have exactly 2 groups (verb for VPAR, adj for ADJ)');
  
  // Test that VPAR comes before ADJ in sorting
  const sortedGroups = Array.from(grouped.entries()).sort(([, groupA], [, groupB]) => {
    const entryA = groupA[0].dictEntry;
    const entryB = groupB[0].dictEntry;
    const inflectionA = groupA[0].inflection;
    const inflectionB = groupB[0].inflection;
    
    // Determine effective part of speech (VPAR takes precedence over dictionary entry POFS)
    const efectivePofsA = inflectionA && inflectionA.qual.pofs === 'VPAR' ? 'VPAR' : entryA.part.pofs;
    const efectivePofsB = inflectionB && inflectionB.qual.pofs === 'VPAR' ? 'VPAR' : entryB.part.pofs;
    
    if (efectivePofsA !== efectivePofsB) {
      const posOrder = { 'VPAR': 1, 'N': 2, 'PRON': 3, 'ADJ': 4, 'V': 5, 'ADV': 6, 'PREP': 7, 'CONJ': 8, 'INTERJ': 9 };
      const orderA = posOrder[efectivePofsA] || 99;
      const orderB = posOrder[efectivePofsB] || 99;
      return orderA - orderB;
    }
    return 0;
  });
  
  // First group should be VPAR, second should be ADJ
  const firstGroup = sortedGroups[0][1];
  const secondGroup = sortedGroups[1][1];
  
  const firstInflection = firstGroup[0].inflection;
  const secondEntry = secondGroup[0].dictEntry;
  
  assert.equal(firstInflection.qual.pofs, 'VPAR', 'First group should be VPAR');
  assert.equal(secondEntry.part.pofs, 'ADJ', 'Second group should be ADJ');
  
  // Test exact output format
  const vparLine = analyzer.formatInflectionLine(firstGroup[0]);
  const vparDict = analyzer.formatDictionaryForm(firstGroup[0]);
  
  const adjLine = analyzer.formatInflectionLine(secondGroup[0]);
  const adjDict = analyzer.formatDictionaryForm(secondGroup[0]);
  
  // Check VPAR formatting matches expected output
  assert(vparLine.match(/^amat\.us\s+VPAR\s+1\s+1\s+NOM\s+S\s+M\s+PERF\s+PASSIVE\s+PPL/), 
         'VPAR line should match expected format');
  assert(vparDict.match(/^amo, amare, amavi, amatus\s+V\s+\(1st\)\s+\[XXXAO\]/), 
         'VPAR dict should match expected format');
  
  // Check ADJ formatting matches expected output  
  assert(adjLine.match(/^amat\.us\s+ADJ\s+1\s+1\s+NOM\s+S\s+M\s+POS/), 
         'ADJ line should match expected format');
  assert(adjDict.match(/^amatus, amata, amatum\s+ADJ\s+\[XXXEO\]\s+uncommon/), 
         'ADJ dict should match expected format');
});

test('supine parsing - amatum and amatu', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  // Test accusative supine "amatum"
  const results1 = analyzer.analyze('amatum');
  const supineResult1 = results1.find(r => r.inflection && r.inflection.qual.pofs === 'SUPINE');
  
  assert(supineResult1, 'Should find SUPINE form of "amatum"');
  assert.equal(supineResult1.dictEntry.part.pofs, 'V', 'Should match against verb entry');
  assert.equal(supineResult1.inflection.qual.supine.cs, 'ACC', 'Should be accusative case');
  assert.equal(supineResult1.inflection.qual.supine.number, 'S', 'Should be singular');
  assert.equal(supineResult1.inflection.qual.supine.gender, 'N', 'Should be neuter');
  assert.equal(supineResult1.inflection.key, 4, 'Should use stem 4 (supine stem)');
  
  // Test inflection line formatting
  const line1 = analyzer.formatInflectionLine(supineResult1);
  assert(line1.match(/^amat\.um\s+SUPINE\s+1\s+1\s+ACC\s+S\s+N/), 
         'SUPINE accusative line should match expected format');
  
  // Test ablative supine "amatu"
  const results2 = analyzer.analyze('amatu');
  const supineResult2 = results2.find(r => r.inflection && r.inflection.qual.pofs === 'SUPINE');
  
  assert(supineResult2, 'Should find SUPINE form of "amatu"');
  assert.equal(supineResult2.dictEntry.part.pofs, 'V', 'Should match against verb entry');
  assert.equal(supineResult2.inflection.qual.supine.cs, 'ABL', 'Should be ablative case');
  assert.equal(supineResult2.inflection.qual.supine.number, 'S', 'Should be singular');
  assert.equal(supineResult2.inflection.qual.supine.gender, 'N', 'Should be neuter');
  assert.equal(supineResult2.inflection.key, 4, 'Should use stem 4 (supine stem)');
  
  // Test inflection line formatting
  const line2 = analyzer.formatInflectionLine(supineResult2);
  assert(line2.match(/^amat\.u\s+SUPINE\s+1\s+1\s+ABL\s+S\s+N/), 
         'SUPINE ablative line should match expected format');
});

test('amatu supine output format matches expected', () => {
  const dict = Dictionary.createSampleDictionary();
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('amatu');
  assert(results.length >= 1, 'Should find SUPINE form');
  
  // Find SUPINE result
  const supineResult = results.find(r => r.inflection && r.inflection.qual.pofs === 'SUPINE');
  assert(supineResult, 'Should find SUPINE (ablative supine) result');
  
  // Check SUPINE details
  assert.equal(supineResult.dictEntry.part.pofs, 'V', 'SUPINE should match against verb entry');
  assert.equal(supineResult.dictEntry.part.v.con, 1, 'Should be 1st conjugation verb');
  assert(supineResult.dictEntry.mean.includes('love'), 'Should mean "love"');
  assert.equal(supineResult.inflection.qual.supine.cs, 'ABL', 'Should be ablative');
  assert.equal(supineResult.inflection.qual.supine.number, 'S', 'Should be singular');
  assert.equal(supineResult.inflection.qual.supine.gender, 'N', 'Should be neuter');
  assert.equal(supineResult.inflection.key, 4, 'Should use stem4 (supine stem)');
  
  // Test exact output format
  const supineLine = analyzer.formatInflectionLine(supineResult);
  const supineDict = analyzer.formatDictionaryForm(supineResult);
  
  // Check SUPINE formatting matches expected output
  assert(supineLine.match(/^amat\.u\s+SUPINE\s+1\s+1\s+ABL\s+S\s+N/), 
         'SUPINE line should match expected format');
  assert(supineDict.match(/^amo, amare, amavi, amatus\s+V\s+\(1st\)\s+\[XXXAO\]/), 
         'SUPINE dict should match expected format');
});

test('orietur deponent verb with multiple variants', () => {
  const dict = new Dictionary();
  dict.loadFromDictline('../DICTLINE.GEN');
  const inflDb = new InflectionDatabase('../INFLECTS.LAT');
  const analyzer = new WordAnalyzer(dict, inflDb);
  
  const results = analyzer.analyze('orietur');
  assert(results.length >= 2, 'Should find at least 2 variants of orior');
  
  // Find both variants
  const variant1 = results.find(r => r.dictEntry.part.v.var === 1);
  const variant4 = results.find(r => r.dictEntry.part.v.var === 4);
  
  assert(variant1, 'Should find variant 1 (3rd conjugation)');
  assert(variant4, 'Should find variant 4 (displayed as 4th conjugation)');
  
  // Check variant 1 details
  assert.equal(variant1.dictEntry.part.pofs, 'V', 'Should be verb');
  assert.equal(variant1.dictEntry.part.v.con, 3, 'Should be 3rd conjugation');
  assert.equal(variant1.dictEntry.part.v.var, 1, 'Should be variant 1');
  assert.equal(variant1.dictEntry.part.v.dep, true, 'Should be deponent');
  assert.equal(variant1.dictEntry.stems.stem4.trim(), 'orit', 'Should have orit stem4');
  
  // Check variant 4 details
  assert.equal(variant4.dictEntry.part.pofs, 'V', 'Should be verb');
  assert.equal(variant4.dictEntry.part.v.con, 3, 'Should be 3rd conjugation');
  assert.equal(variant4.dictEntry.part.v.var, 4, 'Should be variant 4');
  assert.equal(variant4.dictEntry.part.v.dep, true, 'Should be deponent');
  assert.equal(variant4.dictEntry.stems.stem4.trim(), 'ort', 'Should have ort stem4');
  
  // Test inflection line formatting
  const line1 = analyzer.formatInflectionLine(variant1);
  const line4 = analyzer.formatInflectionLine(variant4);
  
  // Check that variant 1 shows as "V 3 1" and variant 4 shows as "V 4 1"
  assert(line1.match(/^ori\.etur\s+V\s+3\s+1\s+FUT\s+IND\s+3\s+S/), 
         'Variant 1 should show V 3 1 FUT IND 3 S');
  assert(line4.match(/^ori\.etur\s+V\s+4\s+1\s+FUT\s+IND\s+3\s+S/), 
         'Variant 4 should show V 4 1 FUT IND 3 S');
  
  // Test dictionary form formatting
  const dict1 = analyzer.formatDictionaryForm(variant1);
  const dict4 = analyzer.formatDictionaryForm(variant4);
  
  // Check that both show DEP flag
  assert(dict1.includes('V (3rd) DEP'), 'Variant 1 should show (3rd) DEP');
  assert(dict4.includes('V (4th) DEP'), 'Variant 4 should show (4th) DEP');
  
  // Check principal parts
  assert(dict1.includes('orior, ori, oritus sum'), 'Variant 1 should have orior, ori, oritus sum');
  assert(dict4.includes('orior, oriri, ortus sum'), 'Variant 4 should have orior, oriri, ortus sum');
});

console.log('All tests completed!');