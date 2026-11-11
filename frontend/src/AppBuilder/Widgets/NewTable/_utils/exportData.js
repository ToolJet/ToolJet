import zipcelx from 'zipcelx';
import Papa from 'papaparse';
import generateFile from '@/_lib/generate-file';
import moment from 'moment';

// Helper function to get table data
const getData = (table, forExcel = false, filtered = false) => {
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

  // Get data rows — 'filtered' exports the filtered + sorted rows across all pages (in display order),
  // 'core' exports the full unfiltered dataset (default, preserves legacy behaviour)
  const rows = (filtered ? table.getPrePaginationRowModel() : table.getCoreRowModel()).rows;
  const data = rows.map((row) => {
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
export const exportToCSV = (table, componentName, { downloadFileName, filtered } = {}) => {
  const { headers, data } = getData(table, false, filtered);
  const fileName = getExportFileName(componentName, downloadFileName);
  const csvString = Papa.unparse({ fields: headers, data });
  generateFile(fileName, csvString, 'csv');
};

// Export to Excel
export const exportToExcel = (table, componentName, { downloadFileName, filtered } = {}) => {
  const { headers, data } = getData(table, true, filtered);
  const fileName = getExportFileName(componentName, downloadFileName);
  const config = {
    filename: fileName,
    sheet: {
      data: [headers, ...data],
    },
  };
  zipcelx(config);
};

// Export to PDF
export const exportToPDF = async (table, componentName, { downloadFileName, filtered } = {}) => {
  // Lazy load jspdf and jspdf-autotable to reduce initial bundle size (~600kb)
  // eslint-disable-next-line import/no-unresolved
  const [JsPDFNamespace, JSPDFAutoTableNamespace] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const { headers, data } = getData(table, false, filtered);
  const pdfData = data.map((obj) => Object.values(obj));
  const fileName = getExportFileName(componentName, downloadFileName);
  const JsPDF = JsPDFNamespace.jsPDF || JsPDFNamespace.default;
  const autoTable = JSPDFAutoTableNamespace.autoTable || JSPDFAutoTableNamespace.default;
  const doc = new JsPDF();
  autoTable(doc, {
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

export const getExportFileName = (componentName, downloadFileName) => {
  const name = (downloadFileName ?? '').trim();
  return name.length ? name : `${componentName}_${moment().format('DD-MM-YYYY_HH-mm')}`;
};
