import { PartOfSpeech } from './types.js';

export class EnglishLookup {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }

  lookup(englishWord) {
    const results = [];
    const entries = this.dictionary.findByEnglish(englishWord);
    
    // Group by part of speech
    const grouped = new Map();
    
    for (const entry of entries) {
      const pofs = entry.part.pofs;
      if (!grouped.has(pofs)) {
        grouped.set(pofs, []);
      }
      grouped.get(pofs).push(entry);
    }
    
    return grouped;
  }

  formatOutput(englishWord, grouped) {
    let output = `\nEnglish: ${englishWord}\n`;
    output += '='.repeat(40) + '\n\n';
    
    // Order of parts of speech for display
    const order = [
      PartOfSpeech.N, PartOfSpeech.V, PartOfSpeech.ADJ, 
      PartOfSpeech.ADV, PartOfSpeech.PREP, PartOfSpeech.CONJ,
      PartOfSpeech.PRON, PartOfSpeech.NUM, PartOfSpeech.INTERJ
    ];
    
    for (const pofs of order) {
      if (grouped.has(pofs)) {
        const entries = grouped.get(pofs);
        output += this.formatPartOfSpeech(pofs, entries);
      }
    }
    
    return output;
  }

  formatPartOfSpeech(pofs, entries) {
    let output = `${pofs}:\n`;
    
    for (const entry of entries) {
      // Format Latin form
      output += '  ';
      const stems = entry.stems;
      
      if (pofs === PartOfSpeech.N) {
        output += `${stems.stem1.trim()}, `;
        if (stems.stem2.trim()) {
          // Form the genitive
          output += `${stems.stem2.trim()}`;
          if (entry.part.n.decl === 1) output += 'ae';
          else if (entry.part.n.decl === 2) output += 'i';
          else if (entry.part.n.decl === 3) output += 'is';
          else if (entry.part.n.decl === 4) output += 'us';
          else if (entry.part.n.decl === 5) output += 'ei';
        }
        output += ` ${entry.part.n.gender}`;
      } else if (pofs === PartOfSpeech.V) {
        // Show principal parts
        output += `${stems.stem1.trim()}o, `;
        output += `${stems.stem1.trim()}are, `;
        if (stems.stem3.trim()) output += `${stems.stem3.trim()}i, `;
        if (stems.stem4.trim()) output += `${stems.stem4.trim()}us`;
      } else if (pofs === PartOfSpeech.ADJ) {
        if (entry.part.adj.decl === 1) {
          output += `${stems.stem1.trim()}us, -a, -um`;
        } else if (entry.part.adj.decl === 3) {
          if (stems.stem2.trim()) {
            output += `${stems.stem1.trim()}, ${stems.stem2.trim()}is`;
          } else {
            output += `${stems.stem1.trim()}`;
          }
        }
      } else {
        output += stems.stem1.trim();
      }
      
      // Add meaning
      output += '\n    ' + entry.mean + '\n';
    }
    
    output += '\n';
    return output;
  }
}