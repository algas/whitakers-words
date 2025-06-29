import { PartOfSpeech, Gender, Case, Number, Person, Tense, Voice, Mood, Comparison } from './types.js';
import fs from 'fs';

// Latin inflection endings database
export class InflectionDatabase {
  constructor(inflectsFilePath) {
    if (!inflectsFilePath) {
      throw new Error('INFLECTS.LAT file path is required. Use -I option to specify the path.');
    }
    this.inflections = [];
    if (fs.existsSync(inflectsFilePath)) {
      this.loadFromInflectsLat(inflectsFilePath);
    } else {
      throw new Error(`INFLECTS.LAT file not found at: ${inflectsFilePath}`);
    }
  }

  loadFromInflectsLat(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('--') || line.startsWith(' ')) {
        continue; // Skip comments and empty lines
      }
      
      try {
        const inflection = this.parseInflectionLine(line);
        if (inflection) {
          this.inflections.push(inflection);
        }
      } catch (error) {
        // Skip malformed lines but continue processing
        console.warn(`Warning: Could not parse inflection line: ${line}`);
      }
    }
    
    console.log(`Loaded ${this.inflections.length} inflections from ${filePath}`);
  }

  parseInflectionLine(line) {
    // Format examples:
    // N     1 1 NOM S C  1 1 a         X A
    // V     1 1 PRES  ACTIVE  IND  1 S  1 1 o             X A
    // PRON  1 0 GEN S X   2 3 jus                         X A
    
    const trimmedLine = line.trim();
    const parts = trimmedLine.split(/\s+/);
    
    if (parts.length < 6) return null;
    
    const pofs = parts[0];
    
    if (pofs === 'N') {
      return this.parseNounInflection(parts);
    } else if (pofs === 'V') {
      return this.parseVerbInflection(parts);
    } else if (pofs === 'ADJ') {
      return this.parseAdjectiveInflection(parts);
    } else if (pofs === 'PRON') {
      return this.parsePronounInflection(parts);
    } else if (pofs === 'ADV') {
      return this.parseAdverbInflection(parts);
    } else if (pofs === 'PREP') {
      return this.parsePrepositionInflection(parts);
    } else if (pofs === 'CONJ') {
      return this.parseConjunctionInflection(parts);
    } else if (pofs === 'INTERJ') {
      return this.parseInterjectionInflection(parts);
    } else if (pofs === 'VPAR') {
      return this.parseParticipleInflection(parts);
    } else if (pofs === 'SUPINE') {
      return this.parseSupineInflection(parts);
    }
    
    return null;
  }

  parseNounInflection(parts) {
    // N     1 1 NOM S C  1 1 a         X A
    if (parts.length < 9) return null;
    
    const decl = parseInt(parts[1]);
    const var_num = parseInt(parts[2]);
    const cs = parts[3];
    const number = parts[4];
    const gender = parts[5];
    const stem_key = parseInt(parts[6]);
    // const ending_size = parseInt(parts[7]); // Not used in current implementation
    const ending = parts[8] || '';
    
    return {
      qual: {
        pofs: PartOfSpeech.N,
        n: { decl, var: var_num, cs, number, gender }
      },
      ending,
      key: stem_key
    };
  }

  parseVerbInflection(parts) {
    // V     1 1 PRES  ACTIVE  IND  1 S  1 1 o             X A
    if (parts.length < 12) return null;
    
    const con = parseInt(parts[1]);
    const var_num = parseInt(parts[2]);
    const tense = parts[3];
    const voice = parts[4];
    const mood = parts[5];
    const person = parseInt(parts[6]);
    const number = parts[7];
    const stem_key = parseInt(parts[8]);
    // const ending_size = parseInt(parts[9]); // Not used in current implementation
    const ending = parts[10] || '';
    
    return {
      qual: {
        pofs: PartOfSpeech.V,
        v: { con, var: var_num, tense, voice, mood, person, number }
      },
      ending,
      key: stem_key
    };
  }

  parseAdjectiveInflection(parts) {
    // ADJ   1 1 NOM S C POS  1 2 us        X A
    if (parts.length < 11) return null;
    
    const decl = parseInt(parts[1]);
    const var_num = parseInt(parts[2]);
    const cs = parts[3];
    const number = parts[4];
    const gender = parts[5];
    const comp = parts[6];
    const stem_key = parseInt(parts[7]);
    // const ending_size = parseInt(parts[8]); // Not used in current implementation
    const ending = parts[9] || '';
    
    return {
      qual: {
        pofs: PartOfSpeech.ADJ,
        adj: { decl, var: var_num, cs, number, gender, comp }
      },
      ending,
      key: stem_key
    };
  }

  parsePronounInflection(parts) {
    // PRON  1 0 GEN S X   2 3 jus                         X A
    if (parts.length < 9) return null;
    
    const decl = parseInt(parts[1]);
    const var_num = parseInt(parts[2]);
    const cs = parts[3];
    const number = parts[4];
    const gender = parts[5];
    const stem_key = parseInt(parts[6]);
    // const ending_size = parseInt(parts[7]); // Not used in current implementation
    const ending = parts[8] || '';
    
    return {
      qual: {
        pofs: PartOfSpeech.PRON,
        pron: { decl, var: var_num, cs, number, gender }
      },
      ending,
      key: stem_key
    };
  }

  parseAdverbInflection(parts) {
    // ADV    POS 1 0       X A
    const comp = parts[1] === 'X' ? 'POS' : parts[1];
    
    return {
      qual: {
        pofs: PartOfSpeech.ADV,
        adv: { comp }
      },
      ending: '',
      key: 1
    };
  }

  parsePrepositionInflection(parts) {
    // PREP   ACC 1 0       X A
    const obj = parts[1];
    
    return {
      qual: {
        pofs: PartOfSpeech.PREP,
        prep: { obj }
      },
      ending: '',
      key: 1
    };
  }

  parseConjunctionInflection() {
    return {
      qual: {
        pofs: PartOfSpeech.CONJ,
        conj: {}
      },
      ending: '',
      key: 1
    };
  }

  parseInterjectionInflection() {
    return {
      qual: {
        pofs: PartOfSpeech.INTERJ,
        interj: {}
      },
      ending: '',
      key: 1
    };
  }

  parseParticipleInflection(parts) {
    // VPAR  1 0 NOM S M PERF PASSIVE PPL 4 2 us        X A
    if (parts.length < 12) return null;
    
    const con = parseInt(parts[1]);
    const var_num = parseInt(parts[2]);
    const cs = parts[3];
    const number = parts[4];
    const gender = parts[5];
    const tense = parts[6];
    const voice = parts[7];
    const mood = parts[8];
    const stem_key = parseInt(parts[9]);
    // const ending_size = parseInt(parts[10]); // Not used in current implementation
    const ending = parts[11] || '';
    
    return {
      qual: {
        pofs: PartOfSpeech.VPAR,
        vpar: { con, var: var_num, cs, number, gender, tense, voice, mood }
      },
      ending,
      key: stem_key
    };
  }

  parseSupineInflection(parts) {
    // SUPINE 0 0 ACC S N  4 2 um                          X A
    if (parts.length < 9) return null;
    
    const con = parseInt(parts[1]);
    const var_num = parseInt(parts[2]);
    const cs = parts[3];
    const number = parts[4];
    const gender = parts[5];
    const stem_key = parseInt(parts[6]);
    // const ending_size = parseInt(parts[7]); // Not used in current implementation
    const ending = parts[8] || '';
    
    return {
      qual: {
        pofs: PartOfSpeech.SUPINE,
        supine: { con, var: var_num, cs, number, gender }
      },
      ending,
      key: stem_key
    };
  }



  findInflections(ending, pofs = null) {
    return this.inflections.filter(inf => {
      if (pofs && inf.qual.pofs !== pofs) return false;
      return ending.endsWith(inf.ending);
    });
  }

  removeEnding(word, ending) {
    if (word.endsWith(ending)) {
      return word.substring(0, word.length - ending.length);
    }
    return null;
  }
}