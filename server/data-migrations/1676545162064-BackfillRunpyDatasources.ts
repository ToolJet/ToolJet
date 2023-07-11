import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

/**
 * finds all the queries which are attached to restapi datasource with type static  but have a non-null code option, which indicates that they are actually associated with a runpy data source.
 * creates a new runpy data source and attaches all such queries to it.
 */

export class BackfillRunpyDatasources1676545162064 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    let progress = 0;

    const allVersions = await entityManager
      .createQueryBuilder()
      .select()
      .from('app_versions', 'app_versions')
      .getRawMany();

    for (const version of allVersions) {
      progress++;
      console.log(
        `BackfillRunpyDatasources1676545162064 Progress ${Math.round((progress / allVersions.length) * 100)} %`
      );

      await this.createDefaultVersionAndAttachQueries(entityManager, version);
    }
  }

  async createDefaultVersionAndAttachQueries(entityManager: EntityManager, version: any) {
    const wronglyAttachedRunpyQueries = await entityManager.query(
      "select data_queries.id from data_queries inner join data_sources on data_queries.data_source_id = data_sources.id where data_queries.options->> 'code' is not null and data_sources.kind = 'restapi' and data_sources.type = 'static' and data_sources.app_version_id = $1",
      [version.id]
    );

    if (wronglyAttachedRunpyQueries.length > 0) {
      let runpyDS = await entityManager.query(
        "select data_sources.id from data_sources where data_sources.kind = 'runpy' and data_sources.type = 'static'"
      );

      if (runpyDS.length === 0) {
        runpyDS = await entityManager.query(
          'insert into data_sources (name, kind, app_version_id, type) values ($1, $2, $3, $4) returning "id"',
          ['runpydefault', 'runpy', version.id, 'static']
        );
      }
      await entityManager.query(
        `update data_queries set data_source_id = $1 where id in (${wronglyAttachedRunpyQueries
          .map(({ id }) => `'${id}'`)
          .join()})`,
        [runpyDS[0].id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
