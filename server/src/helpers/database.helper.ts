import { DataSource, EntityManager } from 'typeorm';
import { updateTimestampForAppVersion } from './utils.helper';
import { createLogger } from './bootstrap.helper';
import { databaseMonitoring } from '../otel/database-monitoring';

let CONNECTION_INSTANCE: DataSource;
const getConnectionInstance = (): DataSource => {
  if (!CONNECTION_INSTANCE) {
    throw new Error('Database connection not initialized');
  }
  return CONNECTION_INSTANCE;
};

export function setConnectionInstance(dataSource: DataSource) {
  const logger = createLogger('setConnectionInstance');
  logger.log('Database connection initialized');
  CONNECTION_INSTANCE = dataSource;
  
  // Initialize database monitoring if OTEL is enabled
  if (process.env.ENABLE_OTEL === 'true') {
    databaseMonitoring.setDataSource(dataSource);
    logger.log('Database monitoring initialized with OTEL');
  }
}

export async function dbTransactionWrap(operation: (...args) => any, manager?: EntityManager): Promise<any> {
  if (manager) {
    return await operation(manager);
  } else {
    const connection = await getConnectionInstance();
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
  const connection = await getConnectionInstance();
  const manager = connection.manager;
  return await manager.transaction(async (manager) => {
    const result = await operation(manager);

    await updateTimestampForAppVersion(manager, appVersionId);

    return result;
  });
}
