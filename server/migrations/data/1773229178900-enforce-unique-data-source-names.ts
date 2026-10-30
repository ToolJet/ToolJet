import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueDataSourceNames1773229178900 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    const duplicateGroups = await manager.query(`
      SELECT
        LOWER(name) as lower_name,
        organization_id
      FROM data_sources
      GROUP BY LOWER(name), organization_id
      HAVING COUNT(*) > 1
    `);

    for (const { lower_name, organization_id } of duplicateGroups) {
      const records = await manager.query(
        `
        SELECT id, name
        FROM data_sources
        WHERE LOWER(name) = $1
          AND organization_id = $2
        ORDER BY created_at ASC
      `,
        [lower_name, organization_id]
      );

      if (records.length <= 1) continue;

      for (let i = 1; i < records.length; i++) {
        const record = records[i];
        const baseName = record.name.replace(/_\d+$/, '');
        let counter = 2;

        while (true) {
          const candidate = `${baseName}_${counter}`;

          const exists = await manager.query(
            `
            SELECT 1
            FROM data_sources
            WHERE LOWER(name) = LOWER($1)
              AND organization_id = $2
            LIMIT 1
          `,
            [candidate, organization_id]
          );

          if (!exists.length) {
            await manager.query(
              `
              UPDATE data_sources
              SET name = $1, updated_at = now()
              WHERE id = $2
            `,
              [candidate, record.id]
            );
            break;
          }

          counter++;
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
