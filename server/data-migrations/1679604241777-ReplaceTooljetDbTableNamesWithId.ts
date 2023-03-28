import { AppVersion } from "src/entities/app_version.entity";
import { DataSource } from "src/entities/data_source.entity";
import { MigrationInterface, QueryRunner } from "typeorm";
import { isEmpty } from 'lodash';
import { InternalTable } from "src/entities/internal_table.entity";
import { Organization } from "src/entities/organization.entity";

export class ReplaceTooljetDbTableNamesWithId1679604241777 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let progress = 0;
    const entityManager = queryRunner.manager;
    const organizations = await entityManager.find(Organization, { select: ["id"] })

    for (const organization of organizations) {
      console.log(`ReplaceTooljetDbTableNamesWithId1679604241777 Progress ${Math.round((progress / organizations.length) * 100)} %`)
      console.log(`Replacing for organization ${organization.name}: ${organization.id}`)

      const tjDbdataSources = await entityManager.find(
        DataSource,
        { select: ['appVersionId'], where: { kind: 'tooljetdb', organizationId: organization.id } }
      )

      for (const tjDbSource of tjDbdataSources) {
        const appVersionsWithTjDb = await entityManager.find(
          AppVersion,
          { where: { id: tjDbSource.appVersionId } }
        );

        for (const appVersion of appVersionsWithTjDb) {
          let appDefinition = appVersion.definition?.appV2
          if (isEmpty(appDefinition)) continue
          if (isEmpty(appDefinition?.dataQueries)) continue

          let appDataQueries = appDefinition.dataQueries
          const replacedAppDataQueries = []
          const uniqTableNames = Array.from(new Set(appDataQueries.find(x => x.options.table_name)))
          const internalTablesUsedInAppDef = await entityManager.find(InternalTable, { where: { tableName: uniqTableNames, organizationId: tjDbSource.organizationId } })

          for (const appDataQuery of appDataQueries) {
            const tableName = appDataQuery.options.table_name
            const internalTableWithTableName = internalTablesUsedInAppDef.find(x => x.tableName === tableName)

            // There was a bug wherein if the table name had changed the name in app definition
            // will not be changed. So there could be occurences where table with the name on 
            // app definition won't be found. In such cases we don't make any change for that
            // query. User will have to explicitly link the table again for that query in the
            // editor after this migration is run.
            if (isEmpty(internalTableWithTableName)) {
              replacedAppDataQueries.push(appDataQuery)
              continue
            }

            appDataQuery.options.table_id = internalTableWithTableName.id
            replacedAppDataQueries.push(appDataQuery)
          }

          appVersion.definition = { appV2: appDefinition, ...(appDefinition.tooljetVersion && { tooljetVersion: appDefinition.tooljetVersion }) }
          await appVersion.save();
        }
      }

      progress++;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
