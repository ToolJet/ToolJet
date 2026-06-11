import Papa from 'papaparse';

export default function generateCSV(records) {
  return Papa.unparse(records);
}
