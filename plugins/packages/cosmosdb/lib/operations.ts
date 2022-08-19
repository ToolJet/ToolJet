import { CosmosClient } from '@azure/cosmos';

export function listDatabases(client: CosmosClient): Promise<object> {
  return new Promise((resolve, reject) => {
    client.databases
      .readAll({})
      .fetchAll()
      .then((data) => {
        const databases = data.resources.map((db) => db.id);
        resolve(databases);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
