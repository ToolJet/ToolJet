import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGlobalDataSources1742905945987 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const constraintExists = await queryRunner.query(`
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'chk_global_data_source_app_version_id' 
      AND table_name = 'data_sources'
    `);

    if (constraintExists && constraintExists.length > 0) {
      console.log('Constraint chk_global_data_source_app_version_id already exists. Skipping migration.');
      return;
    }

    // Step 1: Set app_version_id to NULL for existing global data sources
    await queryRunner.query(`
        UPDATE data_sources
        SET app_version_id = NULL
        WHERE scope = 'global'
      `);

    // Step 2: Add a check constraint to ensure app_version_id is NULL for global data sources
    await queryRunner.query(`
        ALTER TABLE data_sources
        ADD CONSTRAINT chk_global_data_source_app_version_id
        CHECK (scope != 'global' OR app_version_id IS NULL)
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the constraint if it exists
    const constraintExists = await queryRunner.query(`
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'chk_global_data_source_app_version_id' 
      AND table_name = 'data_sources'
    `);

    if (constraintExists && constraintExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE data_sources
        DROP CONSTRAINT chk_global_data_source_app_version_id
      `);
    }
  }
}
