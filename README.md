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
  -i, --input <path>     Input OpenAPI spec file (default: "./spec.json")
  -o, --output <path>    Output directory for CSV file (default: "./output")
  -f, --format <type>    Input format type (json/yaml) (default: "json")
  --output-format <type>  Output format type (default/csv-to-rag) (default: "default")
  -d, --delimiter <char>  CSV delimiter character (default: ";")
  -b, --batch-size <size> Number of paths to process per batch (default: "100")
  -v, --verbose         Enable verbose logging

### Output Format Options
- **default**: The standard format with the following columns:
  `ENDPOINT;METHOD;SUMMARY;DESCRIPTION;PARAMETERS;REQUEST_BODY;RESPONSES;TAGS;SECURITY;SERVERS;SCHEMAS`
- **csv-to-rag**: An optimized format for RAG systems with the following columns:
  `code (unique ID), metadata_small, metadata_big_1, metadata_big_2, metadata_big_3`

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
