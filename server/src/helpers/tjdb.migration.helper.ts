import { tooljetDbOrmconfig } from 'ormconfig';
import { EntityManager, createConnection, Connection } from 'typeorm';

export async function createMigrationConnectionForToolJetDatabase(
  connectionName: string
): Promise<{ tooljetDbManager: EntityManager; tooljetDbConnection: Connection }> {
  try {
    const tooljetDbConnection = await createConnection({
      ...tooljetDbOrmconfig,
      name: connectionName,
    } as any);

    const tooljetDbManager = tooljetDbConnection.createEntityManager();
    await tooljetDbManager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.queryRunner.query(`SET statement_timeout = '0';`);
      console.log(`ToolJet Database Migration: --- Statement timeouts made to default'`);
    });

    return { tooljetDbManager, tooljetDbConnection };
  } catch (error) {
    console.error(
      `An error occurred while creating a migration connection for the TooJet database: ${connectionName} --- `,
      error
    );
    throw error;
  }
}
