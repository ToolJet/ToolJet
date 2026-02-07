import zipcelx from 'zipcelx';
import Papa from 'papaparse';
import generateFile from '@/_lib/generate-file';
import * as JsPDFNamespace from 'jspdf';
// eslint-disable-next-line import/no-unresolved
import 'jspdf-autotable';
import moment from 'moment';

// Helper function to get table data
const getData = (table, forExcel = false) => {
  // Get headers from all visible columns
  const headers = [];
  const accessorKeys = [];
  table
    .getAllColumns()
    .filter((column) => !column.columnDef.meta?.skipExport)
    .forEach((column) => {
      headers.push(
        !forExcel // Get formatted headers for 'export to Excel' as expected by zipcelx's config
          ? column.columnDef.header
          : {
              value: column.columnDef.header,
              type: 'string',
            }
      );
      accessorKeys.push(column.columnDef.accessorKey || column.columnDef.header);
    });

  // Get data rows
  const data = table.getCoreRowModel().rows.map((row) => {
    const rowData = [];
    accessorKeys.forEach((accessorKey) => {
      const cellValue = row.original[accessorKey];
      const isNumber = typeof cellValue === 'number';

      rowData.push(
        !forExcel // Get formatted data for 'export to Excel' as expected by zipcelx's config
          ? cellValue
          : {
              value: cellValue,
              type: isNumber ? 'number' : 'string',
            }
      );
    });
    return rowData;
  });

  const headersWithUpperCase = headers.map((header) =>
    !forExcel ? header.toUpperCase() : { ...header, value: header.value.toUpperCase() }
  );

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
  const { headers, data } = getData(table, true);
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
