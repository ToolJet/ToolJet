import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillDataSources1667076251897 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const versions = await entityManager
      .createQueryBuilder()
      .select()
      .from('app_versions', 'app_versions')
      .getRawMany();

    for (const version of versions) {
      let runjsDS, restapiDS;
      for (const kind of ['runjs', 'restapi']) {
        const dataSourceResult = await entityManager
          .createQueryBuilder()
          .insert()
          .into('data_sources')
          .values({
            name: `${kind}default`,
            kind: `${kind}default`,
            app_version_id: version.id,
          })
          .execute();

        if (kind === 'runjs') {
          runjsDS = dataSourceResult.generatedMaps[0].id;
        } else {
          restapiDS = dataSourceResult.generatedMaps[0].id;
        }

        const dataQueries = await entityManager
          .createQueryBuilder()
          .select()
          .from('data_queries', 'data_queries')
          .andWhere('data_queries.data_source_id IS NULL')
          .andWhere('data_queries.app_version_id = :app_version_id', { app_version_id: version.id })
          .getRawMany();

        for (const dataQuery of dataQueries) {
          await entityManager
            .createQueryBuilder()
            .update('data_queries')
            .set({ data_source_id: dataQuery.kind === 'runjs' ? runjsDS : restapiDS })
            .where({ id: dataQuery.id })
            .execute();
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
