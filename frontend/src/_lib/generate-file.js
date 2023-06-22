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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const x = margin;
  const y = margin;

  doc.text(data, x, y, { align: 'left', maxWidth: pageWidth - 2 * margin });

  doc.save(filename);
}
