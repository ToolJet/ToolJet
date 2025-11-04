import got from 'got';

type SpreadsheetResponseBody = {
  spreadsheetId?: string;
  sheets?: Array<any>;
};

async function makeRequestToReadValues(spreadSheetId: string, sheet: string, range: string, authHeader: any,majorDimension?: string,valueRenderOption?: string,dateTimeRenderOption?: string ){
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${sheet || ''}!${range}`;

  const params = new URLSearchParams();
  if (majorDimension) params.append('majorDimension', majorDimension);
  if (valueRenderOption) params.append('valueRenderOption', valueRenderOption);
  if (dateTimeRenderOption) params.append('dateTimeRenderOption', dateTimeRenderOption);

  if (params.toString()) url += `?${params.toString()}`;

  return await got.get(url, { headers: authHeader }).json();
}

async function makeRequestToAppendValues(spreadSheetId: string, sheet: string, requestBody: any, authHeader: any) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${
    sheet || ''
  }!A:Z:append?valueInputOption=USER_ENTERED`;

  return await got.post(url, { headers: authHeader, json: requestBody }).json();
}

async function makeRequestToDeleteRows(spreadSheetId: string, requestBody: any, authHeader: any) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}:batchUpdate`;

  return await got.post(url, { headers: authHeader, json: requestBody }).json();
}

//*BatchUpdate Cell values
async function makeRequestToBatchUpdateValues(spreadSheetId: string, requestBody: any, authHeader: any) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values:batchUpdate`;

  return await got.post(url, { headers: authHeader, json: requestBody }).json();
}

async function makeRequestToLookUpCellValues(spreadSheetId: string, range: string, authHeader: any) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${range}?majorDimension=COLUMNS`;

  return await got.get(url, { headers: authHeader }).json();
}

async function makeRequestToCreateSpreadsheet(requestBody: any, authHeader: any): Promise<SpreadsheetResponseBody> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets`;

  return await got.post(url, { headers: authHeader, json: requestBody }).json();
}

