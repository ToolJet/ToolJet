import got from 'got';

export async function readDataFromSheet(spreadSheetId: string, sheet: string, range: string, authHeader: any) {
  const response = await got.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${sheet || ''}!${range}`, { 
    headers: authHeader
  });

  const data = JSON.parse(response.body);

  let headers = [];
  let values = [];
  let result = [];
  const dataValues = data['values'];

  if(dataValues) {
    headers = dataValues[0];
    values = dataValues.length > 1 ? dataValues.slice(1, dataValues.length) : [];
    
    for(const value of values) {
      let row = {};
      for(const [index, header] of headers.entries()) {
        console.log(index, header, value)
        row[header] = value[index];
      }
      result.push(row);
    }
  }
        
  return result;
}

export async function readData(spreadSheetId: string, sheet: string, authHeader: any) { 
  return await readDataFromSheet(spreadSheetId, sheet, "A1:V101", authHeader);
}
