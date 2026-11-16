import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateGroupAdminsTable1776166250667 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'group_admins',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'group_id', type: 'uuid', isNullable: false },
          { name: 'organization_id', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', isNullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamp', isNullable: false, default: 'now()' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'group_admins',
      new TableForeignKey({
        name: 'fk_group_admins_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'group_admins',
      new TableForeignKey({
        name: 'fk_group_admins_group_id',
        columnNames: ['group_id'],
        referencedTableName: 'permission_groups',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'group_admins',
      new TableForeignKey({
        name: 'fk_group_admins_organization_id',
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createUniqueConstraint(
      'group_admins',
      new TableUnique({ columnNames: ['user_id', 'group_id'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('group_admins', true);
  }
}