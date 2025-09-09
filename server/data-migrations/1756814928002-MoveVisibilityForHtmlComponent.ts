import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class MoveVisibilityForHtmlComponent1756814928002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager) => {
        // Get component IDs that need to be updated
        const result = await entityManager.query(
          `
          SELECT id FROM components 
          WHERE type = 'Html' 
            AND styles->>'visibility' IS NOT NULL
          ORDER BY created_at ASC
          LIMIT $1
        `,
          [batchSize]
        );
        return result;
      },
      async (entityManager: EntityManager, components: any[]) => {
        if (components.length === 0) return;

        const componentIds = components.map((c) => c.id);

        // Move visibility from styles to properties using raw SQL
        await entityManager.query(
          `
          UPDATE components 
          SET 
            properties = jsonb_set(
              properties::jsonb, 
              '{visibility}', 
              (styles->'visibility')::jsonb
            ),
            styles = (styles::jsonb - 'visibility')::json
          WHERE 
            id = ANY($1)
            AND type = 'Html' 
            AND styles->>'visibility' IS NOT NULL
        `,
          [componentIds]
        );
      },
      batchSize
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager) => {
        // Get component IDs that need to be rolled back
        const result = await entityManager.query(
          `
          SELECT id FROM components 
          WHERE type = 'Html' 
            AND properties->>'visibility' IS NOT NULL
          ORDER BY created_at ASC
          LIMIT $1
        `,
          [batchSize]
        );
        return result;
      },
      async (entityManager: EntityManager, components: any[]) => {
        if (components.length === 0) return;

        const componentIds = components.map((c) => c.id);

        // Rollback: Move visibility from properties back to styles using raw SQL
        await entityManager.query(
          `
          UPDATE components 
          SET 
            styles = jsonb_set(
              styles::jsonb, 
              '{visibility}', 
              (properties->'visibility')::jsonb
            )::json,
            properties = (properties::jsonb - 'visibility')::json
          WHERE 
            id = ANY($1)
            AND type = 'Html' 
            AND properties->>'visibility' IS NOT NULL
        `,
          [componentIds]
        );
      },
      batchSize
    );
  }
}
