import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddUniqueConstraintToOrganizationId1740028959193 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'organizations_ai_feature',
      new TableIndex({
        name: 'IDX_organizations_ai_feature_organization_id_unique',
        columnNames: ['organization_id'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('organizations_ai_feature', 'IDX_organizations_ai_feature_organization_id_unique');
  }
}
