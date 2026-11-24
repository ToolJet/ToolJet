import { tooljetDbOrmconfig } from 'ormconfig';
import { MigrationInterface, QueryRunner, EntityManager, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';

export class UpdateInternalTablesConfigurationsColumn1718542399701 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tooljetDbConnection = new DataSource({
      ...tooljetDbOrmconfig,
      name: 'tooljetDbMigration',
    } as any);

    await tooljetDbConnection.initialize();
    const tooljetDbQueryRunner = tooljetDbConnection.createQueryRunner();
    try {
      // Fetches Table IDs
      const tableIdsResult = await queryRunner.query(`SELECT id FROM internal_tables`);
      const tableIds = tableIdsResult.map(({ id }) => id);

      const migrationProgress = new MigrationProgress(
        'UpdateInternalTablesConfigurationsColumn1718542399701',
        tableIds.length
      );

      const getTableColumns = async (
        entityManager: EntityManager,
        skip: number,
        take: number
      ): Promise<{ id: string }[]> => {
        return await queryRunner.query(`SELECT id FROM internal_tables ORDER BY id LIMIT $1 OFFSET $2`, [take, skip]);
      };

      const processTableColumnsBatch = async (
        entityManager: EntityManager,
        tableBatch: { id: string }[]
      ): Promise<void> => {
        for (const { id } of tableBatch) {
          try {
            // Fetches column names for each table
            const columnsResult = await tooljetDbQueryRunner.query(
              `
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = $1
              `,
              [id]
            );

            const columnNames: Record<string, string> = {};
            const configurations: Record<string, any> = {};

            for (const column of columnsResult) {
              const columnUuid = uuidv4();
              columnNames[column.column_name] = columnUuid;
              configurations[columnUuid] = {};
            }

            // Create TableConfig
            const tableConfig = {
              columns: {
                column_names: columnNames,
                configurations: configurations,
              },
            };

            // Updates the table configuration
            const tableConfigJson = JSON.stringify(tableConfig);
            await queryRunner.query(
              `
                UPDATE internal_tables
                SET configurations = $1
                WHERE id = $2
              `,
              [tableConfigJson, id]
            );

            migrationProgress.show(); // Display progress
          } catch (error) {
            console.error(`Error fetching columns for table '${id}':`, error);
          }
        }
      };

      // Process in batches
      await processDataInBatches(queryRunner.manager, getTableColumns, processTableColumnsBatch, 100);
    } catch (error) {
      console.error('Error in migration script:', error);
      throw error;
    } finally {
      await tooljetDbQueryRunner.release();
      await tooljetDbConnection.destroy();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Implement the logic to undo the changes made in the up method
  }
}
