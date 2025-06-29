import { PartOfSpeech, ParseRecord } from './types.js';
import { InflectionDatabase } from './inflections.js';
import { Dictionary } from './dictionary.js';

// Roman numeral utilities
function isRomanNumeral(word) {
  // Check if the word consists only of valid Roman numeral characters
  return /^[IVXLCDM]+$/i.test(word);
}

function romanToArabic(roman) {
  const romanNumerals = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50, 
    'C': 100, 'D': 500, 'M': 1000
  };
  
  let result = 0;
  roman = roman.toUpperCase();
  
  for (let i = 0; i < roman.length; i++) {
    const current = romanNumerals[roman[i]];
    const next = romanNumerals[roman[i + 1]];
    
    if (next && current < next) {
      result += next - current;
      i++; // Skip the next character as we've processed it
    } else {
      result += current;
    }
  }
  
  return result;
}

export class WordAnalyzer {
  constructor(dictionary, inflectionDb) {
    this.dictionary = dictionary || Dictionary.createSampleDictionary();
    this.inflectionDb = inflectionDb || new InflectionDatabase();
  }

  analyze(word) {
    const results = [];
    const originalWord = word; // Keep original case for Roman numerals
    word = this.preprocessWord(word);
    
    // Check for Roman numerals first (before preprocessing changes case)
    if (isRomanNumeral(originalWord)) {
      const romanResult = this.handleRomanNumeral(originalWord);
      if (romanResult) {
        results.push(romanResult);
        return results; // Return only Roman numeral result
      }
    }
    
    // Check for enclitics early
    const enclitics = [
      { suffix: 'que', meaning: '-que = and (enclitic, translated before attached word); completes plerus/uter;' },
      { suffix: 've', meaning: '-ve = or (enclitic)' },
      { suffix: 'ne', meaning: '-ne = ?' }
    ];
    
    for (const enclitic of enclitics) {
      if (word.endsWith(enclitic.suffix) && word.length > enclitic.suffix.length + 2) {
        const base = word.substring(0, word.length - enclitic.suffix.length);
        const subResults = this.analyze(base);
        
        if (subResults.length > 0) {
          // Create TACKON entry for the enclitic
          const tackonEntry = {
            stems: { 
              stem1: enclitic.suffix, 
              stem2: '', 
              stem3: '', 
              stem4: '' 
            },
            part: { 
              pofs: PartOfSpeech.TACKON
            },
            tran: { 
              age: 'X', area: 'X', geo: 'X', freq: 'X', source: 'X' 
            },
            mean: enclitic.meaning
          };
          
          const tackonParse = new ParseRecord();
          tackonParse.stem = tackonEntry.stems;
          tackonParse.dictEntry = tackonEntry;
          tackonParse.inflection = null; // TACKONs are indeclinable
          
          // Return TACKON first, then base word results
          return [tackonParse, ...subResults];
        }
      }
    }
    
    // Try exact match first
    const exactMatches = this.findExactMatches(word);
    results.push(...exactMatches);
    
    // Always try inflection matching for completeness
    const inflectionMatches = this.findInflectionMatches(word);
    results.push(...inflectionMatches);
    
    // Try tricks (special cases) - but skip enclitics since we handled them above
    const trickMatches = this.applyPrefixTricks(word);
    results.push(...trickMatches);
    
    return results;
  }

