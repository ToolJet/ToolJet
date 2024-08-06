import { tooljetDbOrmconfig } from 'ormconfig';
import { DataSource, EntityManager } from 'typeorm';

export async function createMigrationConnectionForToolJetDatabase(
  connectionName: string
): Promise<{ tooljetDbManager: EntityManager; tooljetDbConnection: DataSource }> {
  try {
    const tooljetDbDataSource = new DataSource({
      ...tooljetDbOrmconfig,
      name: connectionName,
    } as any);
    await tooljetDbDataSource.initialize();

    const tooljetDbManager = tooljetDbDataSource.createEntityManager();
    await tooljetDbManager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.queryRunner.query(`SET statement_timeout = '0';`);
      console.log(`ToolJet Database Migration: --- Statement timeouts made to default'`);
    });

    return { tooljetDbManager, tooljetDbConnection: tooljetDbDataSource };
  } catch (error) {
    console.error(
      `An error occurred while creating a migration connection for the TooJet database: ${connectionName} --- `,
      error
    );
    throw error;
  }
}
