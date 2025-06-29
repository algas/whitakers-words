// Part of Speech types
export const PartOfSpeech = {
  N: 'N',     // Noun
  PRON: 'PRON', // Pronoun
  PACK: 'PACK', // Packon
  ADJ: 'ADJ',   // Adjective
  NUM: 'NUM',   // Numeral
  ADV: 'ADV',   // Adverb
  V: 'V',       // Verb
  VPAR: 'VPAR', // Participle
  SUPINE: 'SUPINE',
  PREP: 'PREP', // Preposition
  CONJ: 'CONJ', // Conjunction
  INTERJ: 'INTERJ', // Interjection
  TACKON: 'TACKON', // Enclitic
  X: 'X'        // Unknown/all
};

// Gender types
export const Gender = {
  X: 'X', // Unknown/all
  M: 'M', // Masculine
  F: 'F', // Feminine
  N: 'N', // Neuter
  C: 'C'  // Common (M or F)
};

// Case types
export const Case = {
  X: 'X',   // Unknown/all
  NOM: 'NOM', // Nominative
  VOC: 'VOC', // Vocative
  GEN: 'GEN', // Genitive
  LOC: 'LOC', // Locative
  DAT: 'DAT', // Dative
  ABL: 'ABL', // Ablative
  ACC: 'ACC'  // Accusative
};

// Number types
export const Number = {
  X: 'X', // Unknown/all
  S: 'S', // Singular
  P: 'P'  // Plural
};

// Person types
export const Person = {
  X: 0, // Unknown/all
  1: 1, // First person
  2: 2, // Second person
  3: 3  // Third person
};

// Tense types
export const Tense = {
  X: 'X',     // Unknown/all
  PRES: 'PRES', // Present
  IMPF: 'IMPF', // Imperfect
  FUT: 'FUT',   // Future
  PERF: 'PERF', // Perfect
  PLUP: 'PLUP', // Pluperfect
  FUTP: 'FUTP'  // Future perfect
};

// Voice types
export const Voice = {
  X: 'X',       // Unknown/all
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE'
};

// Mood types
export const Mood = {
  X: 'X',     // Unknown/all
  IND: 'IND', // Indicative
  SUB: 'SUB', // Subjunctive
  IMP: 'IMP', // Imperative
  INF: 'INF', // Infinitive
  PPL: 'PPL'  // Participle
};

// Comparison types
export const Comparison = {
  X: 'X',     // Unknown/all
  POS: 'POS', // Positive
  COMP: 'COMP', // Comparative
  SUPER: 'SUPER' // Superlative
};

// Stem key type
export class StemKey {
  constructor(stem1 = '', stem2 = '', stem3 = '', stem4 = '') {
    this.stem1 = stem1.padEnd(18, ' ');
    this.stem2 = stem2.padEnd(18, ' ');
    this.stem3 = stem3.padEnd(18, ' ');
    this.stem4 = stem4.padEnd(18, ' ');
  }
}

// Dictionary entry
export class DictionaryEntry {
  constructor() {
    this.stems = new StemKey();
    this.part = {};
    this.tran = { age: '', area: '', geo: '', freq: '', source: '' };
    this.mean = '';
  }
}

// Inflection record
export class InflectionRecord {
  constructor() {
    this.qual = {};
    this.key = 0;
    this.ending = { size: 0, suf: '' };
    this.age = '';
    this.freq = '';
  }
}

// Parse record - result of analysis
export class ParseRecord {
  constructor() {
    this.stem = new StemKey();
    this.inflection = new InflectionRecord();
    this.dictEntry = new DictionaryEntry();
    this.mnpc = 0; // dictionary index
  }
}

// Quality record for inflections
export class QualityRecord {
  constructor(pofs = PartOfSpeech.X) {
    this.pofs = pofs;
    
    if (pofs === PartOfSpeech.N) {
      this.n = { decl: 0, cs: Case.X, number: Number.X, gender: Gender.X };
    } else if (pofs === PartOfSpeech.PRON) {
      this.pron = { decl: 0, cs: Case.X, number: Number.X, gender: Gender.X };
    } else if (pofs === PartOfSpeech.PACK) {
      this.pack = { decl: 0, cs: Case.X, number: Number.X, gender: Gender.X };
    } else if (pofs === PartOfSpeech.ADJ) {
      this.adj = { decl: 0, cs: Case.X, number: Number.X, gender: Gender.X, comp: Comparison.X };
    } else if (pofs === PartOfSpeech.NUM) {
      this.num = { decl: 0, cs: Case.X, number: Number.X, gender: Gender.X, sort: 0 };
    } else if (pofs === PartOfSpeech.ADV) {
      this.adv = { comp: Comparison.X };
    } else if (pofs === PartOfSpeech.V) {
      this.v = { 
        con: 0, 
        cs: Case.X, 
        number: Number.X, 
        person: Person.X, 
        tense: Tense.X, 
        voice: Voice.X, 
        mood: Mood.X 
      };
    } else if (pofs === PartOfSpeech.VPAR) {
      this.vpar = { 
        con: 0, 
        cs: Case.X, 
        number: Number.X, 
        gender: Gender.X,
        tense: Tense.X,
        voice: Voice.X,
        mood: Mood.X
      };
    } else if (pofs === PartOfSpeech.SUPINE) {
      this.supine = { con: 0, cs: Case.X, number: Number.X, gender: Gender.X };
    } else if (pofs === PartOfSpeech.PREP) {
      this.prep = { obj: Case.X };
    } else if (pofs === PartOfSpeech.CONJ) {
      this.conj = {};
    } else if (pofs === PartOfSpeech.INTERJ) {
      this.interj = {};
    } else {
      this.x = {};
    }
  }
}