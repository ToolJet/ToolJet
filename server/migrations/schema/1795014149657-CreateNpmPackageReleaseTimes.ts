import { MigrationInterface, QueryRunner } from 'typeorm';

// When each npm package version was published, as the app security scanner read it from a registry. A version's
// publish time never changes, so the scanner asks the registry only about versions not here: the registry documents
// of packages that publish daily are 10-20 MB, and fetching them on every check made it time out. Public registry
// data, kept per registry and shared by every workspace; no keys to other tables.
export class CreateNpmPackageReleaseTimes1795014149657 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS npm_package_release_times (
        registry varchar(500) NOT NULL,
        package_name varchar(214) NOT NULL,
        version varchar(256) NOT NULL,
        published_at timestamptz NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        PRIMARY KEY (registry, package_name, version)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS npm_package_release_times');
  }
}
