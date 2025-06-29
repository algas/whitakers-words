import { PartOfSpeech, ParseRecord } from './types.js';
import { InflectionDatabase } from './inflections.js';
import { Dictionary } from './dictionary.js';

export class WordAnalyzer {
  constructor(dictionary, inflectionDb) {
    this.dictionary = dictionary || Dictionary.createSampleDictionary();
    this.inflectionDb = inflectionDb || new InflectionDatabase();
  }

  analyze(word) {
    const results = [];
    word = word.toLowerCase().trim();
    
    // Try exact match first
    const exactMatches = this.findExactMatches(word);
    results.push(...exactMatches);
    
    // Try removing inflection endings
    const inflectionMatches = this.findInflectionMatches(word);
    results.push(...inflectionMatches);
    
    // Try tricks (special cases)
    const trickMatches = this.applyTricks(word);
    results.push(...trickMatches);
    
    return results;
  }

  findExactMatches(word) {
    const results = [];
    const entries = this.dictionary.findByStem(word);
    
    for (const entry of entries) {
      // Check if it's an indeclinable word (CONJ, PREP, ADV, INTERJ)
      if ([PartOfSpeech.CONJ, PartOfSpeech.PREP, PartOfSpeech.ADV, PartOfSpeech.INTERJ]
          .includes(entry.part.pofs)) {
        const parse = new ParseRecord();
        parse.stem = entry.stems;
        parse.dictEntry = entry;
        results.push(parse);
      }
    }
    
    return results;
  }

  findInflectionMatches(word) {
    const results = [];
    const seen = new Set(); // Track unique combinations
    
    // Try all possible inflection endings
    for (const inflection of this.inflectionDb.inflections) {
      const stem = this.inflectionDb.removeEnding(word, inflection.ending);
      if (stem) {
        const entries = this.dictionary.findByStem(stem);
        
        for (const entry of entries) {
          // Check if part of speech matches
          if (entry.part.pofs === inflection.qual.pofs) {
            // Further validation based on declension/conjugation
            if (this.validateInflection(entry, inflection)) {
              // Create unique key to avoid duplicates
              const key = `${stem}-${entry.part.pofs}-${inflection.ending}-${JSON.stringify(inflection.qual)}`;
              if (!seen.has(key)) {
                seen.add(key);
                const parse = new ParseRecord();
                parse.stem = entry.stems;
                parse.inflection = inflection;
                parse.dictEntry = entry;
                results.push(parse);
              }
            }
          }
        }
      }
    }
    
    return results;
  }

  validateInflection(entry, inflection) {
    // Validate that the inflection matches the dictionary entry's paradigm
    if (inflection.qual.pofs === PartOfSpeech.N && entry.part.pofs === PartOfSpeech.N) {
      return entry.part.n.decl === inflection.qual.n.decl;
    } else if (inflection.qual.pofs === PartOfSpeech.V && entry.part.pofs === PartOfSpeech.V) {
      return entry.part.v.con === inflection.qual.v.con;
    } else if (inflection.qual.pofs === PartOfSpeech.ADJ && entry.part.pofs === PartOfSpeech.ADJ) {
      return entry.part.adj.decl === inflection.qual.adj.decl;
    }
    
    return true;
  }

  applyTricks(word) {
    const results = [];
    
    // Handle common prefixes and suffixes
    const prefixes = ['ab', 'ad', 'con', 'de', 'dis', 'ex', 'in', 'ob', 'per', 'prae', 'pro', 're', 'sub', 'trans'];
    
    for (const prefix of prefixes) {
      if (word.startsWith(prefix) && word.length > prefix.length + 2) {
        const unprefixed = word.substring(prefix.length);
        const subResults = this.analyze(unprefixed);
        
        // Add prefix info to results
        for (const result of subResults) {
          const modResult = Object.assign({}, result);
          modResult.prefix = prefix;
          results.push(modResult);
        }
      }
    }
    
    // Handle enclitics (-que, -ve, -ne)
    const enclitics = [
      { suffix: 'que', meaning: 'and' },
      { suffix: 've', meaning: 'or' },
      { suffix: 'ne', meaning: '?' }
    ];
    
    for (const enclitic of enclitics) {
      if (word.endsWith(enclitic.suffix) && word.length > enclitic.suffix.length + 2) {
        const base = word.substring(0, word.length - enclitic.suffix.length);
        const subResults = this.analyze(base);
        
        // Add enclitic info to results
        for (const result of subResults) {
          const modResult = Object.assign({}, result);
          modResult.enclitic = enclitic;
          results.push(modResult);
        }
      }
    }
    
    return results;
  }

  formatOutput(parseRecord) {
    let output = '';
    
    // Format the word form
    const stems = parseRecord.stem;
    output += `${stems.stem1.trim()}`;
    if (stems.stem2.trim()) output += `.${stems.stem2.trim()}`;
    if (stems.stem3.trim()) output += `.${stems.stem3.trim()}`;
    if (stems.stem4.trim()) output += `.${stems.stem4.trim()}`;
    
    // Add part of speech
    output += `     ${parseRecord.dictEntry.part.pofs}`;
    
    // Add declension/conjugation info
    if (parseRecord.dictEntry.part.pofs === PartOfSpeech.N) {
      output += ` ${parseRecord.dictEntry.part.n.decl} ${parseRecord.dictEntry.part.n.gender}`;
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.V) {
      output += ` ${parseRecord.dictEntry.part.v.con}`;
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.ADJ) {
      output += ` ${parseRecord.dictEntry.part.adj.decl}`;
    }
    
    // Add inflection info
    if (parseRecord.inflection && parseRecord.inflection.qual) {
      output += '     ';
      
      if (parseRecord.inflection.qual.pofs === PartOfSpeech.N) {
        const n = parseRecord.inflection.qual.n;
        output += `${n.cs} ${n.number} ${n.gender}`;
      } else if (parseRecord.inflection.qual.pofs === PartOfSpeech.V) {
        const v = parseRecord.inflection.qual.v;
        output += `${v.tense} ${v.voice} ${v.mood} ${v.person} ${v.number}`;
      } else if (parseRecord.inflection.qual.pofs === PartOfSpeech.ADJ) {
        const adj = parseRecord.inflection.qual.adj;
        output += `${adj.cs} ${adj.number} ${adj.gender} ${adj.comp}`;
      }
    }
    
    // Add meaning
    output += `\n${parseRecord.dictEntry.mean}\n`;
    
    return output;
  }
}