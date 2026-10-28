import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateOrgEnvironmentConstantsTable1687363681284 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create organization_constants table
    await queryRunner.createTable(
      new Table({
        name: 'organization_constants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'constant_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create org_environment_constant_values table
    await queryRunner.createTable(
      new Table({
        name: 'org_environment_constant_values',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_constant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'environment_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add foreign key constraint for organization_constant_id in org_environment_constant_values
    await queryRunner.createForeignKey(
      'org_environment_constant_values',
      new TableForeignKey({
        columnNames: ['organization_constant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organization_constants',
        onDelete: 'CASCADE',
      })
    );

    // Add foreign key constraint for environment_id in org_environment_constant_values
    await queryRunner.createForeignKey(
      'org_environment_constant_values',
      new TableForeignKey({
        columnNames: ['environment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_environments',
        onDelete: 'CASCADE',
      })
    );

    // Add unique constraint for organization_constant_id and environment_id in org_environment_constant_values
    await queryRunner.createUniqueConstraint(
      'org_environment_constant_values',
      new TableUnique({
        columnNames: ['organization_constant_id', 'environment_id'],
      })
    );

    await queryRunner.createUniqueConstraint(
      'organization_constants',
      new TableUnique({
        columnNames: ['constant_name', 'organization_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
