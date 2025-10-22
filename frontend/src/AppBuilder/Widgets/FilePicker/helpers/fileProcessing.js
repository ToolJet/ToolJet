import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import JSON5 from 'json5'; // Import JSON5 for more lenient parsing

// Define constants for processing file types
// (Consider moving these to a shared constants file if used elsewhere)
export const PARSE_FILE_TYPES = {
  CSV: 'text/csv',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  JSON: 'application/json', // Added JSON MIME type
};

// Helper functions for processing file content
export const processCSV = (str, delimiter = ',') => {
  try {
    const lines = str.split(/\r?\n/);
    const [headerLine, ...rows] = lines;
    if (!headerLine) return [];
    const headers = headerLine.split(delimiter).map((h) => h.trim());
    return rows
      .filter((r) => r.trim().length > 0)
      .map((row) => {
        const cols = row.split(delimiter);
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

export const processFileContent = async (fileType, fileContent) => {
  switch (fileType) {
    case PARSE_FILE_TYPES.CSV:
      return processCSV(fileContent.readFileAsText);
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

// Deprecated error handler removed; rely on explicit toasts where needed.

const DEPRECATED_processCSV = (str, delimiter = ',') => processCSV(str, delimiter);

export const DEPRECATED_processFileContent = async (fileType, fileContent) => {
  switch (fileType) {
    case 'text/csv':
      return DEPRECATED_processCSV(fileContent.readFileAsText);
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return await processXls(fileContent.readFileAsDataURL); // Use the actual processXls function
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
      const matchingType = Object.values(PARSE_FILE_TYPES).find(mimeType =>
        mimeType.includes(parseFileType) || parseFileType.includes(mimeType.split('/')[1])
      );
      targetMimeType = matchingType;
    }

    return targetMimeType ? file.type === targetMimeType : false;
  }
};
