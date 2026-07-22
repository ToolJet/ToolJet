import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DisablePublicAppsByDefault1784399400123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // "Make application public" is now gated behind the appPublic license entitlement
    // (Team/Enterprise plans). Reset every existing app to private so that, going forward,
    // end-user access is governed solely by user-group permissions. Organizations with the
    // entitlement can re-enable sharing per app from the editor.
    await queryRunner.query(`UPDATE apps SET is_public = false WHERE is_public = true`);

    await queryRunner.changeColumn(
      'apps',
      'is_public',
      new TableColumn({
        name: 'is_public',
        type: 'boolean',
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'apps',
      'is_public',
      new TableColumn({
        name: 'is_public',
        type: 'boolean',
        default: true,
      })
    );
  }
}
