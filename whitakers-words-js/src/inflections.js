import { PartOfSpeech, Gender, Case, Number, Person, Tense, Voice, Mood, Comparison } from './types.js';
import fs from 'fs';

// Latin inflection endings database
export class InflectionDatabase {
  constructor(inflectsFilePath = null) {
    this.inflections = [];
    if (inflectsFilePath && fs.existsSync(inflectsFilePath)) {
      this.loadFromInflectsLat(inflectsFilePath);
    } else {
      this.loadInflections(); // Fallback to hardcoded inflections
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

  loadInflections() {
    // Noun inflections - 1st declension (feminine)
    this.addNounInflection(1, 'a', Case.NOM, Number.S, Gender.F);
    this.addNounInflection(1, 'a', Case.VOC, Number.S, Gender.F);
    this.addNounInflection(1, 'a', Case.ABL, Number.S, Gender.F);
    this.addNounInflection(1, 'ae', Case.GEN, Number.S, Gender.F);
    this.addNounInflection(1, 'ae', Case.DAT, Number.S, Gender.F);
    this.addNounInflection(1, 'ae', Case.NOM, Number.P, Gender.F);
    this.addNounInflection(1, 'ae', Case.VOC, Number.P, Gender.F);
    this.addNounInflection(1, 'am', Case.ACC, Number.S, Gender.F);
    this.addNounInflection(1, 'arum', Case.GEN, Number.P, Gender.F);
    this.addNounInflection(1, 'arum', Case.GEN, Number.P, Gender.M); // 1st declension masculine
    this.addNounInflection(1, 'is', Case.DAT, Number.P, Gender.F);
    this.addNounInflection(1, 'is', Case.DAT, Number.P, Gender.M); // 1st declension masculine
    this.addNounInflection(1, 'is', Case.ABL, Number.P, Gender.F);
    this.addNounInflection(1, 'is', Case.ABL, Number.P, Gender.M); // 1st declension masculine
    this.addNounInflection(1, 'as', Case.ACC, Number.P, Gender.F);
    this.addNounInflection(1, 'as', Case.ACC, Number.P, Gender.M); // 1st declension masculine

    // Noun inflections - 2nd declension (masculine/neuter)
    this.addNounInflection(2, 'us', Case.NOM, Number.S, Gender.M);
    this.addNounInflection(2, 'e', Case.VOC, Number.S, Gender.M);
    this.addNounInflection(2, 'i', Case.GEN, Number.S, Gender.M);
    this.addNounInflection(2, 'o', Case.DAT, Number.S, Gender.M);
    this.addNounInflection(2, 'o', Case.ABL, Number.S, Gender.M);
    this.addNounInflection(2, 'um', Case.ACC, Number.S, Gender.M);
    this.addNounInflection(2, 'i', Case.NOM, Number.P, Gender.M);
    this.addNounInflection(2, 'i', Case.VOC, Number.P, Gender.M);
    this.addNounInflection(2, 'orum', Case.GEN, Number.P, Gender.M);
    this.addNounInflection(2, 'is', Case.DAT, Number.P, Gender.M);
    this.addNounInflection(2, 'is', Case.ABL, Number.P, Gender.M);
    this.addNounInflection(2, 'os', Case.ACC, Number.P, Gender.M);

    // 2nd declension neuter
    this.addNounInflection(2, 'um', Case.NOM, Number.S, Gender.N);
    this.addNounInflection(2, 'um', Case.VOC, Number.S, Gender.N);
    this.addNounInflection(2, 'um', Case.ACC, Number.S, Gender.N);
    this.addNounInflection(2, 'i', Case.GEN, Number.S, Gender.N);
    this.addNounInflection(2, 'o', Case.DAT, Number.S, Gender.N);
    this.addNounInflection(2, 'o', Case.ABL, Number.S, Gender.N);
    this.addNounInflection(2, 'a', Case.NOM, Number.P, Gender.N);
    this.addNounInflection(2, 'a', Case.VOC, Number.P, Gender.N);
    this.addNounInflection(2, 'a', Case.ACC, Number.P, Gender.N);
    this.addNounInflection(2, 'orum', Case.GEN, Number.P, Gender.N);
    this.addNounInflection(2, 'is', Case.DAT, Number.P, Gender.N);
    this.addNounInflection(2, 'is', Case.ABL, Number.P, Gender.N);

    // Additional 2nd declension forms for -um ending (both M and N)
    this.addNounInflection(2, 'um', Case.ACC, Number.S, Gender.M);

    // 3rd declension
    this.addNounInflection(3, '', Case.NOM, Number.S, Gender.X);
    this.addNounInflection(3, '', Case.VOC, Number.S, Gender.X);
    this.addNounInflection(3, 'is', Case.GEN, Number.S, Gender.X);
    this.addNounInflection(3, 'i', Case.DAT, Number.S, Gender.X);
    this.addNounInflection(3, 'e', Case.ABL, Number.S, Gender.X);
    this.addNounInflection(3, 'em', Case.ACC, Number.S, Gender.C);
    this.addNounInflection(3, '', Case.ACC, Number.S, Gender.N);
    this.addNounInflection(3, 'es', Case.NOM, Number.P, Gender.C);
    this.addNounInflection(3, 'es', Case.VOC, Number.P, Gender.C);
    this.addNounInflection(3, 'es', Case.ACC, Number.P, Gender.C);
    this.addNounInflection(3, 'es', Case.NOM, Number.P, Gender.M);
    this.addNounInflection(3, 'es', Case.VOC, Number.P, Gender.M);
    this.addNounInflection(3, 'es', Case.ACC, Number.P, Gender.M);
    this.addNounInflection(3, 'a', Case.NOM, Number.P, Gender.N);
    this.addNounInflection(3, 'a', Case.VOC, Number.P, Gender.N);
    this.addNounInflection(3, 'a', Case.ACC, Number.P, Gender.N);
    this.addNounInflection(3, 'um', Case.GEN, Number.P, Gender.X);
    this.addNounInflection(3, 'ibus', Case.DAT, Number.P, Gender.X);
    this.addNounInflection(3, 'ibus', Case.ABL, Number.P, Gender.X);

    // 4th declension
    this.addNounInflection(4, 'us', Case.NOM, Number.S, Gender.M);
    this.addNounInflection(4, 'us', Case.VOC, Number.S, Gender.M);
    this.addNounInflection(4, 'us', Case.GEN, Number.S, Gender.M);
    this.addNounInflection(4, 'ui', Case.DAT, Number.S, Gender.M);
    this.addNounInflection(4, 'um', Case.ACC, Number.S, Gender.M);
    this.addNounInflection(4, 'u', Case.ABL, Number.S, Gender.M);
    this.addNounInflection(4, 'us', Case.NOM, Number.P, Gender.M);
    this.addNounInflection(4, 'us', Case.VOC, Number.P, Gender.M);
    this.addNounInflection(4, 'uum', Case.GEN, Number.P, Gender.M);
    this.addNounInflection(4, 'ibus', Case.DAT, Number.P, Gender.M);
    this.addNounInflection(4, 'us', Case.ACC, Number.P, Gender.M);
    this.addNounInflection(4, 'ibus', Case.ABL, Number.P, Gender.M);

    // 4th declension neuter
    this.addNounInflection(4, 'u', Case.NOM, Number.S, Gender.N);
    this.addNounInflection(4, 'u', Case.VOC, Number.S, Gender.N);
    this.addNounInflection(4, 'us', Case.GEN, Number.S, Gender.N);
    this.addNounInflection(4, 'u', Case.DAT, Number.S, Gender.N);
    this.addNounInflection(4, 'u', Case.ACC, Number.S, Gender.N);
    this.addNounInflection(4, 'u', Case.ABL, Number.S, Gender.N);
    this.addNounInflection(4, 'ua', Case.NOM, Number.P, Gender.N);
    this.addNounInflection(4, 'ua', Case.VOC, Number.P, Gender.N);
    this.addNounInflection(4, 'uum', Case.GEN, Number.P, Gender.N);
    this.addNounInflection(4, 'ibus', Case.DAT, Number.P, Gender.N);
    this.addNounInflection(4, 'ua', Case.ACC, Number.P, Gender.N);
    this.addNounInflection(4, 'ibus', Case.ABL, Number.P, Gender.N);

    // 4th declension feminine (like cornus)
    this.addNounInflection(4, 'us', Case.NOM, Number.S, Gender.F);
    this.addNounInflection(4, 'us', Case.VOC, Number.S, Gender.F);
    this.addNounInflection(4, 'us', Case.GEN, Number.S, Gender.F);
    this.addNounInflection(4, 'ui', Case.DAT, Number.S, Gender.F);
    this.addNounInflection(4, 'um', Case.ACC, Number.S, Gender.F);
    this.addNounInflection(4, 'u', Case.ABL, Number.S, Gender.F);

    // Verb inflections - 1st conjugation present indicative active
    this.addVerbInflection(1, 'o', Person[1], Number.S, Tense.PRES, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'as', Person[2], Number.S, Tense.PRES, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'at', Person[3], Number.S, Tense.PRES, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'amus', Person[1], Number.P, Tense.PRES, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'atis', Person[2], Number.P, Tense.PRES, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'ant', Person[3], Number.P, Tense.PRES, Voice.ACTIVE, Mood.IND);

    // 1st conjugation imperfect indicative active
    this.addVerbInflection(1, 'abam', Person[1], Number.S, Tense.IMPF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abas', Person[2], Number.S, Tense.IMPF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abat', Person[3], Number.S, Tense.IMPF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abamus', Person[1], Number.P, Tense.IMPF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abatis', Person[2], Number.P, Tense.IMPF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abant', Person[3], Number.P, Tense.IMPF, Voice.ACTIVE, Mood.IND);

    // 1st conjugation future indicative active
    this.addVerbInflection(1, 'abo', Person[1], Number.S, Tense.FUT, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abis', Person[2], Number.S, Tense.FUT, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abit', Person[3], Number.S, Tense.FUT, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abimus', Person[1], Number.P, Tense.FUT, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abitis', Person[2], Number.P, Tense.FUT, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(1, 'abunt', Person[3], Number.P, Tense.FUT, Voice.ACTIVE, Mood.IND);

    // Perfect stems
    this.addVerbInflection(0, 'i', Person[1], Number.S, Tense.PERF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(0, 'isti', Person[2], Number.S, Tense.PERF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(0, 'it', Person[3], Number.S, Tense.PERF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(0, 'imus', Person[1], Number.P, Tense.PERF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(0, 'istis', Person[2], Number.P, Tense.PERF, Voice.ACTIVE, Mood.IND);
    this.addVerbInflection(0, 'erunt', Person[3], Number.P, Tense.PERF, Voice.ACTIVE, Mood.IND);

    // Adjective inflections 1st/2nd declension
    this.addAdjectiveInflection(1, 'us', Case.NOM, Number.S, Gender.M, Comparison.POS);
    this.addAdjectiveInflection(1, 'a', Case.NOM, Number.S, Gender.F, Comparison.POS);
    this.addAdjectiveInflection(1, 'um', Case.NOM, Number.S, Gender.N, Comparison.POS);
    this.addAdjectiveInflection(1, 'um', Case.VOC, Number.S, Gender.N, Comparison.POS);
    this.addAdjectiveInflection(1, 'um', Case.ACC, Number.S, Gender.M, Comparison.POS);
    this.addAdjectiveInflection(1, 'um', Case.ACC, Number.S, Gender.N, Comparison.POS);
    this.addAdjectiveInflection(1, 'i', Case.GEN, Number.S, Gender.M, Comparison.POS);
    this.addAdjectiveInflection(1, 'ae', Case.GEN, Number.S, Gender.F, Comparison.POS);
    this.addAdjectiveInflection(1, 'i', Case.GEN, Number.S, Gender.N, Comparison.POS);

    // Comparative
    this.addAdjectiveInflection(3, 'ior', Case.NOM, Number.S, Gender.C, Comparison.COMP);
    this.addAdjectiveInflection(3, 'ius', Case.NOM, Number.S, Gender.N, Comparison.COMP);

    // Superlative
    this.addAdjectiveInflection(1, 'issimus', Case.NOM, Number.S, Gender.M, Comparison.SUPER);
    this.addAdjectiveInflection(1, 'issima', Case.NOM, Number.S, Gender.F, Comparison.SUPER);
    this.addAdjectiveInflection(1, 'issimum', Case.NOM, Number.S, Gender.N, Comparison.SUPER);

    // Pronoun inflections - ego
    this.addPronounInflection(5, '', Case.NOM, Number.S); // ego
    this.addPronounInflection(5, 'i', Case.GEN, Number.S); // mei
    this.addPronounInflection(5, 'ihi', Case.DAT, Number.S); // mihi
    this.addPronounInflection(5, 'e', Case.ACC, Number.S); // me
    this.addPronounInflection(5, 'e', Case.ABL, Number.S); // me

    // Demonstrative pronoun inflections - ille, illa, illud (6th declension pattern)
    this.addPronounInflection(6, 'e', Case.NOM, Number.S, Gender.M); // ille
    this.addPronounInflection(6, 'a', Case.NOM, Number.S, Gender.F); // illa
    this.addPronounInflection(6, 'ud', Case.NOM, Number.S, Gender.N); // illud
    this.addPronounInflection(6, 'ud', Case.ACC, Number.S, Gender.N); // illud
    this.addPronounInflection(6, 'um', Case.ACC, Number.S, Gender.M); // illum
    this.addPronounInflection(6, 'am', Case.ACC, Number.S, Gender.F); // illam
    this.addPronounInflection(6, 'ius', Case.GEN, Number.S, Gender.X); // illius (all genders)
    this.addPronounInflection(6, 'i', Case.DAT, Number.S, Gender.X); // illi (all genders)
    this.addPronounInflection(6, 'o', Case.ABL, Number.S, Gender.M); // illo
    this.addPronounInflection(6, 'a', Case.ABL, Number.S, Gender.F); // illa
    this.addPronounInflection(6, 'o', Case.ABL, Number.S, Gender.N); // illo
  }

  addNounInflection(decl, ending, cs, number, gender) {
    this.inflections.push({
      qual: {
        pofs: PartOfSpeech.N,
        n: { decl, cs, number, gender }
      },
      ending,
      key: 1
    });
  }

  addVerbInflection(con, ending, person, number, tense, voice, mood) {
    this.inflections.push({
      qual: {
        pofs: PartOfSpeech.V,
        v: { con, person, number, tense, voice, mood }
      },
      ending,
      key: tense === Tense.PERF || tense === Tense.PLUP || tense === Tense.FUTP ? 3 : 1
    });
  }

  addAdjectiveInflection(decl, ending, cs, number, gender, comp) {
    this.inflections.push({
      qual: {
        pofs: PartOfSpeech.ADJ,
        adj: { decl, cs, number, gender, comp }
      },
      ending,
      key: 1
    });
  }

  addPronounInflection(decl, ending, cs, number, gender = 'X') {
    this.inflections.push({
      qual: {
        pofs: PartOfSpeech.PRON,
        pron: { decl, cs, number, gender }
      },
      ending,
      key: 1
    });
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