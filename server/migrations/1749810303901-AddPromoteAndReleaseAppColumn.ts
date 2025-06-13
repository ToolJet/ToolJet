import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPromoteAndReleaseAppColumn1749810303901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('permission_groups', [
      new TableColumn({
        name: 'promote_app',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'release_app',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    ]);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
// TO Do later : pending to add constraint on admin and end user groups
