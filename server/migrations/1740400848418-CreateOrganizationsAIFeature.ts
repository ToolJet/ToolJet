import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateOrganizationsAiFeature1740400848418 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organizations_ai_feature',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'balance',
            type: 'int',
          },
          {
            name: 'renew_date',
            type: 'timestamp',
          },
          {
            name: 'ai_credit_fixed',
            type: 'int',
          },
          {
            name: 'ai_credit_multiplier',
            type: 'int',
          },
          {
            name: 'balance_renewed_date',
            type: 'timestamp',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'organizations_ai_feature',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'organizations_ai_feature',
      new TableIndex({
        name: 'IDX_UNIQUE_ORG_AI_FEATURE',
        columnNames: ['organization_id'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
