import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class MoveVisibilityForHtmlComponent1756814928003 implements MigrationInterface {
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
            AND (
              styles->>'visibility' IS NOT NULL
              OR general_styles->>'boxShadow' IS NOT NULL
            )
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

        // Move visibility, boxShadow using raw SQL
        await entityManager.query(
          `
          UPDATE components 
          SET 
            properties = 
              CASE 
                WHEN styles->>'visibility' IS NOT NULL THEN jsonb_set(properties::jsonb, '{visibility}', (styles->'visibility')::jsonb)
                ELSE properties::jsonb
              END,
            styles = 
              CASE 
                WHEN general_styles->>'boxShadow' IS NOT NULL THEN jsonb_set(styles::jsonb, '{boxShadow}', (general_styles->'boxShadow')::jsonb)
                ELSE styles::jsonb
              END
              - 'visibility',
            general_styles = (general_styles::jsonb - 'boxShadow')::json
          WHERE 
            id = ANY($1)
            AND type = 'Html' 
            AND (
              styles->>'visibility' IS NOT NULL
              OR general_styles->>'boxShadow' IS NOT NULL
            )
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
            AND (
              properties->>'visibility' IS NOT NULL
              OR styles->>'boxShadow' IS NOT NULL
            )
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

        // Rollback: Move visibility, boxShadow, tooltip back using raw SQL
        await entityManager.query(
          `
          UPDATE components 
          SET 
            styles = 
              CASE 
                WHEN properties->>'visibility' IS NOT NULL THEN jsonb_set(styles::jsonb, '{visibility}', (properties->'visibility')::jsonb)
                ELSE styles::jsonb
              END
              ||
              CASE 
                WHEN styles->>'boxShadow' IS NOT NULL THEN styles::jsonb
                ELSE jsonb_set(styles::jsonb, '{boxShadow}', (properties->'boxShadow')::jsonb)
              END
              - 'boxShadow',
            properties = (properties::jsonb - 'visibility' - 'boxShadow')::json,
            general_styles = (general_styles::jsonb - 'boxShadow')::json
          WHERE 
            id = ANY($1)
            AND type = 'Html' 
            AND (
              properties->>'visibility' IS NOT NULL
              OR styles->>'boxShadow' IS NOT NULL
            )
        `,
          [componentIds]
        );
      },
      batchSize
    );
  }
}
