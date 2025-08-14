const fs = require('fs-extra');

/**
 * Custom CSV writer that supports any delimiter for both header and data rows
 * This is a drop-in replacement for csv-writer with additional features
 */
class CustomCsvWriter {
  constructor(options) {
    this.path = options.path;
    this.delimiter = options.fieldDelimiter || ',';
    this.headerDelimiter = options.headerDelimiter || this.delimiter;
    this.header = options.header || [];
    this.initialized = false;
  }

  /**
   * Write records to CSV file
   * @param {Array} records Array of objects to write
   */
  async writeRecords(records) {
    if (!this.initialized) {
      // Write header if this is the first write
      if (this.header.length > 0) {
        const headerRow = this.header.map(col => 
          this.escapeField(col.title || col.id, this.headerDelimiter)
        ).join(this.headerDelimiter);
        await fs.writeFile(this.path, headerRow + '\n');
        this.initialized = true;
      } else {
        // Create empty file if no header
        await fs.writeFile(this.path, '');
        this.initialized = true;
      }
    }

    if (records.length === 0) return;

    const rows = records.map(record => {
      return this.header.map(col => {
        const value = record[col.id] || '';
        return this.escapeField(String(value), this.delimiter);
      }).join(this.delimiter);
    }).join('\n') + '\n';

    await fs.appendFile(this.path, rows);
  }

  /**
   * Escape field value for CSV format
   * @param {string} field Field value to escape
   * @param {string} delimiter The delimiter to check against
   * @returns {string} Escaped field value
   */
  escapeField(field, delimiter = null) {
    const effectiveDelimiter = delimiter || this.delimiter;
    if (field === null || field === undefined) return '';
    
    const str = String(field);
    
    // If field contains delimiter, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(effectiveDelimiter) || 
        str.includes('"') || 
        str.includes('\n') || 
        str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    
    return str;
  }

  /**
   * Close the writer (no-op for this implementation)
   */
  async close() {
    // No-op for this implementation since we use writeFile/appendFile
    return Promise.resolve();
  }

  /**
   * Create a CSV writer instance
   * @param {Object} options Configuration options
   * @param {string} options.path Path to output file
   * @param {string} options.fieldDelimiter Delimiter for data rows (default: ',')
   * @param {string} options.headerDelimiter Delimiter for header row (default: fieldDelimiter)
   * @param {Array} options.header Array of {id, title} objects for header
   * @returns {CustomCsvWriter} CSV writer instance
   */
  static createObjectCsvWriter(options) {
    return new CustomCsvWriter(options);
  }
}

/**
 * Convenience function to create a CSV writer
 * @param {Object} options Configuration options
 * @returns {CustomCsvWriter} CSV writer instance
 */
function createObjectCsvWriter(options) {
  return new CustomCsvWriter(options);
}

/**
 * Create a CSV writer for arrays (simple arrays instead of objects)
 * @param {Object} options Configuration options
 * @returns {CustomCsvWriter} CSV writer instance
 */
function createArrayCsvWriter(options) {
  // Convert array format to object format for compatibility
  const adaptedOptions = {
    ...options,
    header: options.header ? options.header.map((item, index) => ({ id: `col${index}`, title: item })) : []
  };
  return new CustomCsvWriter(adaptedOptions);
}

module.exports = {
  CustomCsvWriter,
  createObjectCsvWriter,
  createArrayCsvWriter
};
