import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRemoteUpdatedAtToAppVersions1779600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'remote_updated_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      })
    );

    // Stamp the non-stub DRAFT rows inserted by 1777970000000 so Gate B in
    // AppsService.getOne (remote_updated_at non-NULL AND pulled_at NULL)
    // triggers lazy hydration on first app open. Match by the sentinel name
    // that 1777970000000 wrote, then rewrite `name = id::text` so the
    // sentinel doesn't linger and (name, app_id) UNIQUE stays trivially
    // satisfied (id is globally unique).
    await queryRunner.query(`
      UPDATE app_versions
      SET remote_updated_at = NOW(),
          name = id::text
      WHERE name = '00000000-0000-0000-0000-000077970000'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('app_versions', 'remote_updated_at');
  }
}
