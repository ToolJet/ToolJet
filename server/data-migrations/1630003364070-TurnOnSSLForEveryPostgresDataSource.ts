import { MigrationInterface, QueryRunner } from 'typeorm';

export class TurnOnSSLForEveryPostgresDataSource1630003364070 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const queryBuilder = queryRunner.connection.createQueryBuilder();

    const dataSources = await entityManager
      .createQueryBuilder()
      .select(['id', 'options'])
      .from('data_sources', 'data_sources')
      .where('data_sources.kind = :kind', { kind: 'postgresql' })
      .getRawMany();

    for (const dataSource of dataSources) {
      const options = dataSource.options;
      if (options) {
        options['ssl_enabled'] = { value: true, encrypted: false };
        await queryBuilder.update('data_sources').set({ options }).where('id = :id', { id: dataSource.id }).execute();
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
