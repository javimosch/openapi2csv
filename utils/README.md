# Custom CSV Writer Utility

A flexible CSV writer that supports any delimiter for both header and data rows, making it a drop-in replacement for `csv-writer` with additional features.

## Features

- **Any delimiter support**: Use any character or string as delimiter (pipe `|`, tab `\t`, semicolon `;`, etc.)
- **Separate header delimiter**: Different delimiters for header row vs data rows
- **Proper escaping**: Handles fields containing delimiters, quotes, or newlines
- **Drop-in replacement**: Compatible with csv-writer API
- **No dependencies**: Uses only Node.js built-in modules and fs-extra
- **Memory efficient**: Uses file streaming instead of loading all data in memory

## Installation

Copy the `csv-writer.js` file to your project:

```bash
cp utils/csv-writer.js /path/to/your/project/utils/
```

## Usage

### Basic Usage

```javascript
const { createObjectCsvWriter } = require('./utils/csv-writer');

const csvWriter = createObjectCsvWriter({
  path: 'output.csv',
  header: [
    { id: 'name', title: 'NAME' },
    { id: 'age', title: 'AGE' }
  ]
});

const records = [
  { name: 'John Doe', age: 30 },
  { name: 'Jane Smith', age: 25 }
];

await csvWriter.writeRecords(records);
```

### Custom Delimiters

```javascript
// Use pipe delimiter for everything
const csvWriter = createObjectCsvWriter({
  path: 'output.csv',
  fieldDelimiter: '|',
  header: [
    { id: 'name', title: 'NAME' },
    { id: 'age', title: 'AGE' }
  ]
});

// Different delimiters for header vs data
const csvWriter = createObjectCsvWriter({
  path: 'output.csv',
  fieldDelimiter: '|',    // Data rows use pipe
  headerDelimiter: ',',   // Header row uses comma
  header: [
    { id: 'name', title: 'NAME' },
    { id: 'age', title: 'AGE' }
  ]
});
```

### Array Format

```javascript
const { createArrayCsvWriter } = require('./utils/csv-writer');

const csvWriter = createArrayCsvWriter({
  path: 'output.csv',
  header: ['NAME', 'AGE'],
  fieldDelimiter: '\t'  // Tab-separated
});

const records = [
  ['John Doe', 30],
  ['Jane Smith', 25]
];

await csvWriter.writeRecords(records);
```

## API Reference

### createObjectCsvWriter(options)

Creates a CSV writer for object-based records.

**Parameters:**
- `options.path` (string): Path to output CSV file
- `options.fieldDelimiter` (string, optional): Delimiter for data rows, default: ','
- `options.headerDelimiter` (string, optional): Delimiter for header row, default: fieldDelimiter
- `options.header` (Array): Array of objects with `id` and `title` properties

### createArrayCsvWriter(options)

Creates a CSV writer for array-based records.

**Parameters:**
- `options.path` (string): Path to output CSV file
- `options.fieldDelimiter` (string, optional): Delimiter for data rows, default: ','
- `options.headerDelimiter` (string, optional): Delimiter for header row, default: fieldDelimiter
- `options.header` (Array): Array of strings for column headers

### CustomCsvWriter Class

Direct access to the CSV writer class.

```javascript
const { CustomCsvWriter } = require('./utils/csv-writer');

const csvWriter = new CustomCsvWriter({
  path: 'output.csv',
  fieldDelimiter: '|',
  headerDelimiter: ',',
  header: [
    { id: 'name', title: 'NAME' },
    { id: 'age', title: 'AGE' }
  ]
});
```

## Examples

### Multi-character Delimiters

```javascript
const csvWriter = createObjectCsvWriter({
  path: 'output.csv',
  fieldDelimiter: '|||',
  headerDelimiter: '###',
  header: [
    { id: 'name', title: 'Full Name' },
    { id: 'email', title: 'Email Address' }
  ]
});
```

### Handling Special Characters

```javascript
const csvWriter = createObjectCsvWriter({
  path: 'output.csv',
  fieldDelimiter: '|',
  header: [
    { id: 'description', title: 'DESCRIPTION' }
  ]
});

// This will be properly escaped:
// DESCRIPTION
// "This field contains | pipe character"
await csvWriter.writeRecords([
  { description: 'This field contains | pipe character' }
]);
```

### Batch Processing

```javascript
const csvWriter = createObjectCsvWriter({
  path: 'large_output.csv',
  fieldDelimiter: '\t',
  header: [
    { id: 'id', title: 'ID' },
    { id: 'data', title: 'DATA' }
  ]
});

// Process in batches
for (let batch of batches) {
  await csvWriter.writeRecords(batch);
}
```

## Migration from csv-writer

This utility is designed as a drop-in replacement for csv-writer:

```javascript
// Before (csv-writer)
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// After (custom csv-writer)
const { createObjectCsvWriter } = require('./utils/csv-writer');

// Same API - no other changes needed
const csvWriter = createObjectCsvWriter({
  path: 'output.csv',
  header: [
    { id: 'name', title: 'NAME' }
  ]
});
```

## License

MIT - Feel free to use in any project.
