# Whitaker's Words - JavaScript Implementation

A JavaScript implementation of William Whitaker's WORDS Latin-English dictionary and morphological analyzer.

## Features

- Latin word analysis with full morphological parsing
- English to Latin lookup
- Support for inflected forms (nouns, verbs, adjectives)
- Recognition of prefixes and enclitics
- Macron handling (automatically converts ā, ē, ī, ō, ū to a, e, i, o, u)
- Interactive and batch processing modes

## Installation

```bash
cd whitakers-words-js
npm install
```

## Usage

### Interactive Mode

```bash
node bin/words.js
```

### Analyze Latin Words

```bash
node bin/words.js amat puella bonum
```

### English to Latin Lookup

```bash
node bin/words.js -e love girl good
```

### Process File

```bash
node bin/words.js -f latin_text.txt
```

### Using Original Data Files

```bash
# Use original inflection data
node bin/words.js -I ../INFLECTS.LAT amat

# Use original dictionary
node bin/words.js -d ../DICTLINE.GEN amat

# Use both (full compatibility)
node bin/words.js -d ../DICTLINE.GEN -I ../INFLECTS.LAT amat
```

### Using Full Dictionary and Inflections

```bash
# Use full dictionary
node bin/words.js -d ../DICTLINE.GEN amat

# Use real inflection data from INFLECTS.LAT
node bin/words.js -I ../INFLECTS.LAT amat

# Use both full dictionary and inflections
node bin/words.js -d ../DICTLINE.GEN -I ../INFLECTS.LAT amat
```

## Examples

```
> node bin/words.js amat
Using sample dictionary (specify -d DICTLINE.GEN for full dictionary)

am.at                V      1 1 PRES ACTIVE IND 3 S      
amo, amare, amati, amatus  V (1st)   [XXXAX]
love, like; fall in love with; be fond of; have a tendency to

> node bin/words.js puella
Using sample dictionary (specify -d DICTLINE.GEN for full dictionary)

puell.a              N      1 1 NOM S F                 
puell.a              N      1 1 VOC S F                 
puell.a              N      1 1 ABL S F                 
puella, puellae  N (1st) F   [XXXBO]  
girl, (female) child/daughter; maiden; young woman/wife; sweetheart; slavegirl;

> node bin/words.js mōrēs
Using sample dictionary (specify -d DICTLINE.GEN for full dictionary)

mor.es               N      3 1 NOM P M                  
mor.es               N      3 1 VOC P M                  
mor.es               N      3 1 ACC P M                  
mor, moris  N (3rd) M   [XXXAO]
customs, character, behavior, manners; morals; mode/way of life; conduct;
```

## Running Tests

```bash
npm test
```

## Architecture

- `src/types.js` - Core data structures and enumerations
- `src/inflections.js` - Latin inflection rules database
- `src/dictionary.js` - Dictionary loading and indexing
- `src/analyzer.js` - Word analysis engine
- `src/english-lookup.js` - English to Latin search
- `bin/words.js` - CLI interface

## Data File Formats

The system is designed to work with Whitaker's original data files:

- `DICTLINE.GEN` - Main dictionary file
- `INFLECTS.LAT` - Inflection rules
- `ADDONS.LAT` - Additional word forms
- `UNIQUES.LAT` - Unique/irregular forms

## Limitations

This JavaScript implementation includes:
- Basic inflection system for common noun, verb, and adjective paradigms
- Sample dictionary for testing
- Core word analysis functionality

Not yet implemented:
- Full inflection database (all paradigms)
- Complete tricks and addons system
- Dictionary building tools (makedict, makestem, etc.)
- Validation tools (check, dups)

## License

This implementation follows the same open-source spirit as the original Whitaker's Words.