import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { dbTransactionWrap } from '@helpers/database.helper';
import { APP_TYPES } from '@modules/apps/constants';

export class UpdateStatusCodeDefaultValueForWorkflowResponseNode1756697039957 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const totalRecords = await entityManager.query(
      `
        SELECT COUNT(*) 
        FROM app_versions av
        JOIN apps a ON av.app_id = a.id
        WHERE a.type = $1
      `,
      [APP_TYPES.WORKFLOW]
    );

    const totalCount = parseInt(totalRecords[0].count);
    if (totalCount === 0) {
      console.log('No workflow app versions found to update.');
      return;
    }

    await this.updateWorkflowResponseNodes(entityManager, totalCount);
  }

  private async updateWorkflowResponseNodes(entityManager: EntityManager, totalCount: number): Promise<void> {
    return dbTransactionWrap(async (entityManager: EntityManager) => {
      const migrationProgress = new MigrationProgress(
        'UpdateStatusCodeDefaultValueForWorkflowResponseNode1756697039957',
        totalCount
      );
      const batchSize = 100;

      const fetchAppVersionsInBatches = async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.query(
          `
          SELECT av.id, av.definition
          FROM app_versions av
          JOIN apps a ON av.app_id = a.id
          WHERE a.type = $1
          ORDER BY av.id
          LIMIT $2 OFFSET $3
          `,
          [APP_TYPES.WORKFLOW, take, skip]
        );
      };

      const processAppVersionsBatch = async (entityManager: EntityManager, appVersions: any[]) => {
        for (const appVersion of appVersions) {
          const definition = appVersion.definition;

          if (!definition || !definition.nodes) {
            migrationProgress.show();
            continue;
          }

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

            await entityManager.query(
              `
              UPDATE app_versions
              SET definition = $1
              WHERE id = $2
              `,
              [JSON.stringify(updatedDefinition), appVersion.id]
            );
          }

          migrationProgress.show();
        }
      };

      await processDataInBatches(entityManager, fetchAppVersionsInBatches, processAppVersionsBatch, batchSize);
    }, entityManager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
