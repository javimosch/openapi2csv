# OpenAPI Spec to CSV Converter

## Overview
A Node.js application that converts OpenAPI specification JSON files into a CSV file suitable for RAG (Retrieval-Augmented Generation) using LLMStudio.

## Features
- Read OpenAPI specification from JSON file (default: ./spec.json)
- Parse and extract relevant information from the spec
- Generate a single CSV file that contains all API information
- Handle complex objects through JSON stringification

## Technical Requirements
- Node.js v14 or higher
- npm packages:
  - fs-extra: File system operations
  - csv-writer: CSV file generation
  - yaml: YAML parsing support (for YAML OpenAPI specs)
  - commander: CLI argument parsing

## Input
- OpenAPI specification file (JSON format)
- Command line arguments for customization

## Output
Generated CSV file (api_spec.csv) with the following columns:
- endpoint: The API endpoint path
- method: HTTP method (GET, POST, etc.)
- summary: Brief description of the endpoint
- description: Detailed description of the endpoint
- parameters: JSON stringified object containing all parameters (query, path, body)
- requestBody: JSON stringified schema of request body
- responses: JSON stringified object containing possible responses
- tags: Array of endpoint tags
- security: JSON stringified security requirements
- servers: JSON stringified server configurations
- schemas: JSON stringified related schemas

## Usage
```bash
node index.js [options]

Options:
  -i, --input <path>    Input OpenAPI spec file (default: "./spec.json")
  -o, --output <path>   Output directory for CSV file (default: "./output")
  -f, --format <type>   Input format type (json/yaml) (default: "json")
```

## Implementation Details
1. CLI argument parsing using Commander.js
2. File reading and validation
3. OpenAPI spec parsing and validation
4. Data extraction and transformation
   - Flatten nested structures where possible
   - JSON.stringify complex objects
5. CSV file generation with proper headers
6. Error handling and logging
