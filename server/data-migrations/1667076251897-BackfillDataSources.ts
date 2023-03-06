import { DataQuery } from 'src/entities/data_query.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillDataSources1667076251897 implements MigrationInterface {
  /* Creating default datasources for runjs and restapi and attaching to
     dataqueries which does not have any datasources
  */
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const apps = await entityManager.createQueryBuilder().select().from('apps', 'apps').getRawMany();

    const allVersions = await entityManager
      .createQueryBuilder()
      .select()
      .from('app_versions', 'app_versions')
      .getRawMany();

    for (const app of apps) {
      const versions = allVersions.filter((v) => v.app_id === app.id);

      if (versions?.length > 0) {
        for (const version of versions) {
          await this.associateExistingDataSourceAndQueriesToVersion(entityManager, version);
          await this.createDefaultVersionAndAttachQueries(entityManager, version);
        }
      } else {
        // version not exist, default version creation
        const defaultAppVersion = await entityManager.query(
          'insert into app_versions (name, app_id, definition, created_at, updated_at) values ($1, $2, $3, $4, $4) returning *',
          ['v1', app.id, app.definition, new Date()]
        );

        await this.associateExistingDataSourceAndQueriesToVersion(entityManager, defaultAppVersion[0]);
        await this.createDefaultVersionAndAttachQueries(entityManager, defaultAppVersion[0]);
      }
    }
  }

  async associateExistingDataSourceAndQueriesToVersion(manager: EntityManager, appVersion: any) {
    await manager.query('update data_sources set app_version_id = $1 where app_version_id IS NULL and app_id = $2', [
      appVersion.id,
      appVersion.app_id,
    ]);
    await manager.query('update data_queries set app_version_id = $1 where app_version_id IS NULL and app_id = $2', [
      appVersion.id,
      appVersion.app_id,
    ]);
  }

  async createDefaultVersionAndAttachQueries(entityManager: EntityManager, version: any) {
    let runjsDS, restapiDS, runpyDS;
    for (const kind of ['runjs', 'restapi', 'runpy']) {
      const dataSourceResult = await entityManager.query(
        'insert into data_sources (name, kind, app_version_id, app_id, type) values ($1, $2, $3, $4, $5) returning "id"',
        [`${kind}default`, kind, version.id, version.app_id, 'static']
      );

      if (kind === 'runjs') {
        runjsDS = dataSourceResult[0].id;
      } else if (kind === 'runpy') {
        runpyDS = dataSourceResult[0].id;
      } else {
        restapiDS = dataSourceResult[0].id;
      }
    }

    const dataQueries = await entityManager.query(
      'select kind, id from data_queries where data_source_id IS NULL and app_version_id = $1',
      [version.id]
    );

    for (const dataQuery of dataQueries) {
      await entityManager
        .createQueryBuilder()
        .update(DataQuery)
        .set({ dataSourceId: dataQuery.kind === 'runjs' ? runjsDS : dataQuery.kind === 'runpy' ? runpyDS : restapiDS })
        .where({ id: dataQuery.id })
        .execute();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const defaultDataSources = await entityManager.query('select id from data_sources where type = $1', ['static']);

    if (defaultDataSources?.length) {
      await entityManager.query(
        `update data_queries set data_source_id = NULL where data_source_id IN(${defaultDataSources
          .map((ds) => `'${ds.id}'`)
          .join()})`
      );
      await entityManager.query(
        `delete from data_sources where id IN(${defaultDataSources.map((ds) => `'${ds.id}'`).join()})`
      );
    }
  }
}
