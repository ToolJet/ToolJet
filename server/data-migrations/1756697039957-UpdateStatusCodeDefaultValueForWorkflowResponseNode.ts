import { MigrationInterface, QueryRunner } from 'typeorm';
import { APP_TYPES } from '@modules/apps/constants';

export class UpdateStatusCodeDefaultValueForWorkflowResponseNode1756697039957 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const workflowApps = await queryRunner.query(`SELECT id FROM apps WHERE type = $1`, [APP_TYPES.WORKFLOW]);

    if (workflowApps.length === 0) return;

    const appVersionIds = workflowApps.map((app) => app.id);
    const appVersions = await queryRunner.query(`SELECT id, definition FROM app_versions WHERE app_id = ANY($1)`, [
      appVersionIds,
    ]);

    for (const appVersion of appVersions) {
      const definition = appVersion.definition;

      if (!definition || !definition.nodes) continue;

      let hasChanges = false;
      const updatedNodes = definition.nodes.map((node) => {
        if (node.data && node.data.nodeType === 'response') {
          if (!node.data.statusCode) {
            node.data.statusCode = {
              fxActive: false,
              value: '201',
            };
            hasChanges = true;
          }
        }
        return node;
      });

      if (hasChanges) {
        const updatedDefinition = {
          ...definition,
          nodes: updatedNodes,
        };

        await queryRunner.query(`UPDATE app_versions SET definition = $1 WHERE id = $2`, [
          JSON.stringify(updatedDefinition),
          appVersion.id,
        ]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
