# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Testing
```bash
npm test                    # Run all tests
node test/test.js          # Run tests directly
```

### Running the Application
```bash
# Basic usage with sample dictionary
node bin/words.js -I ../INFLECTS.LAT [words...]

# Full compatibility with original Whitaker's data
node bin/words.js -d ../DICTLINE.GEN -I ../INFLECTS.LAT [words...]

# Interactive mode
node bin/words.js -I ../INFLECTS.LAT

# English to Latin lookup
node bin/words.js -I ../INFLECTS.LAT -e [english_words...]

# Process file
node bin/words.js -I ../INFLECTS.LAT -f input.txt
```

### Data File Requirements
The INFLECTS.LAT file is required for all operations. DICTLINE.GEN provides the full dictionary; without it, a sample dictionary is used.

## Architecture

This is a JavaScript port of William Whitaker's WORDS Latin morphological analyzer. The system parses Latin words by matching stems against dictionary entries and applying inflection rules.

### Core Components

**`src/types.js`** - Defines all linguistic data structures (PartOfSpeech, Gender, Case, Number, etc.) and the fundamental types used throughout the system.

**`src/inflections.js`** - `InflectionDatabase` class that loads and parses INFLECTS.LAT file. Contains logic for matching word endings to grammatical forms and validating inflections against dictionary entries.

**`src/dictionary.js`** - `Dictionary` class that loads DICTLINE.GEN format files. Maintains stem and English word indexes. Includes `createSampleDictionary()` for testing without full data files.

**`src/analyzer.js`** - `WordAnalyzer` is the main engine that:
- Preprocesses words (removes macrons, normalizes case)
- Finds exact matches for indeclinable words
- Strips endings and matches stems against dictionary
- Applies "tricks" for prefixes and enclitics
- Validates inflections against dictionary paradigms
- Formats output for display

**`src/english-lookup.js`** - `EnglishLookup` for English-to-Latin dictionary searches.

### Data Flow

1. Word preprocessing (macron removal, case normalization)
2. Exact match check for indeclinable words (prepositions, conjunctions, etc.)
3. Inflection matching: try all possible endings from INFLECTS.LAT
4. For each stem candidate, look up dictionary entries
5. Validate inflection compatibility with dictionary entry paradigm
6. Apply prefix/enclitic tricks as fallback
7. Group and sort results by part of speech and morphological features

### Key Processing Logic

**Inflection Validation**: Critical function `validateInflection()` in analyzer.js checks that inflection patterns match dictionary entry declensions/conjugations. Handles universal variants (var=0) that apply to multiple paradigms.

**Output Filtering**: The CLI (`bin/words.js`) includes `filterForExpectedOutput()` to match traditional Whitaker's Words output format, particularly for complex cases like 4th declension "cornu".

**Grouping and Sorting**: Results are grouped by dictionary entry and sorted with feminine forms before neuter, maintaining linguistic conventions.

### Testing Strategy

Tests in `test/test.js` cover:
- Basic word analysis for major paradigms
- Morphological edge cases (4th declension, demonstratives)
- Macron handling and preprocessing
- English lookup functionality
- Output format validation

The test suite requires the full INFLECTS.LAT file and validates against both sample dictionary and full DICTLINE.GEN data.