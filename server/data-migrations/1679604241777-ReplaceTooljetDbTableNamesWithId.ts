import { DataSource } from 'src/entities/data_source.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { isEmpty } from 'lodash';
import { InternalTable } from 'src/entities/internal_table.entity';
import { Organization } from 'src/entities/organization.entity';
import { DataQuery } from 'src/entities/data_query.entity';

export class ReplaceTooljetDbTableNamesWithId1679604241777 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let progress = 0;
    const entityManager = queryRunner.manager;
    const organizations = await entityManager.find(Organization, { select: ['id'] });
    const orgCount = organizations.length;
    console.log(`Total Organizations: ${orgCount}`);

    for (const organization of organizations) {
      console.log(
        `ReplaceTooljetDbTableNamesWithId1679604241777 Progress ${Math.round((progress / orgCount) * 100)} %`
      );
      console.log(`Replacing for organization ${organization.name}: ${organization.id}`);

      const tjDbDataSources = await entityManager
        .createQueryBuilder(DataSource, 'data_sources')
        .select(['data_sources.id', 'data_sources.appVersionId', 'apps.id', 'apps.name'])
        .innerJoin('data_sources.appVersion', 'app_versions')
        .innerJoin('app_versions.app', 'apps', 'apps.organizationId = :organizationId', {
          organizationId: organization.id,
        })
        .where('data_sources.kind = :kind', { kind: 'tooljetdb' })
        .getRawMany();

      const tjDbDataSourcesCount = tjDbDataSources.length;
      console.log(`TjDb datasources: ${tjDbDataSourcesCount}`);

      for (const tjDbSource of tjDbDataSources) {
        console.log(`App ${tjDbSource.apps_name}: ${tjDbSource.apps_id}`);
        const dataQueriesToReplaceWithIds = await entityManager.find(DataQuery, {
          where: { dataSourceId: tjDbSource.data_sources_id },
          select: ['id', 'options'],
        });
        console.log(`TjDb dataqueries: ${dataQueriesToReplaceWithIds.length}`);

        for (const dataQuery of dataQueriesToReplaceWithIds) {
          const options = dataQuery.options;
          const { table_name: tableName } = options;

          const internalTable = await entityManager.findOne(InternalTable, {
            where: { organizationId: organization.id, tableName },
            select: ['id', 'tableName'],
          });

          // There was a bug wherein if the table name had changed, the name in app definition
          // will not be changed. So there could be occurences where table with the name on
          // app definition won't be found. In such cases we don't make any change for that
          // query. User will have to explicitly link the table again for that query in the
          // editor after this migration is run.
          if (isEmpty(internalTable)) continue;

          dataQuery.options = { ...options, table_id: internalTable.id };
          await dataQuery.save();
        }
      }

      progress++;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
