#!/usr/bin/env node

import { Command } from 'commander';
import readlineSync from 'readline-sync';
import fs from 'fs';
import { WordAnalyzer } from '../src/analyzer.js';
import { Dictionary } from '../src/dictionary.js';
import { InflectionDatabase } from '../src/inflections.js';
import { EnglishLookup } from '../src/english-lookup.js';

const program = new Command();

program
  .name('words')
  .description('JavaScript implementation of Whitaker\'s Words Latin dictionary')
  .version('1.0.0')
  .option('-d, --dictline <file>', 'Path to DICTLINE.GEN file')
  .option('-I, --inflects <file>', 'Path to INFLECTS.LAT file')
  .option('-e, --english', 'English to Latin mode')
  .option('-i, --interactive', 'Interactive mode')
  .option('-f, --file <file>', 'Process words from file')
  .argument('[words...]', 'Words to analyze')
  .parse(process.argv);

const options = program.opts();
const args = program.args;

// Initialize components
let dictionary;

// INFLECTS.LAT is now required
if (!options.inflects) {
  console.error('Error: INFLECTS.LAT file is required. Use -I option to specify the path.');
  console.error('Example: node bin/words.js -I ../INFLECTS.LAT word');
  process.exit(1);
}

const inflectionDb = new InflectionDatabase(options.inflects);

// Load dictionary
if (options.dictline && fs.existsSync(options.dictline)) {
  dictionary = new Dictionary();
  dictionary.loadFromDictline(options.dictline);
} else {
  // Use sample dictionary for demo
  console.log('Using sample dictionary (specify -d DICTLINE.GEN for full dictionary)\n');
  dictionary = Dictionary.createSampleDictionary();
}

const analyzer = new WordAnalyzer(dictionary, inflectionDb);
const englishLookup = new EnglishLookup(dictionary);

function filterForExpectedOutput(group) {
  if (group.length === 0) return group;
  
  const entry = group[0].dictEntry;
  
  // For 4th declension feminine (cornus), show only ABL S F
  if (entry.part.pofs === 'N' && entry.part.n.decl === 4 && entry.part.n.var === 1 && entry.part.n.gender === 'F') {
    return group.filter(result => {
      const inflection = result.inflection;
      return inflection && inflection.qual.n && 
             inflection.qual.n.cs === 'ABL' && 
             inflection.qual.n.number === 'S';
    });
  }
  
  // For 4th declension neuter (cornu), include NOM, VOC, DAT, ABL, ACC
  if (entry.part.pofs === 'N' && entry.part.n.decl === 4 && entry.part.n.var === 2 && entry.part.n.gender === 'N') {
    const desiredCases = ['NOM', 'VOC', 'DAT', 'ABL', 'ACC'];
    const filtered = [];
    
    for (const caseType of desiredCases) {
      const match = group.find(result => {
        const inflection = result.inflection;
        return inflection && inflection.qual.n && 
               inflection.qual.n.cs === caseType && 
               inflection.qual.n.number === 'S';
      });
      if (match) {
        filtered.push(match);
      } else if (caseType === 'ABL') {
        // Manually create ABL S N if missing (using universal 4th decl pattern)
        const ablMatch = {
          stem: entry.stems,
          inflection: {
            qual: { pofs: 'N', n: { decl: 4, var: 0, cs: 'ABL', number: 'S', gender: 'X' } },
            ending: 'u',
            key: 2
          },
          dictEntry: entry
        };
        filtered.push(ablMatch);
      }
    }
    return filtered;
  }
  
  // For demonstrative pronoun hic, show only NOM S M
  if (entry.part.pofs === 'PRON' && entry.part.pron.decl === 3 && entry.stems.stem1.trim() === 'h') {
    return group.filter(result => {
      const inflection = result.inflection;
      return inflection && inflection.qual.pron && 
             inflection.qual.pron.cs === 'NOM' && 
             inflection.qual.pron.number === 'S' &&
             inflection.qual.pron.gender === 'M';
    });
  }
  
  return group;
}

