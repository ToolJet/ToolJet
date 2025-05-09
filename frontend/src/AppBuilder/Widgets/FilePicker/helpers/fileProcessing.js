import * as XLSX from 'xlsx/xlsx.mjs';
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
    const wb = XLSX.read(str, { type: 'string', raw: true });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    return XLSX.utils.sheet_to_json(ws, { delimiter, defval: '' });
  } catch (error) {
    console.error('Error processing CSV:', error);
    toast.error('Failed to parse CSV file.');
    return null;
  }
};

export const processXls = (base64Str) => {
  try {
    const wb = XLSX.read(base64Str, { type: 'base64' });
    const result = {};
    // Iterate over all sheet names
    wb.SheetNames.forEach((sheetName) => {
      const ws = wb.Sheets[sheetName];
      // Convert sheet to JSON array
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' }); // Use defval for empty cells
      result[sheetName] = data; // Assign array to sheet name key
    });
    return result; // Return object with sheet names as keys
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

export const processFileContent = (fileType, fileContent) => {
  switch (fileType) {
    case PARSE_FILE_TYPES.CSV:
      return processCSV(fileContent.readFileAsText);
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
    return targetMimeType ? file.type === targetMimeType : false;
  }
}; 