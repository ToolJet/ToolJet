import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeprecateLocalStaticDataSourcesb1745318714733 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all organization IDs
    const organizationsResult = await queryRunner.query(`SELECT id FROM organizations`);
    const organizationIds = organizationsResult.map((row) => row.id);

    console.log(`Found ${organizationIds.length} organizations to process`);

    // Process each organization
    for (const orgId of organizationIds) {
      console.log(`Processing organization: ${orgId}`);

      // Get all app_version_ids under this organization
      const appVersionsResult = await queryRunner.query(
        `
            SELECT av.id as app_version_id
            FROM app_versions av
            JOIN apps a ON av.app_id = a.id
            WHERE a.organization_id = $1
        `,
        [orgId]
      );

      const appVersionIds = appVersionsResult.map((row) => row.app_version_id);

      if (appVersionIds.length === 0) {
        console.log(`No app versions found for organization: ${orgId}`);
        continue;
      }

      console.log(`Found ${appVersionIds.length} app versions for organization: ${orgId}`);

      // Get all distinct kinds for static global data sources associated with these app versions
      const kindsResult = await queryRunner.query(
        `
            SELECT DISTINCT kind 
            FROM data_sources 
            WHERE type = 'static' AND scope = 'local' AND app_version_id = ANY($1::uuid[])
        `,
        [appVersionIds]
      );

      const kinds = kindsResult.map((row) => row.kind);

      if (kinds.length === 0) {
        console.log(`No global static data sources found for app versions under organization: ${orgId}`);
        continue;
      }

      console.log(`Found ${kinds.length} different kinds of data sources`);

      // Process each kind of data source
      for (const kind of kinds) {
        console.log(`Processing kind: ${kind}`);

        // Get first data source ID of this kind to keep
        const primaryResult = await queryRunner.query(
          `
                SELECT id 
                FROM data_sources 
                WHERE type = 'static' AND scope = 'local' AND app_version_id = ANY($1::uuid[]) AND kind = $2 
                LIMIT 1
            `,
          [appVersionIds, kind]
        );

        if (primaryResult.length === 0) {
          console.log(`No data sources found for kind: ${kind}`);
          continue;
        }

        const primaryDataSourceId = primaryResult[0].id;

        // Ensure the primary data source has scope set to 'global', app_version_id set to null,
        // and organization_id set to the current organization
        await queryRunner.query(
          `
                UPDATE data_sources
                SET scope = 'global', app_version_id = NULL, organization_id = $1
                WHERE id = $2
            `,
          [orgId, primaryDataSourceId]
        );

        console.log(
          `Updated primary data source ${primaryDataSourceId} scope to 'global', app_version_id to NULL, and organization_id to ${orgId}`
        );

        // Get all other data source IDs of the same kind to be replaced
        const duplicatesResult = await queryRunner.query(
          `
                SELECT id 
                FROM data_sources 
                WHERE type = 'static' AND scope = 'local' AND 
                      app_version_id = ANY($1::uuid[]) AND
                      kind = $2 AND 
                      id != $3
            `,
          [appVersionIds, kind, primaryDataSourceId]
        );

        const duplicateDataSourceIds = duplicatesResult.map((row) => row.id);

        if (duplicateDataSourceIds.length === 0) {
          console.log(`No duplicates found for kind: ${kind}`);
          continue;
        }

        console.log(`Found ${duplicateDataSourceIds.length} duplicate data sources for kind: ${kind}`);
        console.log(`Primary ID: ${primaryDataSourceId}, Duplicates: ${duplicateDataSourceIds.join(', ')}`);

        // Update data_queries to use the primary data source
        const updateResult = await queryRunner.query(
          `
                UPDATE data_queries 
                SET data_source_id = $1 
                WHERE data_source_id = ANY($2::uuid[])
            `,
          [primaryDataSourceId, duplicateDataSourceIds]
        );

        console.log(
          `Updated ${updateResult.length || 'multiple'} data_queries to use primary data source: ${primaryDataSourceId}`
        );

        // Delete the duplicate data sources
        const deleteResult = await queryRunner.query(
          `
                DELETE FROM data_sources 
                WHERE id = ANY($1::uuid[])
            `,
          [duplicateDataSourceIds]
        );

        console.log(`Deleted ${deleteResult.length || duplicateDataSourceIds.length} duplicate data sources`);
      }
    }

    console.log('Data source consolidation complete.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a data consolidation migration and cannot be easily reverted
    console.log(`
            WARNING: No down migration available for data consolidation.
            This migration consolidates duplicate data sources and cannot be automatically reverted.
            Please restore from a backup if needed.
        `);
  }
}
