import zipcelx from 'zipcelx';
import Papa from 'papaparse';
import generateFile from '@/_lib/generate-file';
import * as JsPDFNamespace from 'jspdf';
// eslint-disable-next-line import/no-unresolved
import 'jspdf-autotable';
import moment from 'moment';

// Helper function to get table data
const getData = (table) => {
  // Get headers from all visible columns
  const headers = [];
  const accessorKeys = [];
  table
    .getAllColumns()
    .filter((column) => !column.columnDef.meta?.skipExport)
    .forEach((column) => {
      headers.push(column.columnDef.header);
      accessorKeys.push(column.columnDef.accessorKey || column.columnDef.header);
    });

  // Get data rows
  const data = table.getCoreRowModel().rows.map((row) => {
    const rowData = [];
    accessorKeys.forEach((accessorKey) => rowData.push(row.original[accessorKey]));
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
  const fileName = getExportFileName(componentName);
  const config = {
    filename: fileName,
    sheet: {
      data: [headers, ...data],
    },
  };
  zipcelx(config);
};

// Export to PDF
export const exportToPDF = async (table, componentName) => {
  const { headers, data } = getData(table);
  const pdfData = data.map((obj) => Object.values(obj));
  const fileName = getExportFileName(componentName);
  const JsPDF = JsPDFNamespace.jsPDF || JsPDFNamespace;
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
