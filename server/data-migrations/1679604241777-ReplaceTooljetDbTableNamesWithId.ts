import { AppVersion } from "src/entities/app_version.entity";
import { DataSource } from "src/entities/data_source.entity";
import { MigrationInterface, QueryRunner } from "typeorm";
import { isEmpty } from 'lodash';
import { InternalTable } from "src/entities/internal_table.entity";
import { Organization } from "src/entities/organization.entity";
import { App } from "src/entities/app.entity";

export class ReplaceTooljetDbTableNamesWithId1679604241777 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let progress = 0;
    const entityManager = queryRunner.manager;
    const organizations = await entityManager.find(Organization, { select: ["id"] })
    const orgCount = organizations.length
    console.log(`Total Organizations: ${orgCount}`)

    for (const organization of organizations) {
      console.log(`ReplaceTooljetDbTableNamesWithId1679604241777 Progress ${Math.round((progress / orgCount) * 100)} %`)
      console.log(`Replacing for organization ${organization.name}: ${organization.id}`)

      const [tjDbDataSources, tjdbSourcesCount] = await entityManager.createQueryBuilder(DataSource, 'data_sources')
        .select(['data_sources.id', 'data_sources.appVersionId'])
        .innerJoin('data_sources.appVersion', 'app_versions')
        .innerJoinAndSelect('app_versions.app', 'apps', 'apps.organizationId = :organizationId', { organizationId: organization.id, select: ['apps.id', 'apps.name'] })
        .where("data_sources.kind = :kind", { kind: 'tooljetdb' })
        .getManyAndCount();

      console.log(`TJDb sources: ${tjdbSourcesCount}`)
      console.log(tjDbDataSources)

      for (const tjDbSource of tjDbDataSources) {
        const appVersionsWithTjDb = await entityManager.find(
          AppVersion, { select: ['id', 'definition'], where: { id: tjDbSource.appVersionId } })


        console.log({ appVersionsWithTjDb })

        for (const appVersion of appVersionsWithTjDb) {
          let appDefinition = appVersion.definition?.appV2 || appVersion.definition
          console.log({ appDefinition })
          if (isEmpty(appDefinition)) continue
          if (isEmpty(appDefinition?.dataQueries)) continue

          let appDataQueries = appDefinition.dataQueries
          console.log({ appDataQueries })
          const replacedAppDataQueries = []

          const uniqTableNames = Array.from(new Set(appDataQueries.find(x => x.options.table_name)))
          const internalTablesUsedInAppDef = await entityManager.find(InternalTable, { where: { tableName: uniqTableNames, organizationId: tjDbSource.organizationId } })

          console.log({ uniqTableNames })
          for (const appDataQuery of appDataQueries) {
            const tableName = appDataQuery.options.table_name
            const internalTableWithTableName = internalTablesUsedInAppDef.find(x => x.tableName === tableName)

            // There was a bug wherein if the table name had changed, the name in app definition
            // will not be changed. So there could be occurences where table with the name on 
            // app definition won't be found. In such cases we don't make any change for that
            // query. User will have to explicitly link the table again for that query in the
            // editor after this migration is run.
            if (isEmpty(internalTableWithTableName)) {
              replacedAppDataQueries.push(appDataQuery)
              console.log('skipped')
              continue
            }

            appDataQuery.options.table_id = internalTableWithTableName.id
            console.log(appDataQuery.options)
            replacedAppDataQueries.push(appDataQuery)
          }

          appVersion.definition = { appV2: appDefinition, ...(appDefinition.tooljetVersion && { tooljetVersion: appDefinition.tooljetVersion }) }
          await appVersion.save();
        }
      }

      progress++;
    }

    throw "error"
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
