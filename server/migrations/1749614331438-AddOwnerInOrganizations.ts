import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
const isCloudEdition = process.env.TOOLJET_EDITION === 'cloud';

export class AddOwnerInOrganizations1749614331438 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // If edition is not cloud, skip this migration
    if (!isCloudEdition) {
      console.log('Migration is only restricted for cloud edition.');
      return; // Exit the migration early
    }
    await queryRunner.addColumn(
      'organizations',
      new TableColumn({
        name: 'owner_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'organizations',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      })
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizations', 'owner_id');
  }
}