async function makeRequestToListAllSheets(spreadsheet_id: string, authHeader: any): Promise<SpreadsheetResponseBody> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}`;

  return await got.get(url, { headers: authHeader }).json();
}

export async function listAllSheets(spreadsheet_id: string, authHeader: any): Promise<SpreadsheetResponseBody> {
  try {
    const response = await makeRequestToListAllSheets(spreadsheet_id, authHeader);
    return { sheets: response.sheets };
  } catch (error) {
    throw new Error(`Error fetching all sheets: ${error.response?.statusCode || ''} ${error.message}`);
  }
}

export async function createSpreadSheet(title: string, authHeader: any) {
  if (!title) {
    throw new Error('Spreadsheet title is required');
  }
  const requestBody = {
    properties: {
      title: title,
    },
  };

  try {
    const response = await makeRequestToCreateSpreadsheet(requestBody, authHeader);
    return { spreadsheetId: response.spreadsheetId };
  } catch (error) {
    throw new Error(`Error creating spreadsheet: ${error.response?.statusCode || ''} ${error.message}`);
  }
}

export async function batchUpdateToSheet(
  spreadSheetId: string,
  spreadsheetRange = 'A1:Z500',
  sheet = '',
  requestBody: any,
  filterData: any,
  filterOperator: string,
  authHeader: any
) {
  if (!spreadSheetId) {
    throw new Error('SpreadSheetId is required');
  }
  if (!filterOperator) {
    throw new Error('filterOperator is required');
  }

  const lookUpData = await lookUpSheetData(spreadSheetId, spreadsheetRange, sheet, authHeader);

  const body = await makeRequestBodyToBatchUpdate(requestBody, filterData, filterOperator, lookUpData);

  const _data = body.map((data) => {
    return {
      majorDimension: 'ROWS',
      range: `${sheet}!${data.cellIndex}`,
      values: [[data.cellValue]],
    };
  });

  const reqBody = {
    data: _data,
    valueInputOption: 'USER_ENTERED',
    includeValuesInResponse: true,
  };

  if (!reqBody.data) return new Error('No data to update');
  const response = await makeRequestToBatchUpdateValues(spreadSheetId, reqBody, authHeader);

  return response;
}

export async function readDataFromSheet(spreadSheetId: string, sheet: string, range: string, authHeader: any,majorDimension?:any,valueRenderOption?:any,dateTimeRenderOption?:any) {
  const data = await makeRequestToReadValues(spreadSheetId, sheet, range, authHeader,majorDimension,valueRenderOption,dateTimeRenderOption);

  let headers = [];
  let values = [];
  const result = [];
  const dataValues = data['values'];

  if (dataValues) {
    headers = dataValues[0];
    values = dataValues.length > 1 ? dataValues.slice(1, dataValues.length) : [];

    for (const value of values) {
      const row = {};
      for (const [index, header] of headers.entries()) {
        row[header] = value[index];
      }
      result.push(row);
    }
  }

  return result;
}


async function appendDataToSheet(spreadSheetId: string, sheet: string, rows: any, authHeader: any) {
  const parsedRows = JSON.parse(rows);
  const sheetData = await makeRequestToReadValues(spreadSheetId, sheet, 'A1:Z1', authHeader);
  const fullSheetHeaders = sheetData['values'][0];
  const rowsToAppend = parsedRows.map((row) => {
    const headersForAppendingRow = Object.keys(row);
    const rowData = [];

    headersForAppendingRow.forEach((appendDataHeader) => {
      const indexToInsert = fullSheetHeaders.indexOf(appendDataHeader);
      if (indexToInsert >= 0) {
        rowData[indexToInsert] = row[appendDataHeader];
      }
    });

    return rowData;
  });

  const requestBody = { values: rowsToAppend };
  const response = await makeRequestToAppendValues(spreadSheetId, sheet, requestBody, authHeader);

  return response;
}

async function getSheetId(spreadSheetId: string, sheetName: string, authHeader: any): Promise<number> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}`;
  const response = (await got.get(url, { headers: authHeader }).json()) as SpreadsheetResponseBody;

  const sheet = sheetName ? response.sheets.find((s) => s.properties.title === sheetName) : response.sheets[0];

  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found.`);
  }
  return sheet.properties.sheetId;
}

async function deleteDataFromSheet(spreadSheetId: string, sheet: string, rowIndex: any, authHeader: any) {
  const sheetId = await getSheetId(spreadSheetId, sheet, authHeader);
  const requestBody = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      },
    ],
  };

  const response = await makeRequestToDeleteRows(spreadSheetId, requestBody, authHeader);

  return response;
}

export async function readData(
  spreadSheetId: string,
  spreadsheetRange: string,
  sheet: string,
  authHeader: any,
  majorDimension?:any,
  valueRenderOption?:any,
  dateTimeRenderOption?:any
): Promise<any[]> {
  return await readDataFromSheet(spreadSheetId, sheet, spreadsheetRange, authHeader,majorDimension,valueRenderOption,dateTimeRenderOption);
}

export async function appendData(spreadSheetId: string, sheet: string, rows: any[], authHeader: any): Promise<any> {
  return await appendDataToSheet(spreadSheetId, sheet, rows, authHeader);
}

export async function deleteData(
  spreadSheetId: string,
  sheet: string,
  rowIndex: string,
  authHeader: any
): Promise<any> {
  return await deleteDataFromSheet(spreadSheetId, sheet, rowIndex, authHeader);
}

async function lookUpSheetData(spreadSheetId: string, spreadsheetRange: string, sheet: string, authHeader: any) {
  const range = `${sheet}!${spreadsheetRange}`;
  const responseLookUpCellValues = await makeRequestToLookUpCellValues(spreadSheetId, range, authHeader);
  const data = await responseLookUpCellValues['values'];

  return data;
}

//* utils
const getInputKeys = (inputBody, data) => {
  const parsedInput = typeof inputBody === 'string' ? JSON.parse(inputBody) : inputBody;
  const keys = Object.keys(parsedInput);
  const arr = [];
  keys.forEach((key) =>
    data.forEach((val, index) => {
      if (val[0] === key) {
        let keyIndex = '';
        if (index >= 26) {
          keyIndex = numberToLetters(index);
        } else {
          keyIndex = `${String.fromCharCode(65 + index)}`;
        }
        arr.push({ col: val[0], colIndex: keyIndex });
      }
    })
  );
  return arr;
};

const getRowsIndex = (inputFilter, filterOperator, response) => {
  const filterWithOperator = (type, array, value) => {
    switch (type) {
      case '===':
        return array === value;
      default:
        return false;
    }
  };
  const columnValues = response.filter((column) => column[0] === inputFilter.key).flat();

  if (columnValues.length === 0) {
    return -1;
  }

  const rowIndex = [];

  columnValues.forEach((col, index) => {
    const inputValue = typeof inputFilter.value !== 'string' ? JSON.stringify(inputFilter.value) : inputFilter.value;
    const isEqual = filterWithOperator(filterOperator, col, inputValue);
    if (isEqual) {
      rowIndex.push(index + 1);
    }
  });
  if (rowIndex.length === 0) {
    return -1;
  }

  return rowIndex;
};

function numberToLetters(num) {
  let letters = '';
  while (num >= 0) {
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters;
    num = Math.floor(num / 26) - 1;
  }
  return letters;
}

export const makeRequestBodyToBatchUpdate = (requestBody, filterCondition, filterOperator, data) => {
  const rowsIndexes = getRowsIndex(filterCondition, filterOperator, data) as any[];
  const colIndexes = getInputKeys(requestBody, data);

  const updateCellIndexes = [];
  colIndexes.map((col) => {
    rowsIndexes.map((rowIndex) =>
      updateCellIndexes.push({
        ...col,
        cellIndex: `${col.colIndex}${rowIndex}`,
      })
    );
  });

  const body = [];
  const parsedbody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
  Object.entries(parsedbody).forEach(([key, value]) => {
    updateCellIndexes.map((cell) => {
      if (key === cell.col) {
        body.push({ cellValue: value, cellIndex: cell.cellIndex });
      }
    });
  });
  return body;
};


// delete by filter data ------->new
export async function deleteFromSpreadsheetByFilter(
  spreadsheetId: string,
  filters: any[],
  authHeader: any
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClearByDataFilter`;
  try {
    const response = await got.post(url, {
      headers: authHeader,
      json: {
        dataFilters: filters,
      },
    }).json();

    return response;
  } catch (error: any) {
    console.error("Error deleting from spreadsheet using data filters:", error);
    throw new Error(`Error deleting from spreadsheet using data filters: ${error.message}`);
  }
}

