import got from 'got';

async function makeRequestToReadValues(
  spreadSheetId: string,
  sheet: string,
  range: string,
  authHeader: any,
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${
    sheet || ''
  }!${range}`;

  return await got.get(url, { headers: authHeader }).json();
}

async function makeRequestToAppendValues(
  spreadSheetId: string,
  sheet: string,
  requestBody: any,
  authHeader: any,
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${
    sheet || ''
  }!A:Z:append?valueInputOption=USER_ENTERED`;

  return await got.post(url, { headers: authHeader, json: requestBody }).json();
}

async function makeRequestToBatchUpdate(
  spreadSheetId: string,
  requestBody: any,
  authHeader: any,
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}:batchUpdate`;

  return await got.post(url, { headers: authHeader, json: requestBody }).json();
}

export async function readDataFromSheet(
  spreadSheetId: string,
  sheet: string,
  range: string,
  authHeader: any,
) {
  const data = await makeRequestToReadValues(
    spreadSheetId,
    sheet,
    range,
    authHeader,
  );
  let headers = [];
  let values = [];
  const result = [];
  const dataValues = data['values'];

  if (dataValues) {
    headers = dataValues[0];
    values =
      dataValues.length > 1 ? dataValues.slice(1, dataValues.length) : [];

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

async function appendDataToSheet(
  spreadSheetId: string,
  sheet: string,
  rows: any,
  authHeader: any,
) {
  const parsedRows = JSON.parse(rows);
  const sheetData = await makeRequestToReadValues(
    spreadSheetId,
    sheet,
    'A1:Z1',
    authHeader,
  );
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
  const response = await makeRequestToAppendValues(
    spreadSheetId,
    sheet,
    requestBody,
    authHeader,
  );

  return response;
}

async function deleteDataFromSheet(
  spreadSheetId: string,
  sheet: string,
  rowIndex: any,
  authHeader: any,
) {
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

  const response = await makeRequestToBatchUpdate(
    spreadSheetId,
    requestBody,
    authHeader,
  );

  return response;
}

export async function readData(
  spreadSheetId: string,
  sheet: string,
  authHeader: any,
): Promise<any[]> {
  return await readDataFromSheet(spreadSheetId, sheet, 'A1:Z500', authHeader);
}

export async function appendData(
  spreadSheetId: string,
  sheet: string,
  rows: any[],
  authHeader: any,
): Promise<any> {
  return await appendDataToSheet(spreadSheetId, sheet, rows, authHeader);
}

export async function deleteData(
  spreadSheetId: string,
  sheet: string,
  rowIndex: string,
  authHeader: any,
): Promise<any> {
  return await deleteDataFromSheet(spreadSheetId, sheet, rowIndex, authHeader);
}
