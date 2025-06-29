import { PartOfSpeech, Gender, Case, Number, Person, Tense, Voice, Mood, Comparison } from './types.js';

// Latin inflection endings database
export class InflectionDatabase {
  constructor() {
    this.inflections = [];
    this.loadInflections();
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
    this.addNounInflection(1, 'is', Case.DAT, Number.P, Gender.F);
    this.addNounInflection(1, 'is', Case.ABL, Number.P, Gender.F);
    this.addNounInflection(1, 'as', Case.ACC, Number.P, Gender.F);

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
    this.addNounInflection(3, 'a', Case.NOM, Number.P, Gender.N);
    this.addNounInflection(3, 'a', Case.VOC, Number.P, Gender.N);
    this.addNounInflection(3, 'a', Case.ACC, Number.P, Gender.N);
    this.addNounInflection(3, 'um', Case.GEN, Number.P, Gender.X);
    this.addNounInflection(3, 'ibus', Case.DAT, Number.P, Gender.X);
    this.addNounInflection(3, 'ibus', Case.ABL, Number.P, Gender.X);

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