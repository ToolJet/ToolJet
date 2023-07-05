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

    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
      doc.text(value.toString(), x + indentLevel * 10, y, {
        align: 'left',
        maxWidth: pageWidth - 2 * margin - indentLevel * 10,
      });
      y += 10;
    } else if (Array.isArray(value)) {
      doc.text('[', x + indentLevel * 10, y, {
        align: 'left',
        maxWidth: pageWidth - 2 * margin - indentLevel * 10,
      });
      y += 10;
      value.forEach((item) => {
        processValue(item, indentLevel + 1);
      });
      doc.text(']', x + indentLevel * 10, y, {
        align: 'left',
        maxWidth: pageWidth - 2 * margin - indentLevel * 10,
      });
      y += 10;
    } else if (valueType === 'object' && value !== null) {
      doc.text('{', x + indentLevel * 10, y, {
        align: 'left',
        maxWidth: pageWidth - 2 * margin - indentLevel * 10,
      });
      y += 10;
      Object.keys(value).forEach((key) => {
        doc.text(`${key}:`, x + (indentLevel + 1) * 10, y, {
          align: 'left',
          maxWidth: pageWidth - 2 * margin - (indentLevel + 1) * 10,
        });
        y += 10;
        processValue(value[key], indentLevel + 1);
      });
      doc.text('}', x + indentLevel * 10, y, {
        align: 'left',
        maxWidth: pageWidth - 2 * margin - indentLevel * 10,
      });
      y += 10;
    } else {
      throw new Error('Invalid data type. Expected string, number, boolean, object, or array.');
    }
  };

  processValue(data);

  doc.save(filename);
}