// bulk update using Primmary Key --->new--->checked 
export async function bulkUpdateByPrimaryKey(
  spreadsheetId: string,
  sheet: string,
  primaryKey: string,
  data: any[],
  authHeader: any
) {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  if (!primaryKey) throw new Error('primaryKey is required');
  if (!data || !Array.isArray(data) || data.length === 0)
    throw new Error('data must be a non-empty array');

  if (!sheet || sheet.trim() === '') sheet = 'Sheet1';
  const range = 'A1:Z1000';

  const readResponse = (await makeRequestToReadValues(
    spreadsheetId,
    sheet,
    range,
    authHeader
  )) as { values?: string[][] };

  const values = readResponse.values || [];

  if (values.length === 0) {
    const headers = Object.keys(data[0]);
    const rowsToAppend = data.map((obj) => headers.map((h) => obj[h] ?? ''));

    const requestBody = {
      values: [headers, ...rowsToAppend],
    };

    const appendResponse = await makeRequestToAppendValues(
      spreadsheetId,
      sheet,
      requestBody,
      authHeader
    );

    return {
      mode: 'created',
      addedRows: data.length,
      result: appendResponse,
    };
  }

  const headers = values[0];
  const keyIndex = headers.indexOf(primaryKey);
  if (keyIndex === -1)
    throw new Error(`Primary key "${primaryKey}" not found in sheet headers`);

  const keyToRow = new Map<string, number>();
  for (let i = 1; i < values.length; i++) {
    const key = values[i][keyIndex];
    if (key) keyToRow.set(key, i + 1);
  }

  const updates: any[] = [];
  const inserts: string[][] = [];

  for (const record of data) {
    const keyVal = record[primaryKey];
    const rowNum = keyToRow.get(String(keyVal));

    if (rowNum) {
      for (const [field, value] of Object.entries(record)) {
        if (field === primaryKey) continue;
        const colIndex = headers.indexOf(field);
        if (colIndex === -1) continue;

        const cell = `${sheet}!${columnLetter(colIndex + 1)}${rowNum}`;
        updates.push({
          range: cell,
          majorDimension: 'ROWS',
          values: [[value]],
        });
      }
    } else {
      const newRow = headers.map((header) => record[header] ?? '');
      inserts.push(newRow);
    }
  }

  if (updates.length > 0) {
    const updateBody = {
      valueInputOption: 'USER_ENTERED',
      data: updates,
    };
    await makeRequestToBatchUpdateValues(spreadsheetId, updateBody, authHeader);
  }

  if (inserts.length > 0) {
    const appendBody = { values: inserts };
    await makeRequestToAppendValues(
      spreadsheetId,
      sheet,
      appendBody,
      authHeader
    );
  }

  return {
    updatedCells: updates.length,
    insertedRows: inserts.length,
  };
}


