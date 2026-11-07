import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillAppVersionToDataQueries1675368628727 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    let progress = 0;

    const appVersions = await entityManager.query(
      'select distinct(data_sources.app_version_id) from data_queries inner join data_sources on data_queries.data_source_id = data_sources.id'
    );

    const queryToAppVersionMap = await entityManager.query(
      'select data_queries.id, data_sources.app_version_id from data_queries inner join data_sources on data_queries.data_source_id = data_sources.id'
    );

    console.log(`App versions found : ${appVersions?.length || 0}`);

    if (queryToAppVersionMap?.length) {
      for (const { app_version_id: appVersion } of appVersions) {
        progress++;
        console.log(
          `BackfillAppVersionToDataQueries1675368628727 Progress ${Math.round((progress / appVersions.length) * 100)} %`
        );

        const queries = queryToAppVersionMap?.filter((query) => query.app_version_id === appVersion);
        if (queries?.length) {
          await entityManager.query(
            `update data_queries set app_version_id = $1 where id IN(${queries.map((dq) => `'${dq.id}'`)?.join()})`,
            [appVersion]
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
