import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';

export async function findAllRelationsForVersion(versionId: string, manager?: EntityManager): Promise<any> {
  // this.getUuidFieldsForExport()
  return await dbTransactionWrap(async (manager: EntityManager) => {}, manager);
}