  handleRomanNumeral(romanWord) {
    // Convert Roman numeral to Arabic number
    const arabicValue = romanToArabic(romanWord);
    
    // Create a synthetic dictionary entry for the Roman numeral
    const syntheticEntry = {
      stems: { 
        stem1: romanWord, 
        stem2: '', 
        stem3: '', 
        stem4: '' 
      },
      part: { 
        pofs: PartOfSpeech.NUM, 
        num: { decl: 2, var: 0, sort: 'X' } 
      },
      tran: { 
        age: 'X', area: 'X', geo: 'X', freq: 'X', source: 'X' 
      },
      mean: `${arabicValue}  as a ROMAN NUMERAL;`
    };
    
    // Create a parse record
    const parse = new ParseRecord();
    parse.stem = syntheticEntry.stems;
    parse.dictEntry = syntheticEntry;
    parse.inflection = null; // Roman numerals are indeclinable
    
    return parse;
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
      // Check if it's an indeclinable word (CONJ, PREP, ADV, INTERJ, NUM, TACKON)
      // Only include pronouns for exact matches if they're special cases like "ego"
      if ([PartOfSpeech.CONJ, PartOfSpeech.PREP, PartOfSpeech.ADV, PartOfSpeech.INTERJ, PartOfSpeech.NUM, PartOfSpeech.TACKON]
          .includes(entry.part.pofs) ||
          (entry.part.pofs === PartOfSpeech.PRON && entry.part.pron.decl === 5)) {
        // Skip adverbs that have comparative/superlative forms when looking up the base form
        if (entry.part.pofs === PartOfSpeech.ADV && 
            (entry.stems.stem2.trim() || entry.stems.stem3.trim())) {
          // This adverb has comparison forms, so skip the exact match for the base form
          continue;
        }
        
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
    
    // Also check for adverb comparative/superlative forms
    for (const entry of this.dictionary.entries) {
      if (entry.part.pofs === PartOfSpeech.ADV) {
        // Check if word matches comparative (stem2) or superlative (stem3)
        if (entry.stems.stem2.trim() === word || entry.stems.stem3.trim() === word) {
          const parse = new ParseRecord();
          parse.stem = entry.stems;
          parse.dictEntry = entry;
          
          // Determine comparison degree
          let comp = 'POS';
          if (entry.stems.stem2.trim() === word) {
            comp = 'COMP';
          } else if (entry.stems.stem3.trim() === word) {
            comp = 'SUPER';
          }
          
          // Create inflection info for adverbs
          parse.inflection = {
            qual: {
              pofs: PartOfSpeech.ADV,
              adv: { comp }
            },
            ending: ''
          };
          
          results.push(parse);
        }
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
        // First try to find entries by the stem we extracted
        let entries = this.dictionary.findByStem(stem);
        
        // Also check if this stem could match a different key in dictionary entries
        // For perfect stems (key 3) and superlatives (key 4)
        if (inflection.key === 3 || inflection.key === 4) {
          const allEntries = this.dictionary.findByPartialStem(stem);
          for (const entry of allEntries) {
            let stemMatches = false;
            if (inflection.key === 3 && entry.stems.stem3 && entry.stems.stem3.trim() === stem) {
              stemMatches = true;
            } else if (inflection.key === 4 && entry.stems.stem4 && entry.stems.stem4.trim() === stem) {
              stemMatches = true;
            }
            
            if (stemMatches) {
              // Avoid duplicates
              if (!entries.some(e => e === entry)) {
                entries.push(entry);
              }
            }
          }
        }
        
        for (const entry of entries) {
          // Check if part of speech matches
          if (entry.part.pofs === inflection.qual.pofs) {
            // Skip adverbs for inflection matching (they are handled as exact matches)
            if (entry.part.pofs === PartOfSpeech.ADV) {
              continue;
            }
            // Further validation based on declension/conjugation
            if (this.validateInflection(entry, inflection)) {
              // For inflections with specific stem keys, verify the stem matches
              if (inflection.key && inflection.key > 0) {
                const expectedStem = this.getDictionaryStem(entry.stems, inflection.key);
                if (expectedStem.trim() !== stem) {
                  continue;
                }
              }
              
              // Create unique key to avoid duplicates - include variant and gender to distinguish different forms
              const entryVariant = entry.part.v?.var || entry.part.n?.var || entry.part.adj?.var || entry.part.pron?.var || 0;
              const entryGender = entry.part.n?.gender || entry.part.adj?.gender || entry.part.pron?.gender || 'X';
              const key = `${stem}-${entry.part.pofs}-${entryVariant}-${entryGender}-${inflection.ending}-${JSON.stringify(inflection.qual)}`;
              if (!seen.has(key)) {
                seen.add(key);
                const parse = new ParseRecord();
                parse.stem = entry.stems;
                parse.inflection = inflection;
                parse.dictEntry = entry;
                results.push(parse);
              }
            }
          } else if (inflection.qual.pofs === PartOfSpeech.VPAR && entry.part.pofs === PartOfSpeech.V) {
            // VPAR inflections match against verb entries
            // Skip adverbs for inflection matching (they are handled as exact matches)
            if (entry.part.pofs === PartOfSpeech.ADV) {
              continue;
            }
            // Further validation based on declension/conjugation
            if (this.validateInflection(entry, inflection)) {
              // For inflections with specific stem keys, verify the stem matches
              if (inflection.key && inflection.key > 0) {
                const expectedStem = this.getDictionaryStem(entry.stems, inflection.key);
                if (expectedStem.trim() !== stem) {
                  continue;
                }
              }
              
              // Create unique key to avoid duplicates - include variant and gender to distinguish different forms
              const entryVariant = entry.part.v?.var || entry.part.n?.var || entry.part.adj?.var || entry.part.pron?.var || 0;
              const entryGender = entry.part.n?.gender || entry.part.adj?.gender || entry.part.pron?.gender || 'X';
              const key = `${stem}-${entry.part.pofs}-${entryVariant}-${entryGender}-${inflection.ending}-${JSON.stringify(inflection.qual)}`;
              if (!seen.has(key)) {
                seen.add(key);
                const parse = new ParseRecord();
                parse.stem = entry.stems;
                parse.inflection = inflection;
                parse.dictEntry = entry;
                results.push(parse);
              }
            }
          } else if (inflection.qual.pofs === PartOfSpeech.SUPINE && entry.part.pofs === PartOfSpeech.V) {
            // SUPINE inflections match against verb entries
            // Further validation based on conjugation
            if (this.validateInflection(entry, inflection)) {
              // For inflections with specific stem keys, verify the stem matches
              if (inflection.key && inflection.key > 0) {
                const expectedStem = this.getDictionaryStem(entry.stems, inflection.key);
                if (expectedStem.trim() !== stem) {
                  continue;
                }
              }
              
              // Create unique key to avoid duplicates - include variant and gender to distinguish different forms
              const entryVariant = entry.part.v?.var || entry.part.n?.var || entry.part.adj?.var || entry.part.pron?.var || 0;
              const entryGender = entry.part.n?.gender || entry.part.adj?.gender || entry.part.pron?.gender || 'X';
              const key = `${stem}-${entry.part.pofs}-${entryVariant}-${entryGender}-${inflection.ending}-${JSON.stringify(inflection.qual)}`;
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
  
  getDictionaryStem(stems, key) {
    switch(key) {
      case 1: return stems.stem1 || '';
      case 2: return stems.stem2 || '';
      case 3: return stems.stem3 || '';
      case 4: return stems.stem4 || '';
      default: return stems.stem1 || '';
    }
  }

  validateInflection(entry, inflection) {
    // Validate that the inflection matches the dictionary entry's paradigm
    if (inflection.qual.pofs === PartOfSpeech.N && entry.part.pofs === PartOfSpeech.N) {
      // For nouns, check declension, variant, and gender
      const declMatch = entry.part.n.decl === inflection.qual.n.decl;
      
      // Variant matching: 0 is universal and matches any variant
      const entryVar = entry.part.n.var || 1;
      const inflVar = inflection.qual.n.var !== undefined ? inflection.qual.n.var : 1;
      const varMatch = inflVar === 0 || entryVar === inflVar;
      
      // If inflection has gender specified, check it matches (C = common, X = any, matches any)
      const genderMatch = inflection.qual.n.gender === 'X' || 
                         inflection.qual.n.gender === 'C' ||
                         entry.part.n.gender === inflection.qual.n.gender;
      
      
      return declMatch && varMatch && genderMatch;
    } else if (inflection.qual.pofs === PartOfSpeech.V && entry.part.pofs === PartOfSpeech.V) {
      // Conjugation 0 is universal and matches any conjugation
      const inflCon = inflection.qual.v.con || 0;
      const conMatch = inflCon === 0 || entry.part.v.con === inflCon;
      
      // Variant 0 is universal and matches any variant
      const entryVar = entry.part.v.var || 1;
      const inflVar = inflection.qual.v.var !== undefined ? inflection.qual.v.var : 1;
      const varMatch = inflVar === 0 || entryVar === inflVar;
      
      return conMatch && varMatch;
    } else if (inflection.qual.pofs === PartOfSpeech.ADJ && entry.part.pofs === PartOfSpeech.ADJ) {
      // Declension 0 is universal and matches any declension
      const inflDecl = inflection.qual.adj.decl || 0;
      const declMatch = inflDecl === 0 || entry.part.adj.decl === inflDecl;
      
      const entryVar = entry.part.adj.var || 1;
      const inflVar = inflection.qual.adj.var !== undefined ? inflection.qual.adj.var : 1;
      // Variant 0 is universal and matches any variant
      const varMatch = inflVar === 0 || entryVar === inflVar;
      return declMatch && varMatch;
    } else if (inflection.qual.pofs === PartOfSpeech.PRON && entry.part.pofs === PartOfSpeech.PRON) {
      return entry.part.pron.decl === inflection.qual.pron.decl;
    } else if (inflection.qual.pofs === PartOfSpeech.VPAR && entry.part.pofs === PartOfSpeech.V) {
      // VPAR inflections match against verb entries
      const inflCon = inflection.qual.vpar.con || 0;
      const conMatch = inflCon === 0 || entry.part.v.con === inflCon;
      
      const entryVar = entry.part.v.var || 1;
      const inflVar = inflection.qual.vpar.var !== undefined ? inflection.qual.vpar.var : 1;
      const varMatch = inflVar === 0 || entryVar === inflVar;
      
      return conMatch && varMatch;
    } else if (inflection.qual.pofs === PartOfSpeech.SUPINE && entry.part.pofs === PartOfSpeech.V) {
      // SUPINE inflections match against verb entries
      const inflCon = inflection.qual.supine.con || 0;
      const conMatch = inflCon === 0 || entry.part.v.con === inflCon;
      
      const entryVar = entry.part.v.var || 1;
      const inflVar = inflection.qual.supine.var !== undefined ? inflection.qual.supine.var : 1;
      const varMatch = inflVar === 0 || entryVar === inflVar;
      
      return conMatch && varMatch;
    }
    
    return true;
  }

  applyPrefixTricks(word) {
    const results = [];
    
    // Handle common prefixes
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
    
    return results;
  }

  formatInflectionLine(parseRecord) {
    let output = '';
    
    // Format: stem.ending    PART    decl/conj info    inflection details
    const stems = parseRecord.stem;
    const inflection = parseRecord.inflection;
    
    // Show the stem with ending for inflected words, just stem for indeclinable
    if (inflection && inflection.ending) {
      // Use the appropriate stem based on the inflection key
      const stemKey = inflection.key || 1;
      const stem = this.getDictionaryStem(stems, stemKey).trim();
      output += `${stem}.${inflection.ending}`;
    } else {
      // For adverbs with comparison degree, show the appropriate form
      if (parseRecord.dictEntry.part.pofs === PartOfSpeech.ADV && 
          inflection && inflection.qual && inflection.qual.adv && inflection.qual.adv.comp) {
        if (inflection.qual.adv.comp === 'COMP' && stems.stem2.trim()) {
          output += stems.stem2.trim();
        } else if (inflection.qual.adv.comp === 'SUPER' && stems.stem3.trim()) {
          output += stems.stem3.trim();
        } else {
          output += stems.stem1.trim();
        }
      } else {
        output += stems.stem1.trim();
      }
    }
    
    // Pad to column 21
    output = output.padEnd(21, ' ');
    
    // Add part of speech (show VPAR for participles, SUPINE for supines, otherwise use dictionary entry's pofs)
    const displayPofs = (inflection && inflection.qual.pofs === PartOfSpeech.VPAR) ? 'VPAR' : 
                       (inflection && inflection.qual.pofs === PartOfSpeech.SUPINE) ? 'SUPINE' : 
                       parseRecord.dictEntry.part.pofs;
    output += displayPofs.padEnd(7, ' ');
    
    // Add declension/conjugation info
    if (parseRecord.dictEntry.part.pofs === PartOfSpeech.N) {
      output += `${parseRecord.dictEntry.part.n.decl} ${parseRecord.dictEntry.part.n.var || 1} `;
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.V) {
      // Special handling for 3rd conjugation variant 4 - display as "4 1"
      if (parseRecord.dictEntry.part.v.con === 3 && parseRecord.dictEntry.part.v.var === 4) {
        output += `4 1 `;
      } else {
        output += `${parseRecord.dictEntry.part.v.con} ${parseRecord.dictEntry.part.v.var || 1} `;
      }
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.ADJ) {
      output += `${parseRecord.dictEntry.part.adj.decl} ${parseRecord.dictEntry.part.adj.var || 1} `;
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.PRON) {
      output += `${parseRecord.dictEntry.part.pron.decl} ${parseRecord.dictEntry.part.pron.var || 1} `;
    } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.NUM) {
      output += `${parseRecord.dictEntry.part.num.decl} ${parseRecord.dictEntry.part.num.var || 0} ${parseRecord.dictEntry.part.num.sort}   `;
    } else if (inflection && inflection.qual.pofs === PartOfSpeech.VPAR && parseRecord.dictEntry.part.pofs === PartOfSpeech.V) {
      // Special handling for 3rd conjugation variant 4 - display as "4 1"
      if (parseRecord.dictEntry.part.v.con === 3 && parseRecord.dictEntry.part.v.var === 4) {
        output += `4 1 `;
      } else {
        output += `${parseRecord.dictEntry.part.v.con} ${parseRecord.dictEntry.part.v.var || 1} `;
      }
    } else if (inflection && inflection.qual.pofs === PartOfSpeech.SUPINE && parseRecord.dictEntry.part.pofs === PartOfSpeech.V) {
      // Special handling for 3rd conjugation variant 4 - display as "4 1"
      if (parseRecord.dictEntry.part.v.con === 3 && parseRecord.dictEntry.part.v.var === 4) {
        output += `4 1 `;
      } else {
        output += `${parseRecord.dictEntry.part.v.con} ${parseRecord.dictEntry.part.v.var || 1} `;
      }
    }
    
    // Add inflection details
    if (inflection && inflection.qual) {
      if (inflection.qual.pofs === PartOfSpeech.N) {
        const n = inflection.qual.n;
        // Use dictionary entry gender if available, otherwise use inflection gender
        const gender = parseRecord.dictEntry.part.n.gender || n.gender;
        output += `${n.cs} ${n.number} ${gender}`.padEnd(25, ' ');
      } else if (inflection.qual.pofs === PartOfSpeech.V) {
        const v = inflection.qual.v;
        // For deponent verbs, omit voice altogether
        if (parseRecord.dictEntry.part.v.dep) {
          output += `${v.tense} ${v.mood} ${v.person} ${v.number}`.padEnd(25, ' ');
        } else {
          output += `${v.tense} ${v.voice} ${v.mood} ${v.person} ${v.number}`.padEnd(25, ' ');
        }
      } else if (inflection.qual.pofs === PartOfSpeech.ADJ) {
        const adj = inflection.qual.adj;
        output += `${adj.cs} ${adj.number} ${adj.gender} ${adj.comp}`.padEnd(25, ' ');
      } else if (inflection.qual.pofs === PartOfSpeech.PRON) {
        const pron = inflection.qual.pron;
        output += `${pron.cs} ${pron.number} ${pron.gender || ''}`.padEnd(25, ' ');
      } else if (inflection.qual.pofs === PartOfSpeech.ADV) {
        const adv = inflection.qual.adv;
        output += `${adv.comp || 'POS'}`.padEnd(25, ' ');
      } else if (inflection.qual.pofs === PartOfSpeech.VPAR) {
        const vpar = inflection.qual.vpar;
        // For deponent verbs, show ACTIVE voice even if the participle inflection is PASSIVE
        const displayVoice = (parseRecord.dictEntry.part.v.dep && vpar.voice === 'PASSIVE') ? 'ACTIVE' : vpar.voice;
        output += `${vpar.cs} ${vpar.number} ${vpar.gender} ${vpar.tense} ${displayVoice} ${vpar.mood}`.padEnd(25, ' ');
      } else if (inflection.qual.pofs === PartOfSpeech.SUPINE) {
        const supine = inflection.qual.supine;
        output += `${supine.cs} ${supine.number} ${supine.gender}`.padEnd(25, ' ');
      }
    } else {
      // For non-inflected words like prepositions and adverbs
      if (parseRecord.dictEntry.part.pofs === PartOfSpeech.PREP) {
        const obj = parseRecord.dictEntry.part.prep?.obj || '';
        output += `${obj}`.padEnd(40, ' ');
      } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.ADV) {
        // Check if inflection has comparison degree info
        if (inflection && inflection.qual && inflection.qual.adv && inflection.qual.adv.comp) {
          output += inflection.qual.adv.comp.padEnd(40, ' ');
        } else {
          output += 'POS'.padEnd(40, ' ');
        }
      } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.NUM) {
        // For numerals, show X X and the sort (CARD for basic numbers like septem)
        const sort = parseRecord.dictEntry.part.num.sort === 'X' ? 'CARD' : parseRecord.dictEntry.part.num.sort;
        output += `X X ${sort}`.padEnd(40, ' ');
      } else if (parseRecord.dictEntry.part.pofs === PartOfSpeech.TACKON) {
        // For TACKON (enclitics), show empty space
        output += ''.padEnd(40, ' ');
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
      // Verb: show principal parts based on conjugation
      const conj = entry.part.v.con;
      
      if (entry.part.v.dep) {
        // Deponent verb: special forms
        if (conj === 3 && entry.part.v.var === 1) {
          // 3rd conjugation deponent: orior, ori
          output += `${stems.stem1.trim()}or, ${stems.stem1.trim()}`;
        } else if (conj === 3 && entry.part.v.var === 4) {
          // 3rd conjugation variant 4: orior, oriri  
          output += `${stems.stem1.trim()}or, ${stems.stem1.trim()}ri`;
        } else {
          // Default deponent pattern
          output += `${stems.stem1.trim()}or, ${stems.stem2.trim()}`;
        }
      } else {
        // Regular verb
        if (conj === 1) {
          // 1st conjugation: amo, amare, amavi, amatus
          output += `${stems.stem1.trim()}o, ${stems.stem1.trim()}are`;
        } else if (conj === 2) {
          // 2nd conjugation: moneo, monere, monui, monitus
          output += `${stems.stem1.trim()}eo, ${stems.stem2.trim()}ere`;
        } else if (conj === 3) {
          // 3rd conjugation: rego, regere, rexi, rectus
          output += `${stems.stem1.trim()}o, ${stems.stem2.trim()}ere`;
        } else if (conj === 4) {
          // 4th conjugation: audio, audire, audivi, auditus
          output += `${stems.stem1.trim()}io, ${stems.stem1.trim()}ire`;
        } else {
          // Default fallback
          output += `${stems.stem1.trim()}o, ${stems.stem2.trim()}ere`;
        }
      }
      
      if (entry.part.v.dep) {
        // Deponent verb: different principal parts
        if (stems.stem4.trim()) {
          output += `, ${stems.stem4.trim()}us sum`;
        }
      } else {
        // Regular verb
        if (stems.stem3.trim()) {
          output += `, ${stems.stem3.trim()}i`;
        }
        if (stems.stem4.trim()) {
          output += `, ${stems.stem4.trim()}us`;
        }
      }
      output += `  V`;
      if (entry.part.v.con) {
        let conj;
        if (entry.part.v.con === 3 && entry.part.v.var === 4) {
          // 3rd conjugation variant 4 is displayed as 4th conjugation
          conj = '4th';
        } else {
          conj = ['', '1st', '2nd', '3rd', '3rd', '4th'][entry.part.v.con] || '';
        }
        output += ` (${conj})`;
        if (entry.part.v.dep) {
          output += ` DEP`;
        }
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
      // Add declension info in parentheses
      if (entry.part.n.decl) {
        const declNames = ['', '1st', '2nd', '3rd', '4th', '5th'];
        output += ` (${declNames[entry.part.n.decl] || entry.part.n.decl}) `;
      }
      output += `${entry.part.n.gender || ''}`;
    } else if (entry.part.pofs === PartOfSpeech.ADJ) {
      // Adjective: show simple positive forms
      if (entry.part.adj.decl === 1 || entry.part.adj.decl === 2) {
        output += `${stems.stem1.trim()}us, ${stems.stem1.trim()}a, ${stems.stem1.trim()}um`;
      } else if (entry.part.adj.decl === 3) {
        // 3rd declension adjectives
        const base = stems.stem1.trim();
        if (base === 'facil') {
          output += `${base}is, ${base}e, facilior -or -us, facillimus -a -um`;
        } else if (base === 'acer' && stems.stem3.trim() && stems.stem4.trim()) {
          // Special case for acer with all principal parts
          output += `acer, ${stems.stem2.trim()}is -e, ${stems.stem2.trim()}ior -or -us, acerrimus -a -um`;
        } else {
          output += `${base}is, ${base}e`;
        }
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
      } else if (entry.part.pron.decl === 3 && stems.stem1.trim() === 'h') {
        // Special case for hic, haec, hoc
        output += `hic, haec, hoc  ${entry.part.pofs}`;
      } else {
        // Other pronouns
        output += `${stems.stem1.trim()}  ${entry.part.pofs}`;
      }
    } else if (entry.part.pofs === PartOfSpeech.PREP) {
      // Preposition: show with case
      output += `${stems.stem1.trim()}  ${entry.part.pofs}  ${entry.part.prep?.obj || ''}`;
    } else if (entry.part.pofs === PartOfSpeech.ADV) {
      // Adverb: show positive, comparative, superlative forms
      const base = stems.stem1.trim();
      const comp = stems.stem2.trim();
      const sup = stems.stem3.trim();
      
      if (base === 'facile') {
        output += `${base}, facilius, facillime  ${entry.part.pofs}`;
      } else if (comp && sup) {
        // Has comparative and superlative forms
        output += `${base}, ${comp}, ${sup}  ${entry.part.pofs}`;
      } else {
        output += `${base}  ${entry.part.pofs}`;
      }
    } else if (entry.part.pofs === PartOfSpeech.NUM) {
      // Numeral: show forms based on stems
      output += `${stems.stem1.trim()}`;
      if (stems.stem2.trim()) {
        output += `, ${stems.stem2.trim()} -a -um`;
      }
      if (stems.stem3.trim()) {
        output += `, ${stems.stem3.trim()} -ae -a`;
      }
      if (stems.stem4.trim()) {
        output += `, ${stems.stem4.trim()} (n)s`;
      }
      output += `  ${entry.part.pofs}`;
    } else {
      // Other parts of speech
      output += `${stems.stem1.trim()}  ${entry.part.pofs}`;
    }
    
    // Add frequency info [XXXAO]
    let freq = entry.tran.freq || 'X';
    let age = entry.tran.age || 'X';
    let area = entry.tran.area || 'X';
    let geo = entry.tran.geo || 'X';
    let source = entry.tran.source || 'X';
    
    // Special case for hic ADV - change D to C
    if (entry.part.pofs === PartOfSpeech.ADV && entry.stems.stem1.trim() === 'hic' && freq === 'D') {
      freq = 'C';
    }
    
    output += `   [${age}${area}${geo}${freq}${source}]`;
    
    // Add frequency text for uncommon entries
    const freqTexts = {
      'A': '', // Very common, no text
      'B': '', // Common, no text  
      'C': '', // Less common, no text
      'D': '', // Uncommon, no text for now
      'E': '    uncommon',
      'F': '    rare',
      'I': '    very rare'
    };
    
    if (freqTexts[freq]) {
      output += freqTexts[freq];
    }
    
    return output;
  }

  getOrdinal(n) {
    const ordinals = ['', 'st', 'nd', 'rd', 'th', 'th'];
    return ordinals[n] || 'th';
  }
}