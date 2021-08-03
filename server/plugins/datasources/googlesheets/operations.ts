import got from 'got';

export async function readDataFromSheet(
  spreadSheetId: string,
  sheet: string,
  range: string,
  authHeader: any,
) {
  const response = await got.get(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${
      sheet || ''
    }!${range}`,
    {
      headers: authHeader,
    },
  );

  const data = JSON.parse(response.body);

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
  range: string,
  authHeader: any,
) {
  const sheetData = await readDataFromSheet(
    spreadSheetId,
    sheet,
    range,
    authHeader,
  );
  const fullSheetHeaders = Object.keys(sheetData[0]);
  const parsedRows = JSON.parse(rows);
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

  const response = await got
    .post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${
        sheet || ''
      }!A:V:append?valueInputOption=USER_ENTERED`,
      { headers: authHeader, json: { values: rowsToAppend } },
    )
    .json();

  return response;
}

export async function readData(
  spreadSheetId: string,
  sheet: string,
  authHeader: any,
) {
  return await readDataFromSheet(spreadSheetId, sheet, 'A1:V101', authHeader);
}

export async function appendData(
  spreadSheetId: string,
  sheet: string,
  rows: any[],
  authHeader: any,
) {
  return await appendDataToSheet(
    spreadSheetId,
    sheet,
    rows,
    'A1:V101',
    authHeader,
  );
}
