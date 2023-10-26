import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class AddUniqueAppSlug1698222463379 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    /* Lets check if the constraint is existed or not. 
    Cloud doesn't have the constrain for sure. but this steps only for the developer's machine 
    */
    const query = `
      SELECT conname
      FROM pg_constraint
      WHERE conname = '${DataBaseConstraints.APP_SLUG_UNIQUE}';
    `;
    const result = await queryRunner.query(query);

    if (result && result.length > 0) {
      console.log(`Constraint with name '${DataBaseConstraints.APP_SLUG_UNIQUE}' exists. So skipping the migration`);
    } else {
      console.log(
        `Constraint with name '${DataBaseConstraints.APP_SLUG_UNIQUE}' does not exist. Going to do the data-migration`
      );

      /* Replacing the identical slugs with the app-id but will keep the first row as it is */
      const dataMigrationQuery = `WITH CTE AS (
        SELECT id, slug,
               ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
        FROM apps
      )
      UPDATE apps AS a
      SET slug = CASE
        WHEN a.slug IS NULL OR TRIM(a.slug) = '' THEN a.id::varchar
        ELSE CASE WHEN cte.rn = 1 THEN a.slug ELSE a.id::varchar END
        END
      FROM CTE cte
      WHERE a.id = cte.id;      
        `;
      await queryRunner.query(dataMigrationQuery);

      /* Adding new constraint */
      await queryRunner.createUniqueConstraint(
        'apps',
        new TableUnique({
          name: DataBaseConstraints.APP_SLUG_UNIQUE,
          columnNames: ['slug'],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
