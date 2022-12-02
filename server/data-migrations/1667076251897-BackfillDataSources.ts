import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillDataSources1667076251897 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const dataQueries = await entityManager
      .createQueryBuilder()
      .select()
      .from('data_queries', 'data_queries')
      .andWhere('data_queries.data_source_id IS NULL')
      .getRawMany();

    for (const dataQuery of dataQueries) {
      const dataSourceResult = await entityManager
        .createQueryBuilder()
        .insert()
        .into('data_sources')
        .values({
          name: `${dataQuery.name}default`,
          kind: `${dataQuery.kind}default`,
          plugin_id: dataQuery.plugin_id,
          app_version_id: dataQuery.app_version_id,
        })
        .execute();

      const dataSource = dataSourceResult.generatedMaps[0];

      await entityManager
        .createQueryBuilder()
        .update('data_queries')
        .set({ data_source_id: dataSource.id })
        .where({ id: dataQuery.id })
        .execute();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