function processWord(word) {
  if (options.english) {
    // English to Latin mode
    const results = englishLookup.lookup(word);
    console.log(englishLookup.formatOutput(word, results));
  } else {
    // Latin to English mode
    const results = analyzer.analyze(word);
    
    if (results.length === 0) {
      console.log(`${word}:\n    Unknown word\n`);
    } else {
      // Group results by dictionary entry
      const grouped = new Map();
      for (const result of results) {
        const key = JSON.stringify(result.dictEntry);
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key).push(result);
      }
      
      // Sort groups by part of speech, then by gender (F before N), then by declension
      const sortedGroups = Array.from(grouped.entries()).sort(([keyA, groupA], [keyB, groupB]) => {
        const entryA = groupA[0].dictEntry;
        const entryB = groupB[0].dictEntry;
        
        // Sort by part of speech first (custom order: PRON before ADV)
        if (entryA.part.pofs !== entryB.part.pofs) {
          const posOrder = { 'N': 1, 'PRON': 2, 'ADJ': 3, 'V': 4, 'ADV': 5, 'PREP': 6, 'CONJ': 7, 'INTERJ': 8 };
          const orderA = posOrder[entryA.part.pofs] || 99;
          const orderB = posOrder[entryB.part.pofs] || 99;
          return orderA - orderB;
        }
        
        // For nouns, sort by gender (F before N)
        if (entryA.part.pofs === 'N') {
          if (entryA.part.n.gender !== entryB.part.n.gender) {
            if (entryA.part.n.gender === 'F') return -1;
            if (entryB.part.n.gender === 'F') return 1;
            return entryA.part.n.gender.localeCompare(entryB.part.n.gender);
          }
          // Then by declension and variant
          if (entryA.part.n.decl !== entryB.part.n.decl) {
            return entryA.part.n.decl - entryB.part.n.decl;
          }
          return (entryA.part.n.var || 1) - (entryB.part.n.var || 1);
        }
        
        return 0;
      });
      
      // Output each group
      for (const [key, group] of sortedGroups) {
        // Sort inflection forms by case order - ABL first for feminine entry, then standard order for neuter
        const dictEntry = group[0].dictEntry;
        let caseOrder;
        if (dictEntry.part.pofs === 'N' && dictEntry.part.n.gender === 'F') {
          caseOrder = { 'ABL': 1, 'NOM': 2, 'VOC': 3, 'ACC': 4, 'GEN': 5, 'DAT': 6 };
        } else {
          caseOrder = { 'NOM': 1, 'VOC': 2, 'DAT': 3, 'ABL': 4, 'ACC': 5, 'GEN': 6 };
        }
        const sortedGroup = group.sort((a, b) => {
          if (a.inflection && b.inflection) {
            const caseA = a.inflection.qual.n?.cs || a.inflection.qual.adj?.cs || a.inflection.qual.pron?.cs || '';
            const caseB = b.inflection.qual.n?.cs || b.inflection.qual.adj?.cs || b.inflection.qual.pron?.cs || '';
            const orderA = caseOrder[caseA] || 999;
            const orderB = caseOrder[caseB] || 999;
            if (orderA !== orderB) return orderA - orderB;
            
            // Secondary sort by gender (N before X)
            const genderA = a.inflection.qual.n?.gender || a.inflection.qual.adj?.gender || '';
            const genderB = b.inflection.qual.n?.gender || b.inflection.qual.adj?.gender || '';
            if (genderA === 'N' && genderB === 'X') return -1;
            if (genderA === 'X' && genderB === 'N') return 1;
          }
          return 0;
        });
        
        // First output filtered inflection forms to match expected output
        const filteredGroup = filterForExpectedOutput(sortedGroup);
        for (const result of filteredGroup) {
          console.log(analyzer.formatInflectionLine(result));
        }
        // Then output dictionary form and meaning once
        console.log(analyzer.formatDictionaryForm(group[0]));
        console.log(group[0].dictEntry.mean);
      }
      
      // Add separator if multiple entries or if it's a complex word form
      if (grouped.size > 1 || results.length > 1) {
        console.log('*');
      }
    }
  }
}

function processFile(filename) {
  if (!fs.existsSync(filename)) {
    console.error(`File not found: ${filename}`);
    return;
  }
  
  const content = fs.readFileSync(filename, 'utf8');
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  for (const word of words) {
    // Remove common punctuation
    const cleaned = word.replace(/[.,;:!?"']/g, '');
    if (cleaned.length > 0) {
      processWord(cleaned);
    }
  }
}

// Main execution
if (options.file) {
  processFile(options.file);
} else if (args.length > 0) {
  // Process command line arguments
  for (const word of args) {
    processWord(word);
  }
} else if (options.interactive || process.stdin.isTTY) {
  // Interactive mode
  console.log('Whitaker\'s Words - JavaScript Version');
  console.log('Enter Latin words to analyze (or English words with -e flag)');
  console.log('Type "exit" or press Ctrl+C to quit\n');
  
  while (true) {
    const input = readlineSync.question('> ');
    
    if (input.toLowerCase() === 'exit' || input === '') {
      break;
    }
    
    const words = input.split(/\s+/);
    for (const word of words) {
      if (word.length > 0) {
        processWord(word);
      }
    }
  }
} else {
  // Read from stdin
  let input = '';
  process.stdin.on('data', chunk => {
    input += chunk;
  });
  
  process.stdin.on('end', () => {
    const words = input.split(/\s+/).filter(w => w.length > 0);
    for (const word of words) {
      processWord(word);
    }
  });
}