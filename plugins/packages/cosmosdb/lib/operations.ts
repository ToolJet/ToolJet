import { Container, CosmosClient } from '@azure/cosmos';

export async function listDatabases(client: CosmosClient): Promise<object> {
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
      })
      .finally(() => client.dispose());
  });
}

export function listContainers(client: CosmosClient, database: string) {
  return new Promise((resolve, reject) => {
    lookUpDatabase(client, database)
      .then(() => {
        client
          .database(database)
          .containers.readAll()
          .fetchAll()
          .then((data) => {
            const containers = data.resources.map((container) => container.id);
            resolve(containers);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      })

      .finally(() => client.dispose());
  });
}

export function insertItems(client: CosmosClient, database: string, containerId: string, items: []) {
  return new Promise((resolve, reject) => {
    lookUpContainer(client, database, containerId)
      .then((container: Container) => {
        items.forEach(async (item) => {
          await container.items.create(item);
        });
        resolve({ message: 'Items inserted' });
      })
      .catch((err) => {
        reject(err);
      })
      .finally(() => client.dispose());
  });
}

export function deleteItem(client: CosmosClient, database: string, containerId: string, itemId) {
  return new Promise((resolve, reject) => {
    lookUpContainer(client, database, containerId)
      .then((container: Container) => {
        container
          .item(itemId)
          .delete()
          .then(() => {
            resolve({ message: 'Item deleted' });
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      })
      .finally(() => client.dispose());
  });
}

export function queryDatabase(client: CosmosClient, database: string, containerId: string, query: string) {
  return new Promise((resolve, reject) => {
    lookUpContainer(client, database, containerId)
      .then((container: Container) => {
        container.items
          .query(query)
          .fetchAll()
          .then((data) => {
            resolve(data.resources);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      })
      .finally(() => client.dispose());
  });
}

export async function getItem(client: CosmosClient, database: string, containerId: string, itemId: string) {
  const { container } = await client.database(database).containers.createIfNotExists({ id: containerId });

  return (await container.item(itemId).read()).resource;
}

function lookUpContainer(client: CosmosClient, database: string, containerId: string) {
  return new Promise((resolve, reject) => {
    client
      .database(database)
      .containers.createIfNotExists({ id: containerId })
      .then((data) => {
        resolve(data.container);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function lookUpDatabase(client: CosmosClient, database: string) {
  return new Promise((resolve, reject) => {
    client.databases
      .createIfNotExists({ id: database })
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject(err);
      });
  })
    .catch((err) => {
      throw new Error(err);
    })
    .finally(() => client.dispose());
}
