import { PartOfSpeech, DictionaryEntry, StemKey } from './types.js';
import fs from 'fs';

export class Dictionary {
  constructor() {
    this.entries = [];
    this.stemIndex = new Map(); // stem -> [entry indices]
    this.englishIndex = new Map(); // english word -> [entry indices]
  }

  loadFromDictline(filename) {
    if (!fs.existsSync(filename)) {
      console.error(`Dictionary file ${filename} not found`);
      return;
    }

    const lines = fs.readFileSync(filename, 'utf8').split('\n');
    
    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('#')) continue;
      
      const entry = this.parseDictlineLine(line);
      if (entry) {
        // Check if meaning starts with | - if so, it's a continuation of the previous entry
        if (entry.mean.startsWith('|')) {
          if (this.entries.length > 0) {
            const lastEntry = this.entries[this.entries.length - 1];
            // Check if it's the same word (same stems and part of speech)
            if (lastEntry.stems.stem1 === entry.stems.stem1 &&
                lastEntry.stems.stem2 === entry.stems.stem2 &&
                lastEntry.stems.stem3 === entry.stems.stem3 &&
                lastEntry.stems.stem4 === entry.stems.stem4 &&
                lastEntry.part.pofs === entry.part.pofs &&
                lastEntry.part.v?.con === entry.part.v?.con &&
                lastEntry.part.v?.var === entry.part.v?.var) {
              // Append the meaning to the previous entry (remove the | prefix)
              lastEntry.mean += '\n' + entry.mean.substring(1);
              continue; // Don't add as a new entry
            }
          }
        }
        
        const index = this.entries.length;
        this.entries.push(entry);
        
        // Index stems
        this.indexStem(entry.stems.stem1, index);
        this.indexStem(entry.stems.stem2, index);
        this.indexStem(entry.stems.stem3, index);
        this.indexStem(entry.stems.stem4, index);
        
        // Index English words
        this.indexEnglishWords(entry.mean, index);
      }
    }
  }

  parseDictlineLine(line) {
    // DICTLINE format:
    // Columns 1-75: stems (4 stems, 18 chars each + spaces)
    // Columns 77-100: part of speech info
    // Columns 101-110: translation info
    // Columns 111+: meaning
    
    if (line.length < 111) return null;
    
    const entry = new DictionaryEntry();
    
    // Parse stems (columns 1-75)
    const stemsStr = line.substring(0, 75);
    const stemParts = stemsStr.trim().split(/\s+/);
    entry.stems = new StemKey(
      stemParts[0] || '',
      stemParts[1] || '',
      stemParts[2] || '',
      stemParts[3] || ''
    );
    
    // Parse part of speech (columns 77-100)
    const partStr = line.substring(76, 100).trim();
    entry.part = this.parsePartOfSpeech(partStr);
    
    // Parse translation info (columns 101-110)
    const tranStr = line.substring(100, 110).trim();
    entry.tran = this.parseTranslationInfo(tranStr);
    
    // Parse meaning (columns 111+)
    entry.mean = line.substring(110).trim();
    
    return entry;
  }

  parsePartOfSpeech(partStr) {
    const parts = partStr.split(/\s+/);
    const part = { pofs: PartOfSpeech.X };
    
    if (parts[0] === 'N') {
      part.pofs = PartOfSpeech.N;
      part.n = {
        decl: parseInt(parts[1]) || 0,
        var: parseInt(parts[2]) || 0,
        gender: parts[3] || 'X'
      };
    } else if (parts[0] === 'V') {
      part.pofs = PartOfSpeech.V;
      part.v = {
        con: parseInt(parts[1]) || 0,
        var: parseInt(parts[2]) || 0,
        dep: parts[3] === 'DEP' // Check if it's a deponent verb
      };
    } else if (parts[0] === 'ADJ') {
      part.pofs = PartOfSpeech.ADJ;
      part.adj = {
        decl: parseInt(parts[1]) || 0,
        var: parseInt(parts[2]) || 0
      };
    } else if (parts[0] === 'ADV') {
      part.pofs = PartOfSpeech.ADV;
      part.adv = {};
    } else if (parts[0] === 'PREP') {
      part.pofs = PartOfSpeech.PREP;
      part.prep = { obj: parts[1] || 'X' };
    } else if (parts[0] === 'CONJ') {
      part.pofs = PartOfSpeech.CONJ;
    } else if (parts[0] === 'INTERJ') {
      part.pofs = PartOfSpeech.INTERJ;
    } else if (parts[0] === 'PRON') {
      part.pofs = PartOfSpeech.PRON;
      part.pron = {
        decl: parseInt(parts[1]) || 0,
        var: parseInt(parts[2]) || 0
      };
    } else if (parts[0] === 'NUM') {
      part.pofs = PartOfSpeech.NUM;
      part.num = {
        decl: parseInt(parts[1]) || 0,
        var: parseInt(parts[2]) || 0,
        sort: parts[3] || 'X'
      };
    }
    
    return part;
  }

  parseTranslationInfo(tranStr) {
    // Parse translation info which may have spaces between values
    const parts = tranStr.trim().split(/\s+/);
    if (parts.length >= 5) {
      // Format: X X X D X (with spaces)
      return {
        age: parts[0] || 'X',
        area: parts[1] || 'X', 
        geo: parts[2] || 'X',
        freq: parts[3] || 'X',
        source: parts[4] || 'X'
      };
    } else if (tranStr.length >= 5) {
      // Format: XXXDX (without spaces)
      return {
        age: tranStr.charAt(0) || 'X',
        area: tranStr.charAt(1) || 'X',
        geo: tranStr.charAt(2) || 'X',
        freq: tranStr.charAt(3) || 'X',
        source: tranStr.charAt(4) || 'X'
      };
    } else {
      // Default values
      return {
        age: 'X',
        area: 'X',
        geo: 'X',
        freq: 'X',
        source: 'X'
      };
    }
  }

  indexStem(stem, entryIndex) {
    stem = stem.trim().toLowerCase();
    if (stem === '' || stem === 'zzz') return;
    
    if (!this.stemIndex.has(stem)) {
      this.stemIndex.set(stem, []);
    }
    this.stemIndex.get(stem).push(entryIndex);
  }

  indexEnglishWords(meaning, entryIndex) {
    // Extract English words from meaning
    const words = meaning.toLowerCase()
      .replace(/[;,()[\]{}]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2); // Skip short words
    
    for (const word of words) {
      if (!this.englishIndex.has(word)) {
        this.englishIndex.set(word, []);
      }
      this.englishIndex.get(word).push(entryIndex);
    }
  }

  findByStem(stem) {
    stem = stem.trim().toLowerCase();
    const indices = this.stemIndex.get(stem) || [];
    return indices.map(i => this.entries[i]);
  }
  
  findByPartialStem(partialStem) {
    // Return all entries for partial stem matching (used for superlative checking)
    partialStem = partialStem.toLowerCase().trim();
    const results = [];
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (entry.stems.stem1.trim().startsWith(partialStem) ||
          entry.stems.stem2.trim().startsWith(partialStem) ||
          entry.stems.stem3.trim().startsWith(partialStem) ||
          entry.stems.stem4.trim().startsWith(partialStem)) {
        results.push(entry);
      }
    }
    return results;
  }

  findByEnglish(word) {
    word = word.trim().toLowerCase();
    const indices = this.englishIndex.get(word) || [];
    return [...new Set(indices)].map(i => this.entries[i]);
  }

  // Sample dictionary entries for testing
  static createSampleDictionary() {
    const dict = new Dictionary();
    
    // Sample entries
    dict.entries = [
      {
        stems: new StemKey('am', 'am', 'amav', 'amat'),
        part: { pofs: PartOfSpeech.V, v: { con: 1, var: 1 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'O' },
        mean: 'love, like; fall in love with; be fond of; have a tendency to;'
      },
      {
        stems: new StemKey('amat', 'amat'),
        part: { pofs: PartOfSpeech.ADJ, adj: { decl: 1, var: 1 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'E', source: 'O' },
        mean: 'loved, beloved;'
      },
      {
        stems: new StemKey('puell', 'puell'),
        part: { pofs: PartOfSpeech.N, n: { decl: 1, var: 1, gender: 'F' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'B', source: 'O' },
        mean: 'girl, (female) child/daughter; maiden; young woman/wife; sweetheart; slavegirl;'
      },
      {
        stems: new StemKey('bon', 'bon'),
        part: { pofs: PartOfSpeech.N, n: { decl: 2, var: 1, gender: 'M' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'C', source: 'O' },
        mean: 'good/moral/honest/brave man; man of honor, gentleman; better/rich people (pl.);'
      },
      {
        stems: new StemKey('bon', 'bon'),
        part: { pofs: PartOfSpeech.N, n: { decl: 2, var: 2, gender: 'N' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'O' },
        mean: 'good, good thing, profit, advantage; goods (pl.), possessions, wealth, estate;'
      },
      {
        stems: new StemKey('bon', 'bon'),
        part: { pofs: PartOfSpeech.ADJ, adj: { decl: 1, var: 1 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'O' },
        mean: 'good, honest, brave, noble, kind, pleasant, right, useful; valid; healthy;'
      },
      {
        stems: new StemKey('et'),
        part: { pofs: PartOfSpeech.CONJ },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'and, and even; also, even'
      },
      {
        stems: new StemKey('in'),
        part: { pofs: PartOfSpeech.PREP, prep: { obj: 'ABL' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'in, on, at (space); in accordance with/regard to/the case of; within (time);'
      },
      {
        stems: new StemKey('in'),
        part: { pofs: PartOfSpeech.PREP, prep: { obj: 'ACC' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'into; about, in the mist of; according to, after (manner); for; to, among;'
      },
      {
        stems: new StemKey('mor', 'mor'),
        part: { pofs: PartOfSpeech.N, n: { decl: 3, var: 1, gender: 'M' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'O' },
        mean: 'customs, character, behavior, manners; morals; mode/way of life; conduct;'
      },
      {
        stems: new StemKey('agricol', 'agricol'),
        part: { pofs: PartOfSpeech.N, n: { decl: 1, var: 1, gender: 'M' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'B', source: 'O' },
        mean: 'farmer, cultivator, gardener, agriculturist; plowman; farming'
      },
      {
        stems: new StemKey('femin', 'femin'),
        part: { pofs: PartOfSpeech.N, n: { decl: 1, var: 1, gender: 'F' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'O' },
        mean: 'woman; female'
      },
      {
        stems: new StemKey('ego', 'me'),
        part: { pofs: PartOfSpeech.PRON, pron: { decl: 5, var: 1 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'I, me (PERS); myself (REFLEX);'
      },
      {
        stems: new StemKey('corn', 'corn'),
        part: { pofs: PartOfSpeech.N, n: { decl: 4, var: 1, gender: 'F' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'C', source: 'O' },
        mean: 'cornel-cherry-tree (Cornus mas); cornel wood; javelin (of cornel wood);'
      },
      {
        stems: new StemKey('corn', 'corn'),
        part: { pofs: PartOfSpeech.N, n: { decl: 4, var: 2, gender: 'N' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'O' },
        mean: 'horn; hoof; beak/tusk/claw; bow; horn/trumpet; end, wing of army; mountain top;'
      },
      {
        stems: new StemKey('ill', 'ill'),
        part: { pofs: PartOfSpeech.PRON, pron: { decl: 6, var: 1 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'that; those (pl.); also DEMONST; that person/thing; the well known; the former;'
      },
      {
        stems: new StemKey('facil', 'facil'),
        part: { pofs: PartOfSpeech.ADJ, adj: { decl: 3, var: 2 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'easy, easy to do, without difficulty, ready, quick, good natured, courteous;'
      },
      {
        stems: new StemKey('facile'),
        part: { pofs: PartOfSpeech.ADV, adv: {} },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'B', source: 'O' },
        mean: 'easily, readily, without difficulty; generally, often; willingly; heedlessly;'
      },
      {
        stems: new StemKey('sequ', 'sequ', 'secut', 'secut'),
        part: { pofs: PartOfSpeech.V, v: { con: 3, var: 1, dep: true } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'O' },
        mean: 'follow; pursue; conform; imitate; come after; result from; attend;'
      },
      {
        stems: new StemKey('ab'),
        part: { pofs: PartOfSpeech.PREP, prep: { obj: 'ABL' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'O' },
        mean: 'by (agent), from (departure, cause, remote origin/time); after (reference);'
      },
      {
        stems: new StemKey('sin', 'sin'),
        part: { pofs: PartOfSpeech.N, n: { decl: 2, var: 1, gender: 'M' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'bowl for serving wine, etc;'
      },
      {
        stems: new StemKey('sin', 'sin', 'siv', 'sit'),
        part: { pofs: PartOfSpeech.V, v: { con: 3, var: 1 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'allow, permit;'
      },
      {
        stems: new StemKey('sine'),
        part: { pofs: PartOfSpeech.PREP, prep: { obj: 'ABL' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'without; (sometimes after object); lack; [Johannis sine Terra => John Lackland];'
      }
    ];
    
    // Rebuild indices
    dict.entries.forEach((entry, index) => {
      dict.indexStem(entry.stems.stem1, index);
      dict.indexStem(entry.stems.stem2, index);
      dict.indexStem(entry.stems.stem3, index);
      dict.indexStem(entry.stems.stem4, index);
      dict.indexEnglishWords(entry.mean, index);
    });
    
    return dict;
  }
}