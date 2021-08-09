export function listTables(client): Promise<object> {
  return new Promise((resolve, reject) => {
    client.listTables(function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data['TableNames']);
      }
    });
  });
}

export function getItem(client, table: string, key: object): Promise<object> { 
  
  const params = {
    TableName: table,
    Key: key
  };

  return new Promise((resolve, reject) => {
    client.get(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data['Item']|| {});
      }
    });
  });
}

export function deleteItem(client, table: string, key: object): Promise<object> { 
  
  const params = {
    TableName: table,
    Key: key
  };

  return new Promise((resolve, reject) => {
    client.delete(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function queryTable(client, queryCondition: object): Promise<object> { 
  
  return new Promise((resolve, reject) => {
    client.query(queryCondition, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function scanTable(client, scanCondition: object): Promise<object> { 
  
  return new Promise((resolve, reject) => {
    client.scan(scanCondition, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
