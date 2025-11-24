import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import generateFile from '@/_lib/generate-file';
import JsPDF from 'jspdf';
// eslint-disable-next-line import/no-unresolved
import 'jspdf-autotable';
import moment from 'moment';

// Helper function to get table data
const getData = (table) => {
  // Get headers from all visible columns
  const headers = table
    .getAllColumns()
    .filter((column) => !column.columnDef.meta?.skipExport)
    .map((column) => column.columnDef.header);

  // Get data rows
  const data = table.getCoreRowModel().rows.map((row) => {
    const rowData = [];
    headers.forEach((header) => rowData.push(row.original[header]));
    return rowData;
  });

  const headersWithUpperCase = headers.map((header) => header.toUpperCase());

  return { headers: headersWithUpperCase, data };
};

// Export to CSV
export const exportToCSV = (table, componentName) => {
  const { headers, data } = getData(table);
  const fileName = getExportFileName(componentName);
  const csvString = Papa.unparse({ fields: headers, data });
  generateFile(fileName, csvString, 'csv');
};

// Export to Excel
export const exportToExcel = (table, componentName) => {
  const { headers, data } = getData(table);
  const ws = XLSX.utils.json_to_sheet(data);
  // Add headers to the first row
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const fileName = getExportFileName(componentName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// Export to PDF
export const exportToPDF = async (table, componentName) => {
  const { headers, data } = getData(table);
  const pdfData = data.map((obj) => Object.values(obj));
  const fileName = getExportFileName(componentName);
  const doc = new JsPDF();
  doc.autoTable({
    head: [headers],
    body: pdfData,
    styles: {
      minCellHeight: 9,
      minCellWidth: 20,
      fontSize: 11,
      color: 'black',
    },
    theme: 'grid',
  });
  doc.save(`${fileName}.pdf`);
  return;
};

const getExportFileName = (componentName) => {
  return `${componentName}_${moment().format('DD-MM-YYYY_HH-mm')}`;
};
