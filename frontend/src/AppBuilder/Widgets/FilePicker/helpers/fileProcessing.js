import readXlsxFile from 'read-excel-file';
import { toast } from 'react-hot-toast';
import JSON5 from 'json5'; // Import JSON5 for more lenient parsing

// Define constants for processing file types
// (Consider moving these to a shared constants file if used elsewhere)
export const PARSE_FILE_TYPES = {
  CSV: 'text/csv',
  TSV: 'text/tab-separated-values',
  TXT: 'text/plain',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  JSON: 'application/json', // Added JSON MIME type
};

const lineParser = (line, delimiter) => {
  let lineToFormat = line;

  // if delimiter is tab & if line contains '\\t' instead '\t' then just replace it with '\t'
  if (delimiter === '\t' && line.includes('\\t')) {
    lineToFormat = line.replaceAll('\\t', '\t');
  }

  return lineToFormat.split(delimiter).map((h) => h.trim());
};

// Helper functions for processing file content
export const processCSV = (str, delimiter = ',') => {
  try {
    const lines = str.split(/\r?\n/);
    const [headerLine, ...rows] = lines;
    if (!headerLine) return [];
    const headers = lineParser(headerLine, delimiter);
    return rows
      .filter((r) => r.trim().length > 0)
      .map((row) => {
        const cols = lineParser(row, delimiter);
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = cols[i] ?? '';
        });
        return obj;
      });
  } catch (error) {
    console.error('Error processing CSV:', error);
    toast.error('Failed to parse CSV file.');
    return null;
  }
};

export const processXls = async (base64Str) => {
  try {
    const binary = atob(base64Str.split(',')[1] || base64Str);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const file = new File([bytes], 'upload.xlsx');
    const rows = await readXlsxFile(file, { includeEmptyRows: false });
    if (!rows.length) return {};
    const [headers, ...dataRows] = rows;
    const data = dataRows.map((r) => Object.fromEntries(headers.map((h, i) => [String(h), r[i] ?? ''])));
    return { Sheet1: data };
  } catch (error) {
    console.error('Error processing XLS/XLSX:', error);
    toast.error('Failed to parse Excel file.');
    return null;
  }
};

// Added function to parse JSON content
export const processJson = (str) => {
  try {
    // Use JSON5 for more flexibility (comments, trailing commas, etc.)
    return JSON5.parse(str);
  } catch (error) {
    console.error('Error processing JSON:', error);
    toast.error(`Failed to parse JSON file: ${error.message}`);
    return null;
  }
};

export const processFileContent = (fileType, fileContent, options = {}) => {
  const { fileParsingDelimiter = ',', fileTypeFromExtension = 'auto-detect' } = options;

  switch (fileType) {
    case PARSE_FILE_TYPES.CSV:
    case PARSE_FILE_TYPES.TXT:
      return processCSV(
        fileContent.readFileAsText,
        fileTypeFromExtension === 'auto-detect' ? ',' : fileParsingDelimiter
      );
    case PARSE_FILE_TYPES.TSV:
      return processCSV(fileContent.readFileAsText, '\t');
    case PARSE_FILE_TYPES.XLS:
    case PARSE_FILE_TYPES.XLSX:
      return processXls(fileContent.readFileAsDataURL); // Assuming this contains base64
    case PARSE_FILE_TYPES.JSON:
      return processJson(fileContent.readFileAsText); // Added JSON processing case
    default:
      console.warn(`Unsupported file type for parsing: ${fileType}`);
      return null;
  }
};

// Deprecated error handler removed; rely on explicit toasts where needed.

const DEPRECATED_processCSV = (str, delimiter = ',') => processCSV(str, delimiter);

const DEPRECATED_processXls = (_str) => ({ Sheet1: [] });

export const DEPRECATED_processFileContent = (fileType, fileContent, options = {}) => {
  const { fileParsingDelimiter = ',', fileTypeFromExtension = 'auto-detect' } = options;

  switch (fileType) {
    case 'text/csv':
    case PARSE_FILE_TYPES.TXT:
      return DEPRECATED_processCSV(
        fileContent.readFileAsText,
        fileTypeFromExtension === 'auto-detect' ? ',' : fileParsingDelimiter
      );
    case PARSE_FILE_TYPES.TSV:
      return DEPRECATED_processCSV(fileContent.readFileAsText, '\t');
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return DEPRECATED_processXls(fileContent.readFileAsDataURL);

    default:
      break;
  }
};

export const detectParserFile = (file) => {
  return Object.values(PARSE_FILE_TYPES).includes(file.type);
};

export const parseFileContentEnabled = (file, autoDetect = false, parseFileType) => {
  // const fileExtensionType = file.type.split('/')[1]; // Simplified extraction - not strictly needed here

  if (autoDetect) {
    return detectParserFile(file);
  } else {
    // Map friendly name (like 'csv') to mime type if necessary
    // Assumes parseFileType is like 'CSV', 'XLS', etc.
    const targetMimeType = PARSE_FILE_TYPES[parseFileType?.toUpperCase()];
    return targetMimeType
      ? file.type === targetMimeType || (parseFileType === 'csv' && file.type === PARSE_FILE_TYPES.TXT)
      : false;
  }
};
