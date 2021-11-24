import got from 'got';

async function makeRequestToReadValues(spreadSheetId: string, sheet: string, range: string, authHeader: any) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${sheet || ''}!${range}`;

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

export async function batchUpdateToSheet(spreadSheetId: string, requestBody: any, filterData: any, authHeader: any) {
  const lookUpData = await lookUpSheetData(spreadSheetId, authHeader);

  console.log('data', requestBody);

  const updateBody = (requestBody, filterCondition, data) => {
    const rowsIndexes = getRowsIndex(filterCondition, data) as any[];
    const colIndexes = getInputKeys(requestBody, data);
    // console.log('rowsIndexes', rowsIndexes);
    // console.log('colIndexes', colIndexes);
    const updateCellIndexes = [];
    colIndexes.map((col) => {
      rowsIndexes.map((rowIndex) => updateCellIndexes.push({ ...col, cellIndex: `${col.colIndex}${rowIndex}` }));
    });

    const body = [];
    Object.entries(requestBody).map((item) => {
      updateCellIndexes.map((cell) => {
        if (item[0] === cell.col) {
          body.push({ cellValue: item[1], cellIndex: cell.cellIndex });
        }
      });
    });

    const _data = body.map((data) => {
      return {
        majorDimension: 'ROWS',
        range: data.cellIndex,
        values: [[data.cellValue]],
      };
    });

    return _data;
  };

  const reqBody = {
    data: updateBody(requestBody, filterData, lookUpData),
    valueInputOption: 'USER_ENTERED',
    includeValuesInResponse: true,
  };
  // console.log('reqBody', reqBody);
  const response = await makeRequestToBatchUpdateValues(spreadSheetId, reqBody, authHeader);
  return response;
}

export async function readDataFromSheet(spreadSheetId: string, sheet: string, range: string, authHeader: any) {
  const data = await makeRequestToReadValues(spreadSheetId, sheet, range, authHeader);
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

async function deleteDataFromSheet(spreadSheetId: string, sheet: string, rowIndex: any, authHeader: any) {
  const requestBody = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sheet,
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
  authHeader: any
): Promise<any[]> {
  return await readDataFromSheet(spreadSheetId, sheet, spreadsheetRange, authHeader);
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

async function lookUpSheetData(spreadSheetId: string, authHeader: any) {
  const responseLookUpCellValues = await makeRequestToLookUpCellValues(spreadSheetId, 'A1:Z500', authHeader);
  const data = await responseLookUpCellValues['values'];

  return data;
}

//* utils
const getInputKeys = (inputBody, data) => {
  console.log('inputBody', typeof inputBody);

  const keys = Object.keys(inputBody);
  const arr = [];
  keys.map((key) =>
    data.filter((val, index) => {
      if (val[0] === key) {
        const kIndex = `${String.fromCharCode(65 + index)}`;
        arr.push({ col: val[0], colIndex: kIndex });
      }
    })
  );
  console.log('keys', keys);
  return arr;
};

const getRowsIndex = (inputFilter, response) => {
  const columnValues = response.filter((column) => column[0] === inputFilter.key).flat();

  if (columnValues.length === 0) {
    return -1;
  }

  const rowIndex = [];

  columnValues.forEach((col, index) => {
    if (col === inputFilter.value) {
      rowIndex.push(index + 1);
    }
  });

  return rowIndex;
};
