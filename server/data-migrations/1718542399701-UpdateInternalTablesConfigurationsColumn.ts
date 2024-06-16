import { createConnection } from 'typeorm';
import { tooljetDbOrmconfig } from 'ormconfig';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class UpdateInternalTablesConfigurationsColumn1718542399701 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tooljetDbConnection = await createConnection({
      ...tooljetDbOrmconfig,
      name: 'tooljetDbMigration',
    } as any);

    const tooljetDbQueryRunner = tooljetDbConnection.createQueryRunner();
    try {
      //Fetches Tables Ids
      const tableIdsResult = await queryRunner.query(`SELECT id FROM internal_tables`);

      // Iterate through table IDs
      for (const { id } of tableIdsResult) {
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
        } catch (error) {
          console.error(`Error fetching columns for table '${id}':`, error);
        }
      }
    } catch (error) {
      console.error('Error in migration script:', error);
      throw error;
    } finally {
      await tooljetDbQueryRunner.release();
      await tooljetDbConnection.close();
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
