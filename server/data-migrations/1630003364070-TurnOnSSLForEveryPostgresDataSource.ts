import { MigrationInterface, QueryRunner } from 'typeorm';

export class TurnOnSSLForEveryPostgresDataSource1630003364070 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const dataSources = await entityManager.query('select id, options from data_sources where kind = $1', [
      'postgresql',
    ]);

    for (const dataSource of dataSources) {
      const options = dataSource.options;
      if (options) {
        options['ssl_enabled'] = { value: true, encrypted: false };
        await entityManager.query('update data_sources set options = $1 where id = $2', [options, dataSource.id]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
