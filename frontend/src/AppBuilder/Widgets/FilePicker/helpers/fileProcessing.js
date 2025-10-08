import readXlsxFile from 'read-excel-file';
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

// Deprecated error handler removed; rely on explicit toasts where needed.

const DEPRECATED_processCSV = (str, delimiter = ',') => processCSV(str, delimiter);

const DEPRECATED_processXls = (_str) => ({ Sheet1: [] });

export const DEPRECATED_processFileContent = (fileType, fileContent) => {
  switch (fileType) {
    case 'text/csv':
      return DEPRECATED_processCSV(fileContent.readFileAsText);
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
    return targetMimeType ? file.type === targetMimeType : false;
  }
};