function columnLetter(index: number): string {
  let letter = '';
  while (index > 0) {
    const mod = (index - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    index = Math.floor((index - mod) / 26);
  }
  return letter;
}

// copy one spreadsheet into another --->new
export async function copySpreadsheetData(
  sourceSpreadsheetId: string,
  destinationSpreadsheetId: string,
  authHeader: any,
  sourceRange?: string,
  destinationRange?: string
) {
  if (!sourceSpreadsheetId) throw new Error('sourceSpreadsheetId is required');
  if (!destinationSpreadsheetId) throw new Error('destinationSpreadsheetId is required');

  const defaultSheet = 'Sheet1';
  let sourceSheet = defaultSheet;
  let rangePart = 'A1:Z1000';

  if (sourceRange && sourceRange.includes('!')) {
    const [sheet, r] = sourceRange.split('!');
    sourceSheet = sheet || defaultSheet;
    rangePart = r || rangePart;
  } else if (sourceRange) {
    rangePart = sourceRange;
  }

  const readResponse = (await makeRequestToReadValues(
    sourceSpreadsheetId,
    sourceSheet,
    rangePart,
    authHeader
  )) as { values?: string[][] };

  const values = readResponse.values || [];
  if (values.length === 0) {
    throw new Error('No data found in source spreadsheet');
  }

  let destinationSheet = defaultSheet;
  if (destinationRange && destinationRange.includes('!')) {
    const [sheet] = destinationRange.split('!');
    destinationSheet = sheet || defaultSheet;
  } else if (destinationRange) {
    destinationSheet = destinationRange;
  }

  const writeBody = { values };

  const writeResponse = await makeRequestToAppendValues(
    destinationSpreadsheetId,
    destinationSheet, 
    writeBody,
    authHeader
  );

  return {
    destinationSheet,
    copiedRows: values.length,
    result: writeResponse,
  };
}
// list all spreadsheet ---> new
export async function listAllSpreadsheets(
  authHeader: any,
  pageSize?: string,
  pageToken?: string,
  filter?: string
) {
  try {
    let query = "mimeType='application/vnd.google-apps.spreadsheet'";
    if (filter) {
      query += ` and ${filter}`;
    }

    const params = new URLSearchParams();
    params.append('q', query);
    params.append('pageSize', pageSize || '50');
    if (pageToken) params.append('pageToken', pageToken);
    params.append('fields', 'nextPageToken, files(id, name, owners, createdTime)');
    params.append('supportsAllDrives', 'true');
    params.append('includeItemsFromAllDrives', 'true');

    const response = await got(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      method: 'get',
      headers: authHeader,
    });
    return JSON.parse(response.body);
  } catch (error) {
    console.error('Error listing spreadsheets:', error.response?.body || error.message);
    throw new Error('Failed to list spreadsheets');
  }
}

// Delete cells within a specified range and shift remaining cells. --------> new
export async function deleteByRange(
  spreadsheetId: string,
  sheet: string,
  spreadsheetRange: string,
  shiftDimension: 'ROWS' | 'COLUMNS' = 'ROWS',
  authHeader: any
): Promise<any> {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  if (!spreadsheetRange) throw new Error('spreadsheetRange is required');

  const sheetId = await getSheetId(spreadsheetId, sheet, authHeader);

  const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = convertA1RangeToIndexes(spreadsheetRange);

  const requestBody = {
    requests: [
      {
        deleteRange: {
          range: {
            sheetId,
            startRowIndex,
            endRowIndex,
            startColumnIndex,
            endColumnIndex,
          },
          shiftDimension: shiftDimension || 'ROWS',
        },
      },
    ],
  };

  const response = await makeRequestToDeleteRows(spreadsheetId, requestBody, authHeader);
  return {
    result: response,
  };
}


function convertA1RangeToIndexes(a1Range: string) {
  const rangeRegex = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/;
  const match = a1Range.toUpperCase().match(rangeRegex);
  if (!match) {
    throw new Error('Invalid range format. Example valid range: A1:C5');
  }

  const [, startCol, startRow, endCol, endRow] = match;

  return {
    startRowIndex: parseInt(startRow, 10) - 1,
    endRowIndex: parseInt(endRow, 10),
    startColumnIndex: letterToColumn(startCol) - 1,
    endColumnIndex: letterToColumn(endCol),
  };
}

function letterToColumn(letters: string): number {
  let column = 0;
  for (let i = 0; i < letters.length; i++) {
    column = column * 26 + (letters.charCodeAt(i) - 64);
  }
  return column;
}


// update spreadsheet values ---> new ---> checked 1
export async function updateSpreadsheet(
  spreadsheetId: string,
  sheet: string,
  spreadsheetRange: string,
  values: any,
  valueInputOption: 'RAW' | 'USER_ENTERED' | 'FORMULA' = 'USER_ENTERED',
  authHeader: any
): Promise<any> {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  if (!spreadsheetRange) throw new Error('spreadsheetRange is required');
  if (!values) throw new Error('values are required');

  const range = sheet ? `${sheet}!${spreadsheetRange}` : spreadsheetRange;
  const requestBody = {
    values: Array.isArray(values) ? values : JSON.parse(values),
  };

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=${valueInputOption}`;

  interface UpdateValuesResponse {
    spreadsheetId: string;
    updatedRange: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
  }

  try {
    const response = await got
      .put(url, {
        headers: authHeader,
        json: requestBody,
      })
      .json<UpdateValuesResponse>();

    return {result: response};
  } catch (error: any) {
    console.error('Error updating spreadsheet:', error.response?.body || error.message);
    throw new Error(`Failed to update spreadsheet: ${error.message}`);
  }
}









































