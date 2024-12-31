const fs = require('fs-extra');
const yaml = require('js-yaml');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

// Maximum size for stringified objects (1MB)
const MAX_STRING_SIZE = 1024 * 1024;

function safeStringify(obj) {
  try {
    const str = JSON.stringify(obj);
    if (str.length > MAX_STRING_SIZE) {
      return JSON.stringify({
        note: 'Object too large, showing summary',
        type: Array.isArray(obj) ? 'array' : typeof obj,
        length: Array.isArray(obj) ? obj.length : Object.keys(obj).length
      });
    }
    return str;
  } catch (error) {
    return JSON.stringify({
      error: 'Could not stringify object',
      reason: error.message
    });
  }
}

function getRelevantSchemas(operation, allSchemas) {
  const relevantSchemas = {};
  
  // Helper function to extract schema references
  const extractRefs = (obj) => {
    const refs = new Set();
    JSON.stringify(obj, (key, value) => {
      if (key === '$ref' && typeof value === 'string') {
        const schemaName = value.split('/').pop();
        refs.add(schemaName);
      }
      return value;
    });
    return refs;
  };

  // Get schemas from parameters, requestBody, and responses
  if (operation.parameters) {
    extractRefs(operation.parameters).forEach(ref => {
      if (allSchemas[ref]) relevantSchemas[ref] = allSchemas[ref];
    });
  }

  if (operation.requestBody?.content) {
    extractRefs(operation.requestBody).forEach(ref => {
      if (allSchemas[ref]) relevantSchemas[ref] = allSchemas[ref];
    });
  }

  if (operation.responses) {
    extractRefs(operation.responses).forEach(ref => {
      if (allSchemas[ref]) relevantSchemas[ref] = allSchemas[ref];
    });
  }

  return relevantSchemas;
}

async function* pathGenerator(spec, batchSize) {
  const paths = Object.entries(spec.paths);
  let batch = [];

  for (const [path, pathItem] of paths) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
        batch.push({ path, method, operation });
        
        if (batch.length >= batchSize) {
          yield batch;
          batch = [];
        }
      }
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}

function flattenEndpoint(path, method, operation, spec, outputFormat) {
  // Get only relevant schemas for this endpoint
  const relevantSchemas = getRelevantSchemas(operation, spec.components?.schemas || {});

  if (outputFormat === 'csv-to-rag') {
    // Format metadata_small as JSON with method, summary, description, and parameters
    const metadata_small = {
      method: method.toUpperCase(),
      summary: operation.summary || '',
      description: operation.description || '',
      parameters: operation.parameters || []
    };

    // Format metadata_big_1 with request/response info
    const metadata_big_1 = {
      requestBody: operation.requestBody || {},
      responses: operation.responses || {},
      tags: operation.tags || [],
      security: operation.security || [],
      servers: spec.servers || []
    };

    // metadata_big_2 contains schemas
    const metadata_big_2 = relevantSchemas;

    // metadata_big_3 is left empty for future use
    const metadata_big_3 = {};

    return {
      code: path,
      metadata_small: safeStringify(metadata_small),
      metadata_big_1: safeStringify(metadata_big_1),
      metadata_big_2: safeStringify(metadata_big_2),
      metadata_big_3: safeStringify(metadata_big_3)
    };
  } else {
    return {
      endpoint: path,
      method: method.toUpperCase(),
      summary: operation.summary || '',
      description: operation.description || '',
      parameters: safeStringify(operation.parameters || []),
      requestBody: safeStringify(operation.requestBody || {}),
      responses: safeStringify(operation.responses || {}),
      tags: safeStringify(operation.tags || []),
      security: safeStringify(operation.security || []),
      servers: safeStringify(spec.servers || []),
      schemas: safeStringify(relevantSchemas)
    };
  }
}

async function processInBatches(spec, csvWriter, batchSize, verbose, outputFormat) {
  const generator = pathGenerator(spec, batchSize);
  let totalEndpoints = 0;
  
  for await (const batch of generator) {
    const records = batch.map(({ path, method, operation }) => 
      flattenEndpoint(path, method, operation, spec, outputFormat)
    );
    await csvWriter.writeRecords(records);
    totalEndpoints += records.length;
    if (verbose) {
      console.log(`Processed batch of ${records.length} endpoints (Total: ${totalEndpoints})`);
    }
  }
  return totalEndpoints;
}

async function convertSpec(options) {
  const { input, output, format, outputFormat = 'default', batchSize = 100, delimiter = ';', verbose = false } = options;

  try {
    // Increase heap size for the JSON parse operation
    const maxOldSpace = process.env.NODE_OPTIONS?.includes('--max-old-space-size') || 
      process.execArgv.some(arg => arg.includes('--max-old-space-size'));
    
    if (!maxOldSpace) {
      if (verbose) console.log('Increasing Node.js heap size...');
      const subprocess = require('child_process').spawn(process.argv[0], 
        ['--max-old-space-size=8192', ...process.argv.slice(1)], {
          stdio: 'inherit'
        });
      subprocess.on('exit', (code) => process.exit(code));
      return;
    }

    // Ensure output directory exists
    await fs.ensureDir(output);
    
    if (verbose) console.log('Reading OpenAPI spec file...');
    const content = await fs.readFile(input, 'utf8');
    
    if (verbose) console.log('Parsing spec file...');
    const spec = format === 'yaml' ? yaml.load(content) : JSON.parse(content);
    
    if (verbose) console.log('Setting up CSV writer...');
    const csvWriter = createObjectCsvWriter({
      path: path.join(output, 'api_spec.csv'),
      fieldDelimiter: delimiter,
      header: outputFormat === 'csv-to-rag' ? [
        { id: 'code', title: 'code' },
        { id: 'metadata_small', title: 'metadata_small' },
        { id: 'metadata_big_1', title: 'metadata_big_1' },
        { id: 'metadata_big_2', title: 'metadata_big_2' },
        { id: 'metadata_big_3', title: 'metadata_big_3' }
      ] : [
        { id: 'endpoint', title: 'ENDPOINT' },
        { id: 'method', title: 'METHOD' },
        { id: 'summary', title: 'SUMMARY' },
        { id: 'description', title: 'DESCRIPTION' },
        { id: 'parameters', title: 'PARAMETERS' },
        { id: 'requestBody', title: 'REQUEST_BODY' },
        { id: 'responses', title: 'RESPONSES' },
        { id: 'tags', title: 'TAGS' },
        { id: 'security', title: 'SECURITY' },
        { id: 'servers', title: 'SERVERS' },
        { id: 'schemas', title: 'SCHEMAS' }
      ]
    });

    if (verbose) console.log('Processing spec in batches...');
    const totalEndpoints = await processInBatches(spec, csvWriter, batchSize, verbose, outputFormat);
    
    if (verbose) {
      console.log(`Successfully converted OpenAPI spec to CSV: ${path.join(output, 'api_spec.csv')}`);
      console.log(`Total endpoints processed: ${totalEndpoints}`);
    }
    
    return {
      success: true,
      outputFile: path.join(output, 'api_spec.csv'),
      totalEndpoints
    };
  } catch (error) {
    throw error;
  }
}

// Remove the direct execution code and export the module
module.exports = {
  convertSpec
};
