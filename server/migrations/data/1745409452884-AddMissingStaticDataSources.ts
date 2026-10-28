import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingStaticDataSources1745409452884 implements MigrationInterface {
  private requiredDataSourceKinds = ['restapi', 'runjs', 'runpy', 'tooljetdb', 'workflows'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all organization IDs
    const organizationsResult = await queryRunner.query(`SELECT id FROM organizations`);
    const organizationIds = organizationsResult.map((row) => row.id);

    console.log(`Found ${organizationIds.length} organizations to validate`);

    // Process each organization
    for (const orgId of organizationIds) {
      console.log(`Processing organization: ${orgId}`);

      // Get existing static data source kinds for this organization
      const existingDataSourcesResult = await queryRunner.query(
        `
                SELECT DISTINCT kind 
                FROM data_sources 
                WHERE type = 'static' AND scope = 'global' AND organization_id = $1
            `,
        [orgId]
      );

      const existingKinds = existingDataSourcesResult.map((row) => row.kind);
      console.log(`Found existing data source kinds: ${existingKinds.join(', ') || 'none'}`);

      // Find missing kinds
      const missingKinds = this.requiredDataSourceKinds.filter((kind) => !existingKinds.includes(kind));

      if (missingKinds.length === 0) {
        console.log(`Organization ${orgId} has all required data source kinds`);
        continue;
      }

      console.log(`Missing data source kinds for organization ${orgId}: ${missingKinds.join(', ')}`);

      // Add missing data sources
      for (const kind of missingKinds) {
        const name = this.getDefaultNameForKind(kind);

        const dataSourceResult = await queryRunner.query(
          `
          INSERT INTO data_sources (
              name, kind, type, scope, organization_id, created_at, updated_at
          ) VALUES (
              $1, $2, 'static', 'global', $3, NOW(), NOW()
          ) RETURNING id
          `,
          [name, kind, orgId]
        );

        const dataSourceId = dataSourceResult[0].id;

        const envResult = await queryRunner.query(`SELECT id FROM app_environments WHERE organization_id = $1`, [
          orgId,
        ]);
        const envIds = envResult.map((row) => row.id);

        for (const envId of envIds) {
          await queryRunner.query(
            `
            INSERT INTO data_source_options (
                data_source_id, environment_id, created_at, updated_at
            ) VALUES (
                $1, $2, NOW(), NOW()
            )
            `,
            [dataSourceId, envId]
          );
        }

        console.log(`Added new data source: ${kind} for organization ${orgId}`);
      }
    }

    console.log('Data source validation and addition complete.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a data addition migration that adds missing required data sources
    console.log(`
            NOTE: Down migration is not implemented for data source validation.
            This migration adds missing required data sources to organizations.
            If needed, you could delete data sources by kind and organization manually.
        `);
  }

  // Helper function to get default names for data source kinds
  private getDefaultNameForKind(kind: string): string {
    const nameMap: Record<string, string> = {
      restapi: 'restapidefault',
      runjs: 'runjsdefault',
      runpy: 'runpydefault',
      tooljetdb: 'tooljetdbdefault',
      workflows: 'workflowsdefault',
    };

    return nameMap[kind] || `${kind}default`;
  }
}
