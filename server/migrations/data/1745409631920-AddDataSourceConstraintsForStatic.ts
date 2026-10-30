import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataSourceConstraintsForStatic1745409631920 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting migration to add constraints to data_sources table');

    // Add check constraint to ensure static type data sources have global scope
    await queryRunner.query(`
            ALTER TABLE data_sources
            ADD CONSTRAINT chk_static_type_global_scope
            CHECK (type != 'static' OR scope = 'global');
        `);
    console.log('Added constraint: static type data sources must have global scope');

    // Add unique constraint for combination of kind, type, and organization_id
    await queryRunner.query(`
            CREATE UNIQUE INDEX idx_unique_static_kind_org
            ON public.data_sources (kind, type, organization_id)
            WHERE type = 'static';
        `);
    console.log('Added unique constraint on kind, type, and organization_id');

    console.log('Migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting rollback of data_sources constraints');

    // Drop the unique constraint
    await queryRunner.query(`
            ALTER TABLE public.data_sources
            DROP CONSTRAINT IF EXISTS idx_unique_static_kind_org;
        `);
    console.log('Dropped unique constraint on kind, type, and organization_id');

    // Drop the check constraint
    await queryRunner.query(`
            ALTER TABLE public.data_sources
            DROP CONSTRAINT IF EXISTS chk_static_type_global_scope;
        `);
    console.log('Dropped constraint: static type data sources must have global scope');

    console.log('Rollback completed successfully');
  }
}
