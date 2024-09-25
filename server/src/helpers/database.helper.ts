import { DataSource, EntityManager } from 'typeorm';
import { updateTimestampForAppVersion } from './utils.helper';

let CONNECTION_INSTANCE: DataSource;
export const getGetConnectionInstance = (): DataSource => {
  if (!CONNECTION_INSTANCE) {
    throw new Error('CONNECTION_INSTANCE not initialized');
  }
  return CONNECTION_INSTANCE;
};

export function setConnectionInstance(dataSource: DataSource) {
  console.log('CONNECTION_INSTANCE initialized');
  CONNECTION_INSTANCE = dataSource;
}

export async function dbTransactionWrap(operation: (...args) => any, manager?: EntityManager): Promise<any> {
  if (manager) {
    return await operation(manager);
  } else {
    const connection = await getGetConnectionInstance();
    const manager = connection.manager;
    return await manager.transaction(async (manager) => {
      return await operation(manager);
    });
  }
}

export async function dbTransactionForAppVersionAssociationsUpdate(
  operation: (...args) => any,
  appVersionId: string
): Promise<any> {
  const connection = await getGetConnectionInstance();
  const manager = connection.manager;
  return await manager.transaction(async (manager) => {
    const result = await operation(manager);

    await updateTimestampForAppVersion(manager, appVersionId);

    return result;
  });
}

export const getManager = (dataSource: DataSource) => dataSource.manager;
