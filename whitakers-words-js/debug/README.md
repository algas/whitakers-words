# Debug Scripts

This directory contains various debug and analysis scripts used during development and troubleshooting.

## Main Scripts

### `analyze-word.js`
General-purpose word analysis script. Analyzes any Latin word and shows detailed breakdown of the parsing process.

Usage:
```bash
node debug/analyze-word.js [word]
# or
npm run debug:analyze [word]
```

Example:
```bash
npm run debug:analyze populusque
```

### `investigate-duplicates.js`
Investigates duplicate dictionary entries and analyzes how they affect parsing results.

Usage:
```bash
node debug/investigate-duplicates.js [word]
# or
npm run debug:duplicates [word]
```

Example:
```bash
npm run debug:duplicates ab
```

### `test-inflections.js`
Tests inflection matching and validation for specific words, useful for debugging parsing issues.

Usage:
```bash
node debug/test-inflections.js [word]
# or
npm run debug:inflections [word]
```

Example:
```bash
npm run debug:inflections amatus
```

## Legacy Scripts

The following scripts are preserved for historical reference but are superseded by the main scripts above:

- `legacy-ab-inflections.js` - Original debug script for investigating "ab" inflection issues
- `legacy-ab-preposition.js` - Original debug script for investigating "ab" preposition duplicates  
- `legacy-simple-test.js` - Original simple test for VPAR analysis
- `legacy-final-test.js` - Original comprehensive test with real data
- `legacy-test-real-data.js` - Original real data validation test

## Development Notes

These scripts are designed to help understand and debug the Latin morphological analysis process. They use the full DICTLINE.GEN and INFLECTS.LAT files and provide detailed output about:

- Dictionary entry lookup
- Inflection matching
- Validation logic
- Duplicate detection
- Part-of-speech analysis
- Enclitic handling
- Roman numeral recognition

## Usage Tips

- All scripts require the DICTLINE.GEN and INFLECTS.LAT files to be present in the parent directory
- Scripts are designed to be run from the project root directory
- Output is verbose and intended for development/debugging purposes
- Use the npm scripts for convenience: `npm run debug:analyze [word]`

## Common Use Cases

### Debugging Word Analysis
```bash
npm run debug:analyze mysterium
```

### Investigating Duplicate Results
```bash
npm run debug:duplicates ab
```

### Testing Complex Inflections
```bash
npm run debug:inflections monuissemus
```

### Testing Enclitics
```bash
npm run debug:analyze populusque
```