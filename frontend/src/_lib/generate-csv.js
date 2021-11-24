function generateCsvDataLine(record, keys) {
  return keys.map((key) => record[key]).join(',');
}

export default function generateCSV(records) {
  if (records.length === 0) return '';

  const keys = Object.keys(records[0]);

  const csvHeaderLine = keys.join(',');
  const csvDataLines = records.map((record) => generateCsvDataLine(record, keys)).join('\n');

  return `${csvHeaderLine}\n${csvDataLines}`;
}
