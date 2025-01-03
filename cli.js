#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const converter = require('./index.js');

program
  .name('openapi2csv')
  .description('Convert OpenAPI specification to CSV format for RAG systems')
  .version('1.0.0')
  .option('-i, --input <path>', 'Input OpenAPI spec file', './spec.json')
  .option('-o, --output <path>', 'Output directory for CSV file', './output')
  .option('-f, --format <type>', 'Input format type (json/yaml)', 'json')
  .option('--output-format <type>', 'Output format type (default/csv-to-rag)', 'default')
  .option('-b, --batch-size <size>', 'Number of paths to process per batch', '100')
  .option('-d, --delimiter <char>', 'CSV delimiter character', ';')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      // Resolve absolute paths
      const inputPath = path.resolve(options.input);
      const outputPath = path.resolve(options.output);
      
      if (options.verbose) {
        console.log('Configuration:');
        console.log('- Input file:', inputPath);
        console.log('- Output directory:', outputPath);
        console.log('- Format:', options.format);
        console.log('- Output format:', options.outputFormat);
        console.log('- Batch size:', options.batchSize);
        console.log('- Delimiter:', options.delimiter);
      }

      // Start the conversion
      await converter.convertSpec({
        input: inputPath,
        output: outputPath,
        format: options.format,
        outputFormat: options.outputFormat,
        batchSize: parseInt(options.batchSize),
        delimiter: options.delimiter,
        verbose: options.verbose
      });

    } catch (error) {
      console.error('Error:', error.message);
      if (options.verbose && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
