import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsDefaultToOrganizations1740401000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_default column
    await queryRunner.addColumn(
      'organizations',
      new TableColumn({
        name: 'is_default',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    // Create a partial unique index to ensure only one default workspace
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_organizations_single_default 
      ON organizations (is_default)
      WHERE is_default = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique index first
    await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_single_default;`);
    // Then drop the column
    await queryRunner.dropColumn('organizations', 'is_default');
  }
} 
