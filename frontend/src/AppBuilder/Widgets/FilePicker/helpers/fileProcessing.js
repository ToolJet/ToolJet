// eslint-disable-next-line import/no-unresolved
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import JSON5 from 'json5'; // Import JSON5 for more lenient parsing
import Papa from 'papaparse';

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

// RFC 4180 compliant CSV parser using PapaParse
export const processCSV = (str, delimiter = ',') => {
  try {
    const result = Papa.parse(str, {
      header: true,
      delimiter: delimiter,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0) {
      console.error('CSV parse errors:', result.errors);
    }
    return result.data;
  } catch (error) {
    console.error('Error processing CSV:', error);
    toast.error('Failed to parse CSV file.');
    return null;
  }
};

export const processXls = async (base64Str) => {
  try {
    // Decode base64 to binary string
    const binary = atob(base64Str.split(',')[1] || base64Str);

    // Use XLSX library which supports both XLS and XLSX formats
    const workbook = XLSX.read(binary, { type: 'binary' });

    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!jsonData.length) return {};

    return { Sheet1: jsonData };
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

export const processFileContent = async (fileType, fileContent, options = {}) => {
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
      return await processXls(fileContent.readFileAsDataURL); // Await async function
    case PARSE_FILE_TYPES.JSON:
      return processJson(fileContent.readFileAsText); // Added JSON processing case
    default:
      console.warn(`Unsupported file type for parsing: ${fileType}`);
      return null;
  }
};

export const DEPRECATED_processFileContent = async (fileType, fileContent, options = {}) => {
  const { fileParsingDelimiter = ',', fileTypeFromExtension = 'auto-detect' } = options;

  switch (fileType) {
    case 'text/csv':
    case PARSE_FILE_TYPES.TXT:
      return processCSV(
        fileContent.readFileAsText,
        fileTypeFromExtension === 'auto-detect' ? ',' : fileParsingDelimiter
      );
    case PARSE_FILE_TYPES.TSV:
      return processCSV(fileContent.readFileAsText, '\t');
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return await processXls(fileContent.readFileAsDataURL);
    case 'application/json':
      return processJson(fileContent.readFileAsText);
    default:
      return null;
  }
};

export const detectParserFile = (file) => {
  return Object.values(PARSE_FILE_TYPES).includes(file.type);
};

export const parseFileContentEnabled = (file, autoDetect = false, parseFileType) => {
  if (autoDetect) {
    return detectParserFile(file);
  } else {
    let targetMimeType = PARSE_FILE_TYPES[parseFileType?.toUpperCase()];

    if (!targetMimeType && parseFileType) {
      const matchingType = Object.values(PARSE_FILE_TYPES).find(
        (mimeType) => mimeType.includes(parseFileType) || parseFileType.includes(mimeType.split('/')[1])
      );
      targetMimeType = matchingType;
    }

    return targetMimeType
      ? file.type === targetMimeType || (parseFileType === 'csv' && file.type === PARSE_FILE_TYPES.TXT)
      : false;
  }
};
