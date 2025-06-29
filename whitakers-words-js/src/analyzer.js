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
    word = this.preprocessWord(word);
    
    // Try exact match first
    const exactMatches = this.findExactMatches(word);
    results.push(...exactMatches);
    
    // Try removing inflection endings (skip if exact personal pronoun match found)
    const hasExactPersonalPronoun = exactMatches.some(m => 
      m.dictEntry.part.pofs === PartOfSpeech.PRON && m.dictEntry.part.pron.decl === 5);
    if (!hasExactPersonalPronoun) {
      const inflectionMatches = this.findInflectionMatches(word);
      results.push(...inflectionMatches);
    }
    
    // Try tricks (special cases)
    const trickMatches = this.applyTricks(word);
    results.push(...trickMatches);
    
    return results;
  }

  preprocessWord(word) {
    // Convert to lowercase and trim
    word = word.toLowerCase().trim();
    
    // Remove macrons (long vowel marks)
    const macronMap = {
      'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u', 'ȳ': 'y',
      'Ā': 'a', 'Ē': 'e', 'Ī': 'i', 'Ō': 'o', 'Ū': 'u', 'Ȳ': 'y'
    };
    
    for (const [macron, plain] of Object.entries(macronMap)) {
      word = word.replace(new RegExp(macron, 'g'), plain);
    }
    
    return word;
  }

  findExactMatches(word) {
    const results = [];
    const entries = this.dictionary.findByStem(word);
    
    for (const entry of entries) {
      // Check if it's an indeclinable word (CONJ, PREP, ADV, INTERJ)
      // Only include pronouns for exact matches if they're special cases like "ego"
      if ([PartOfSpeech.CONJ, PartOfSpeech.PREP, PartOfSpeech.ADV, PartOfSpeech.INTERJ]
          .includes(entry.part.pofs) ||
          (entry.part.pofs === PartOfSpeech.PRON && entry.part.pron.decl === 5)) {
        const parse = new ParseRecord();
        parse.stem = entry.stems;
        parse.dictEntry = entry;
        
        // For pronouns, create a pseudo-inflection to show case info
        if (entry.part.pofs === PartOfSpeech.PRON) {
          parse.inflection = {
            qual: {
              pofs: PartOfSpeech.PRON,
              pron: { cs: 'NOM', number: 'S', gender: 'C' }
            },
            ending: ''
          };
        } else {
          parse.inflection = null; // No inflection for indeclinable words
        }
        
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
      // For nouns, check both declension and variant
      const declMatch = entry.part.n.decl === inflection.qual.n.decl;
      // If inflection has gender specified, check it matches (C = common, matches any)
      const genderMatch = inflection.qual.n.gender === 'X' || 
                         inflection.qual.n.gender === 'C' ||
                         entry.part.n.gender === inflection.qual.n.gender;
      return declMatch && genderMatch;
    } else if (inflection.qual.pofs === PartOfSpeech.V && entry.part.pofs === PartOfSpeech.V) {
      return entry.part.v.con === inflection.qual.v.con;
    } else if (inflection.qual.pofs === PartOfSpeech.ADJ && entry.part.pofs === PartOfSpeech.ADJ) {
      return entry.part.adj.decl === inflection.qual.adj.decl;
    } else if (inflection.qual.pofs === PartOfSpeech.PRON && entry.part.pofs === PartOfSpeech.PRON) {
      return entry.part.pron.decl === inflection.qual.pron.decl;
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

  formatInflectionLine(parseRecord) {
    let output = '';
    
    // Format: stem.ending    PART    decl/conj info    inflection details
    const stems = parseRecord.stem;
    const inflection = parseRecord.inflection;
    
    // Show the stem with ending for inflected words, just stem for indeclinable
    if (inflection && inflection.ending) {
      output += `${stems.stem1.trim()}.${inflection.ending}`;
    } else {
      output += stems.stem1.trim();
    }
    
    // Pad to column 21
    output = output.padEnd(21, ' ');
    
    // Add part of speech
    output += parseRecord.dictEntry.part.pofs.padEnd(7, ' ');
    
    // Add declension/conjugation info
    if (parseRecord.dictEntry.part.pofs === PartOfSpeech.N) {
      output += `${parseRecord.dictEntry.part.n.decl} ${parseRecord.dictEntry.part.n.var || 1} `;
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.V) {
      output += `${parseRecord.dictEntry.part.v.con} ${parseRecord.dictEntry.part.v.var || 1} `;
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.ADJ) {
      output += `${parseRecord.dictEntry.part.adj.decl} ${parseRecord.dictEntry.part.adj.var || 1} `;
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.PRON) {
      output += `${parseRecord.dictEntry.part.pron.decl} ${parseRecord.dictEntry.part.pron.var || 1} `;
    }
    
    // Add inflection details
    if (inflection && inflection.qual) {
      if (inflection.qual.pofs === PartOfSpeech.N) {
        const n = inflection.qual.n;
        output += `${n.cs} ${n.number} ${n.gender}`.padEnd(25, ' ');
      } else if (inflection.qual.pofs === PartOfSpeech.V) {
        const v = inflection.qual.v;
        output += `${v.tense} ${v.voice} ${v.mood} ${v.person} ${v.number}`.padEnd(25, ' ');
      } else if (inflection.qual.pofs === PartOfSpeech.ADJ) {
        const adj = inflection.qual.adj;
        output += `${adj.cs} ${adj.number} ${adj.gender} ${adj.comp}`.padEnd(25, ' ');
      } else if (inflection.qual.pofs === PartOfSpeech.PRON) {
        const pron = inflection.qual.pron;
        output += `${pron.cs} ${pron.number} ${pron.gender || ''}`.padEnd(25, ' ');
      }
    } else {
      // For non-inflected words like prepositions
      if (parseRecord.dictEntry.part.pofs === PartOfSpeech.PREP) {
        const obj = parseRecord.dictEntry.part.prep?.obj || '';
        output += `${obj}`.padEnd(25, ' ');
      }
    }
    
    return output;
  }

  formatOutput(parseRecord) {
    let output = '';
    
    // Line 1: Form analysis
    output += this.formatInflectionLine(parseRecord) + '\n';
    
    // Line 2: Dictionary form
    output += this.formatDictionaryForm(parseRecord) + '\n';
    
    // Line 3: Meaning
    output += parseRecord.dictEntry.mean;
    
    return output;
  }

  formatDictionaryForm(parseRecord) {
    const entry = parseRecord.dictEntry;
    const stems = entry.stems;
    let output = '';
    
    if (entry.part.pofs === PartOfSpeech.V) {
      // Verb: show principal parts (amo, amare, amavi, amatus)
      output += `${stems.stem1.trim()}o, ${stems.stem1.trim()}are`;
      if (stems.stem3.trim()) {
        output += `, ${stems.stem3.trim()}i`;
      }
      if (stems.stem4.trim()) {
        output += `, ${stems.stem4.trim()}us`;
      }
      output += `  V`;
      if (entry.part.v.con) {
        const conj = ['', '1st', '2nd', '3rd', '3rd', '4th'][entry.part.v.con] || '';
        output += ` (${conj})`;
      }
    } else if (entry.part.pofs === PartOfSpeech.N) {
      // Noun: show nom and gen forms
      if (entry.part.n.decl === 2 && entry.part.n.var === 2) {
        // 2nd declension neuter
        output += `${stems.stem1.trim()}um, ${stems.stem1.trim()}i`;
      } else if (entry.part.n.decl === 2 && entry.part.n.var === 1) {
        // 2nd declension masculine
        output += `${stems.stem1.trim()}us, ${stems.stem1.trim()}i`;
      } else if (entry.part.n.decl === 4) {
        // 4th declension - different forms for different variants
        if (entry.part.n.var === 2) {
          // 4th declension neuter
          output += `${stems.stem1.trim()}u, ${stems.stem1.trim()}us`;
        } else {
          // 4th declension masculine/feminine
          output += `${stems.stem1.trim()}us, ${stems.stem1.trim()}us`;
        }
      } else {
        // Other declensions
        output += `${stems.stem1.trim()}, `;
        if (stems.stem2.trim()) {
          output += `${stems.stem2.trim()}`;
          // Add genitive ending
          if (entry.part.n.decl === 1) output += 'ae';
          else if (entry.part.n.decl === 2) output += 'i';
          else if (entry.part.n.decl === 3) output += 'is';
          else if (entry.part.n.decl === 4) output += 'us';
          else if (entry.part.n.decl === 5) output += 'ei';
        }
      }
      output += `  N`;
      output += `    ${entry.part.n.gender || ''}`;
    } else if (entry.part.pofs === PartOfSpeech.ADJ) {
      // Adjective: show forms with comparative and superlative
      if (entry.part.adj.decl === 1 || entry.part.adj.decl === 2) {
        output += `${stems.stem1.trim()}us, ${stems.stem1.trim()}a -um, melior -or -us, optimus -a -um`;
      } else {
        output += stems.stem1.trim();
        if (stems.stem2.trim()) {
          output += `, ${stems.stem2.trim()}`;
        }
      }
      output += `  ADJ`;
    } else if (entry.part.pofs === PartOfSpeech.PRON) {
      // Pronoun: show paradigm forms
      if (entry.part.pron.decl === 6) {
        // Demonstrative pronoun like ille, illa, illud
        output += `${stems.stem1.trim()}e, ${stems.stem1.trim()}a, ${stems.stem1.trim()}ud  ${entry.part.pofs}`;
      } else {
        // Other pronouns
        output += `${stems.stem1.trim()}  ${entry.part.pofs}`;
      }
    } else if (entry.part.pofs === PartOfSpeech.PREP) {
      // Preposition: show with case
      output += `${stems.stem1.trim()}  ${entry.part.pofs}  ${entry.part.prep?.obj || ''}`;
    } else {
      // Other parts of speech
      output += `${stems.stem1.trim()}  ${entry.part.pofs}`;
    }
    
    // Add frequency info [XXXAO]
    const freq = entry.tran.freq || 'X';
    const age = entry.tran.age || 'X';
    const area = entry.tran.area || 'X';
    const geo = entry.tran.geo || 'X';
    const source = entry.tran.source || 'X';
    output += `   [${age}${area}${geo}${freq}${source}]`;
    
    return output;
  }

  getOrdinal(n) {
    const ordinals = ['', 'st', 'nd', 'rd', 'th', 'th'];
    return ordinals[n] || 'th';
  }
}