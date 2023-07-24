import jsPDF from 'jspdf';

export default function generateFile(filename, data, fileType) {
  if (fileType === 'pdf') {
    generatePDF(filename, data);
    return;
  }

  const type = fileType === 'csv' ? 'text/csv' : 'text/plain';
  const blob = new Blob([data], { type });

  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
    window.URL.revokeObjectURL(elem.href);
  }
}
function generatePDF(filename, data) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const x = margin;
  let y = margin;

  const processValue = (value, indentLevel = 0) => {
    const valueType = typeof value;

    if (valueType === 'string') {
      doc.text(value, x, y, {
        align: 'left',
        maxWidth: pageWidth - 2 * margin,
      });
      y += 10;
    } else if (Array.isArray(value)) {
      const columnNames = Object.keys(value[0]);

      // Print table headers
      doc.autoTable({
        startY: y,
        head: [columnNames],
        body: value.map((item) => Object.values(item)),
      });

      y = doc.autoTable.previous.finalY + 10;
    } else if (valueType === 'object' && value !== null) {
      const columnNames = Object.keys(value);

      // Print table headers
      doc.autoTable({
        startY: y,
        head: [columnNames],
        body: [Object.values(value)],
      });

      y = doc.autoTable.previous.finalY + 10;
    } else {
      throw new Error('Invalid data type. Expected string, object, or array.');
    }
  };

  processValue(data);

  doc.save(filename);
}
