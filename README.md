# openapi2csv

A Node.js utility that converts large OpenAPI specification files into CSV format, specifically designed for use with RAG (Retrieval-Augmented Generation) systems. The tool handles large specifications efficiently through batch processing and smart schema selection.

## Features

- Processes large OpenAPI specifications (tested with 30MB+ files)
- Memory-efficient batch processing
- Smart schema selection (only includes relevant schemas per endpoint)
- Handles both JSON and YAML OpenAPI specifications
- Configurable batch size for memory optimization
- Automatic Node.js heap size management
- Progress tracking and detailed logging

## Installation

### Global Installation (Recommended)
```bash
npm install -g openapi2csv
```

### Local Installation
1. Clone the repository:
```bash
git clone https://github.com/javimosch/openapi2csv.git
cd openapi2csv
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Using Global Command
```bash
openapi2csv -i ./spec.json
```

### Using Local Installation
```bash
npm start -- -i ./spec.json
```

All available options:
```bash
openapi2csv [options]

Options:
  -i, --input <file>         Input OpenAPI specification file (JSON or YAML)
  -o, --output <dir>         Output directory for CSV files (default: "./output")
  -f, --format <format>      Input format: json or yaml (default: "json")
  --output-format <format>   Output format: default or csv-to-rag (default: "default")
  -b, --batch-size <number>  Batch size for processing (default: 100)
  -d, --delimiter <char>     CSV delimiter character (default: ";")
  -dh, --delimiter-header <char>  CSV delimiter for header row (defaults to data delimiter)
  -c, --control              Pre-check for data delimiter conflicts and abort if found
  -v, --verbose              Enable verbose logging

### Output Format Options
- **default**: The standard format with the following columns:
  - ENDPOINT
  - METHOD
  - SUMMARY
  - DESCRIPTION
  - PARAMETERS
  - REQUEST_BODY
  - RESPONSES
  - TAGS
  - SECURITY
  - SERVERS
  - SCHEMAS

- **csv-to-rag**: Optimized format for RAG systems with the following columns:
  - code
  - metadata_small
  - metadata_big_1
  - metadata_big_2
  - metadata_big_3

### Custom Delimiters
The tool supports any delimiter character or string for CSV output:

```bash
# Use pipe delimiter
openapi2csv -i spec.json -d "|"

# Use tab delimiter
openapi2csv -i spec.json -d "\t"

# Use different delimiters for header vs data
openapi2csv -i spec.json -d "|" -dh ","

# Use multi-character delimiter
openapi2csv -i spec.json -d "###"
```

### Delimiter Conflict Detection
Use the `--control` option to pre-check for delimiter conflicts in your data:

```bash
# Check for conflicts before processing
openapi2csv -i spec.json -d "|" --control

# If conflicts are found, you'll see detailed information:
# DELIMITER CONFLICT DETECTED!
# Found 6 conflict(s) with delimiter "|":
# 1. Location: parameter description
#    Path: GET /api/path.parameters[0]
#    Value: "Use vehicle|driver|round"

# Use a safe delimiter instead
openapi2csv -i spec.json -d "###" --control
```

### Delimiter Option
- You can specify a custom delimiter using the `--delimiter` option. The default is `;`.

## Output Format

The tool generates a CSV file (`api_spec.csv`) with the following columns:

- `ENDPOINT`: The API endpoint path
- `METHOD`: HTTP method (GET, POST, etc.)
- `SUMMARY`: Brief description of the endpoint
- `DESCRIPTION`: Detailed description of the endpoint
- `PARAMETERS`: JSON stringified object containing all parameters
- `REQUEST_BODY`: JSON stringified schema of request body
- `RESPONSES`: JSON stringified object containing possible responses
- `TAGS`: Array of endpoint tags
- `SECURITY`: JSON stringified security requirements
- `SERVERS`: JSON stringified server configurations
- `SCHEMAS`: JSON stringified relevant schemas

For large objects (>1MB), the tool provides a summary instead of the full object:
```json
{
  "note": "Object too large, showing summary",
  "type": "object",
  "length": 42
}
```

## Memory Management

The tool automatically manages memory usage through:
- Batch processing of endpoints
- Limiting JSON string sizes to 1MB
- Automatic Node.js heap size increase (8GB)
- Smart schema selection

## Error Handling

The tool includes comprehensive error handling:
- Graceful handling of large objects
- Detailed error messages and stack traces
- Safe JSON stringification
- Progress tracking for debugging

## Requirements

- Node.js v14 or higher
- Sufficient system memory (recommended: 8GB+)

## Dependencies

- commander: CLI argument parsing
- fs-extra: Enhanced file system operations
- csv-writer: CSV file generation
- js-yaml: YAML parsing support

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
