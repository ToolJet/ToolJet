import { GetConnection } from './getconnection';
import { AppModule } from 'src/app.module';
import { NestFactory } from '@nestjs/core';
import { DataSource, EntityManager } from 'typeorm';
import { updateTimestampForAppVersion } from './utils.helper';

let getConnectionInstance: GetConnection;
export const getGetConnectionInstance = async (): Promise<GetConnection> => {
  if (!getConnectionInstance) {
    const app = await NestFactory.createApplicationContext(AppModule);
    getConnectionInstance = app.get(GetConnection);
  }
  return getConnectionInstance;
};

export async function dbTransactionWrap(operation: (...args) => any, manager?: EntityManager): Promise<any> {
  if (manager) {
    return await operation(manager);
  } else {
    const connection = await getGetConnectionInstance();
    const manager = connection.dataSource.manager;
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
  const manager = connection.dataSource.manager;
  return await manager.transaction(async (manager) => {
    const result = await operation(manager);

    await updateTimestampForAppVersion(manager, appVersionId);

    return result;
  });
}

export const getManager = (dataSource: DataSource) => dataSource.manager;
