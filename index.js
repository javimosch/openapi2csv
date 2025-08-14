const fs = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');
const { createObjectCsvWriter } = require('./utils/csv-writer');

// Maximum size for stringified objects (1MB)
const MAX_STRING_SIZE = 1024 * 1024;

/**
 * Check if any data contains the specified delimiter
 * @param {Object} spec OpenAPI spec object
 * @param {string} delimiter The delimiter to check for
 * @returns {Object} Result with found flag and details
 */
function checkDelimiterConflicts(spec, delimiter) {
  const conflicts = [];
  
  // Helper to check if a string contains the delimiter
  const containsDelimiter = (str) => str && str.includes(delimiter);
  
  // Helper to add conflict details
  const addConflict = (location, value, path) => {
    conflicts.push({
      location,
      value: value.substring(0, 200), // Truncate long values
      path
    });
  };
  
  // Check all paths and their operations
  if (spec.paths) {
    for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
      if (pathItem) {
        for (const [method, operation] of Object.entries(pathItem)) {
          if (typeof operation === 'object' && operation !== null) {
            // Check summary
            if (containsDelimiter(operation.summary || '')) {
              addConflict('summary', operation.summary, `${method.toUpperCase()} ${pathKey}`);
            }
            
            // Check description
            if (containsDelimiter(operation.description || '')) {
              addConflict('description', operation.description, `${method.toUpperCase()} ${pathKey}`);
            }
            
            // Check parameter names and descriptions
            if (operation.parameters) {
              operation.parameters.forEach((param, index) => {
                if (containsDelimiter(param.name || '')) {
                  addConflict('parameter name', param.name, `${method.toUpperCase()} ${pathKey}.parameters[${index}]`);
                }
                if (containsDelimiter(param.description || '')) {
                  addConflict('parameter description', param.description, `${method.toUpperCase()} ${pathKey}.parameters[${index}]`);
                }
              });
            }
            
            // Check request body descriptions
            if (operation.requestBody && operation.requestBody.description) {
              if (containsDelimiter(operation.requestBody.description)) {
                addConflict('requestBody description', operation.requestBody.description, `${method.toUpperCase()} ${pathKey}.requestBody`);
              }
            }
            
            // Check response descriptions
            if (operation.responses) {
              for (const [status, response] of Object.entries(operation.responses)) {
                if (response && response.description && containsDelimiter(response.description)) {
                  addConflict('response description', response.description, `${method.toUpperCase()} ${pathKey}.responses[${status}]`);
                }
              }
            }
            
            // Check tag names
            if (operation.tags) {
              operation.tags.forEach((tag, index) => {
                if (containsDelimiter(tag)) {
                  addConflict('tag', tag, `${method.toUpperCase()} ${pathKey}.tags[${index}]`);
                }
              });
            }
          }
        }
      }
    }
  }
  
  // Check schema definitions
  if (spec.components && spec.components.schemas) {
    for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
      if (schema && schema.description && containsDelimiter(schema.description)) {
        addConflict('schema description', schema.description, `components.schemas.${schemaName}`);
      }
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    totalConflicts: conflicts.length
  };
}

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
  const { input, output, format, outputFormat = 'default', batchSize = 100, delimiter = ';', delimiterHeader, control = false, verbose = false } = options;
  let csvWriter = null;

  try {
    // Ensure output directory exists
    await fs.ensureDir(output);
    
    // Increase heap size for the JSON parse operation
    const maxOldSpace = process.env.NODE_OPTIONS?.includes('--max-old-space-size') || 
      process.execArgv.some(arg => arg.includes('--max-old-space-size'));
    
    if (!maxOldSpace) {
      process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --max-old-space-size=4096';
    }
    
    if (verbose) console.log('Reading OpenAPI spec file...');
    const content = await fs.readFile(input, 'utf8');
    
    if (verbose) console.log('Parsing spec file...');
    const spec = format === 'yaml' ? yaml.load(content) : JSON.parse(content);
    
    // Check for delimiter conflicts if control mode is enabled
    if (control) {
      if (verbose) console.log('Checking for delimiter conflicts...');
      const conflictCheck = checkDelimiterConflicts(spec, delimiter);
      
      if (conflictCheck.hasConflicts) {
        console.error('\n❌ DELIMITER CONFLICT DETECTED!');
        console.error(`Found ${conflictCheck.totalConflicts} conflict(s) with delimiter "${delimiter}":\n`);
        
        // Show first few conflicts
        const maxConflictsToShow = 5;
        conflictCheck.conflicts.slice(0, maxConflictsToShow).forEach((conflict, index) => {
          console.error(`${index + 1}. Location: ${conflict.location}`);
          console.error(`   Path: ${conflict.path}`);
          console.error(`   Value: "${conflict.value}"\n`);
        });
        
        if (conflictCheck.totalConflicts > maxConflictsToShow) {
          console.error(`... and ${conflictCheck.totalConflicts - maxConflictsToShow} more conflicts.`);
        }
        
        console.error(`\n💡 Suggestions:`);
        console.error(`   - Use a different delimiter with -d "<new-delimiter>"`);
        console.error(`   - Disable this check with --no-control`);
        console.error(`   - Review the conflicting data and update your spec file\n`);
        
        return { success: false, error: 'Delimiter conflicts detected', conflicts: conflictCheck.conflicts };
      }
      
      if (verbose) console.log('✅ No delimiter conflicts found');
    }
    
    if (verbose) console.log('Setting up CSV writer...');
    csvWriter = createObjectCsvWriter({
      path: path.join(output, 'api_spec.csv'),
      fieldDelimiter: delimiter,
      headerDelimiter: delimiterHeader || delimiter,
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
    
    // Close the CSV writer
    if (csvWriter.close) {
      await csvWriter.close();
    }
    
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
    // Ensure CSV writer is closed on error
    if (csvWriter && csvWriter.close) {
      await csvWriter.close().catch(() => {});
    }
    throw error;
  }
}

// Remove the direct execution code and export the module
module.exports = {
  convertSpec
};
