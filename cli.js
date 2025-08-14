#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const converter = require('./index.js');

program
  .name('openapi2csv')
  .description('Convert OpenAPI specifications to CSV format')
  .version('1.0.0')
  .option('-i, --input <file>', 'Input OpenAPI specification file (JSON or YAML)', './spec.json')
  .option('-o, --output <dir>', 'Output directory for CSV files', './output')
  .option('-f, --format <format>', 'Input format: json or yaml', 'json')
  .option('--output-format <format>', 'Output format: default or csv-to-rag', 'default')
  .option('-b, --batch-size <number>', 'Batch size for processing', '100')
  .option('-d, --delimiter <char>', 'CSV delimiter character', ';')
  .option('-dh, --delimiter-header <char>', 'CSV delimiter for header row (defaults to data delimiter)')
  .option('-c, --control', 'Pre-check for data delimiter conflicts and abort if found')
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
        console.log('- Header delimiter:', options.delimiterHeader || options.delimiter);
      }

      // Start the conversion
      const result = await converter.convertSpec({
        input: inputPath,
        output: outputPath,
        format: options.format,
        outputFormat: options.outputFormat,
        batchSize: parseInt(options.batchSize),
        delimiter: options.delimiter,
        delimiterHeader: options.delimiterHeader,
        control: options.control,
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
