import { MigrationInterface, QueryRunner } from 'typeorm';

// This migration is to cleanup data source options which are added on v2 migration, and conflicts with global data source
export class CleanupDataSourceOptionData1675844361117 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    let progress = 0;

    await queryRunner.dropColumn('data_sources', 'options');

    const dataSources = await entityManager.query('select id from data_sources');

    for (const { id } of dataSources) {
      progress++;
      console.log(
        `CleanupDataSourceOptionData1675844361117 Progress ${Math.round((progress / dataSources.length) * 100)} %`
      );

      const idsToDelete = await entityManager.query(
        `select data_source_options.id from data_source_options 
        inner join data_sources on data_source_options.data_source_id = data_sources.id 
        inner join app_environments on data_source_options.environment_id = app_environments.id 
        where data_sources.app_version_id != app_environments.app_version_id and data_source_options.data_source_id = $1`,
        [id]
      );

      if (idsToDelete && idsToDelete.length > 0) {
        await entityManager.query(
          `delete from data_source_options where id IN(${idsToDelete.map((ids) => `'${ids.id}'`).join()})`
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
