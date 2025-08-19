import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import generateFile from '@/_lib/generate-file';
import JsPDF from 'jspdf';
// eslint-disable-next-line import/no-unresolved
import 'jspdf-autotable';
import moment from 'moment';
import get from 'lodash/get';
import { containsArabic, dataContainsArabic } from './fontUtils';

// Helper function to get table data
const getData = (table) => {
  const headers = [];
  const accessorKeys = [];
  table
    .getAllColumns()
    .filter((column) => !column.columnDef.meta?.skipExport)
    .forEach((column) => {
      headers.push(column.columnDef.header);
      accessorKeys.push(column.columnDef.accessorKey || column.columnDef.header);
    });

  const data = table.getCoreRowModel().rows.map((row) => {
    const rowData = [];
    accessorKeys.forEach((accessorKey) => {
      let value = get(row.original, accessorKey);
      if (value === null || value === undefined) {
        value = '';
      } else if (value instanceof Date) {
        value = moment(value).format('YYYY-MM-DD HH:mm:ss');
      } else if (typeof value === 'object') {
        try {
          value = JSON.stringify(value);
        } catch (_) {
          value = String(value);
        }
      } else {
        value = String(value);
      }
      rowData.push(value);
    });
    return rowData;
  });

  const headersWithUpperCase = headers.map((header) => String(header).toUpperCase());

  return { headers: headersWithUpperCase, data };
};

export const exportToCSV = (table, componentName) => {
  const { headers, data } = getData(table);
  const fileName = getExportFileName(componentName);
  const csvString = Papa.unparse({ fields: headers, data });
  generateFile(fileName, csvString, 'csv');
};

export const exportToExcel = (table, componentName) => {
  const { headers, data } = getData(table);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const fileName = getExportFileName(componentName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const loadCustomFont = async (doc) => {
  try {
    const response = await fetch('https://fonts.gstatic.com/s/amiri/v23/J7aRnpd8CGxBHqUpvrIw74j0.woff2');
    if (!response.ok) {
      throw new Error('Could not load font from CDN');
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const binaryString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    const base64Font = btoa(binaryString);

    doc.addFileToVFS('CustomFont.ttf', base64Font);
    doc.addFont('CustomFont.ttf', 'CustomFont', 'normal');

    return true;
  } catch (error) {
    console.warn('Could not load custom font from CDN, trying local font:', error.message);

    try {
      const response = await fetch('/assets/fonts/Amiri-Regular.ttf');
      if (!response.ok) {
        throw new Error('Local font not found');
      }

      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
      const base64Font = btoa(binaryString);

      doc.addFileToVFS('CustomFont.ttf', base64Font);
      doc.addFont('CustomFont.ttf', 'CustomFont', 'normal');

      return true;
    } catch (localError) {
      console.warn('Could not load local font either:', localError.message);
      return false;
    }
  }
};

export const exportToPDF = async (table, componentName) => {
  const { headers, data } = getData(table);
  const fileName = getExportFileName(componentName);

  try {
    const doc = new JsPDF();

    const hasSpecialChars = dataContainsArabic(headers, data);
    let fontLoaded = false;

    if (hasSpecialChars) {
      fontLoaded = await loadCustomFont(doc);
    }

    const formattedData = data.map((row) => {
      if (Array.isArray(row)) {
        return row.map((cell) => {
          let cellValue = cell;
          if (cellValue && typeof cellValue === 'object') {
            if (cellValue.hasOwnProperty('value')) {
              cellValue = cellValue.value;
            } else if (cellValue.hasOwnProperty('props')) {
              cellValue = cellValue.props?.children || '';
            } else {
              cellValue = JSON.stringify(cellValue);
            }
          }
          return String(cellValue || '');
        });
      } else {
        return Object.values(row).map((cell) => {
          let cellValue = cell;
          if (cellValue && typeof cellValue === 'object') {
            if (cellValue.hasOwnProperty('value')) {
              cellValue = cellValue.value;
            } else if (cellValue.hasOwnProperty('props')) {
              cellValue = cellValue.props?.children || '';
            } else {
              cellValue = JSON.stringify(cellValue);
            }
          }
          return String(cellValue || '');
        });
      }
    });

    const styles = {
      minCellHeight: 12,
      minCellWidth: 20,
      fontSize: 10,
      textColor: 'black',
      overflow: 'linebreak',
      cellWidth: 'wrap',
    };

    if (fontLoaded) {
      styles.font = 'CustomFont';
      styles.fontStyle = 'normal';
    }

    doc.autoTable({
      head: [headers.map((h) => String(h))],
      body: formattedData,
      styles: styles,
      theme: 'grid',
      startY: 20,
      margin: { top: 20 },
      columnStyles: {
        ...headers.reduce((acc, _, index) => {
          acc[index] = {
            cellWidth: 'auto',
            overflow: 'linebreak',
            ...(fontLoaded && { font: 'CustomFont', fontStyle: 'normal' }),
          };
          return acc;
        }, {}),
      },
      didDrawCell: fontLoaded
        ? (data) => {
            if (data.cell.text && Array.isArray(data.cell.text)) {
              const hasSpecialCharsInCell = data.cell.text.some((text) => containsArabic(String(text)));
              if (hasSpecialCharsInCell) {
                try {
                  doc.setFont('CustomFont', 'normal');
                } catch (error) {
                  console.warn('Failed to set custom font in cell:', error.message);
                }
              }
            }
          }
        : undefined,
    });

    doc.save(`${fileName}.pdf`);
    return;
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error(`PDF export failed: ${error.message}`);
  }
};

const getExportFileName = (componentName) => {
  return `${componentName}_${moment().format('DD-MM-YYYY_HH-mm')}`;
};
