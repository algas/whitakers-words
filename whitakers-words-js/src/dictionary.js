import { PartOfSpeech, DictionaryEntry, StemKey } from './types.js';
import fs from 'fs';
import path from 'path';

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
        var: parseInt(parts[2]) || 0
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
    // Simple parsing - in real implementation would be more complex
    return {
      age: tranStr.charAt(0) || 'X',
      area: tranStr.charAt(1) || 'X',
      geo: tranStr.charAt(2) || 'X',
      freq: tranStr.charAt(3) || 'X',
      source: tranStr.substring(4).trim() || 'X'
    };
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
        stems: new StemKey('am', 'am', 'amat', 'amat'),
        part: { pofs: PartOfSpeech.V, v: { con: 1, var: 1 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'love, like; fall in love with; be fond of; have a tendency to'
      },
      {
        stems: new StemKey('puell', 'puell'),
        part: { pofs: PartOfSpeech.N, n: { decl: 1, var: 1, gender: 'F' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'girl, (female) child; maiden; young woman; sweetheart'
      },
      {
        stems: new StemKey('bon', 'bon'),
        part: { pofs: PartOfSpeech.ADJ, adj: { decl: 1, var: 1 } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'good, honest, brave, noble, kind, pleasant, right, useful; valid; healthy'
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
        mean: 'in, on, at; in accordance with/regard to/the case of; within'
      },
      {
        stems: new StemKey('in'),
        part: { pofs: PartOfSpeech.PREP, prep: { obj: 'ACC' } },
        tran: { age: 'X', area: 'X', geo: 'X', freq: 'A', source: 'X' },
        mean: 'into; about, in the mist of; according to, after; for; to, among'
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