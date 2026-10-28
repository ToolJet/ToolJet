/**
 * Covers: migration-helpers/enum-value-additions.ts
 * @group database
 */
import { Migration } from 'typeorm';
import { bareTypeName, extractEnumValueAdditions } from 'src/migration-helpers/enum-value-additions';

// Builds a Migration-shaped stub whose up().toString() contains `sql` as a literal,
// mimicking how real migrations embed SQL and how extractEnumValueAdditions reads it
// via Function.prototype.toString(). We override toString directly so the SQL lands in
// the source text verbatim (a closure variable would only show up as `${sql}`).
function migrationWithUpSql(name: string, sql: string): Migration {
  const up = (async () => undefined) as (...args: unknown[]) => Promise<unknown>;
  up.toString = () => `async up(queryRunner) { await queryRunner.query(\`${sql}\`); }`;
  return { name, instance: { up, down: async () => undefined } } as unknown as Migration;
}

describe('migration-helpers/enum-value-additions', () => {
  describe('bareTypeName(): the type name without quotes or schema', () => {
    it('should strip the quotes and the schema name from the type name', () => {
      expect(bareTypeName('source')).toBe('source');
      expect(bareTypeName('"resource_type"')).toBe('resource_type');
      expect(bareTypeName('"public"."resource_type"')).toBe('resource_type');
    });
  });

  describe('extractEnumValueAdditions(): finding the enum values a migration adds, so they can be saved before it runs', () => {
    // One case per real migration SQL form shipped in server/migrations, so a future
    // regex tweak that stops matching any variant fails here.
    it.each([
      [`ALTER TYPE source ADD VALUE 'openid'`, 'source', 'openid'],
      [`ALTER TYPE "page_type_enum" ADD VALUE 'custom';`, 'page_type_enum', 'custom'],
      [`ALTER TYPE "git_type" ADD VALUE 'gitlab';`, 'git_type', 'gitlab'],
      [`ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'folder';`, 'resource_type', 'folder'],
      [`ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'workflow';`, 'resource_type', 'workflow'],
      [`ALTER TYPE "app_type" ADD VALUE IF NOT EXISTS 'module';`, 'app_type', 'module'],
      [
        `ALTER TYPE "public"."resource_type" ADD VALUE IF NOT EXISTS 'workflow_folder';`,
        'resource_type',
        'workflow_folder',
      ],
    ])('should find the added value in %s', (sql, typeName, value) => {
      const [addition, ...rest] = extractEnumValueAdditions([migrationWithUpSql('M1', sql)]);
      expect(rest).toHaveLength(0);
      expect(addition).toMatchObject({ typeName, value, migrationName: 'M1' });
    });

    it('should keep the type name exactly as written, schema included, for the ALTER TYPE statement', () => {
      const [addition] = extractEnumValueAdditions([
        migrationWithUpSql('M1', `ALTER TYPE "public"."resource_type" ADD VALUE IF NOT EXISTS 'workflow_folder'`),
      ]);
      expect(addition.typeExpression).toBe('"public"."resource_type"');
    });

    it('should find every value when one migration adds several', () => {
      const sql = `
        ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'workflow';
        ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'workflow_folder';
      `;
      expect(extractEnumValueAdditions([migrationWithUpSql('M1', sql)])).toMatchObject([
        { value: 'workflow' },
        { value: 'workflow_folder' },
      ]);
    });

    it('should ignore CREATE TYPE, since only values added to an existing type are saved ahead', () => {
      const sql = `CREATE TYPE "app_type" AS ENUM ('front-end', 'workflow');`;
      expect(extractEnumValueAdditions([migrationWithUpSql('M1', sql)])).toEqual([]);
    });

    it('should skip a migration that has no up()', () => {
      const noUp = { name: 'M1', instance: undefined } as unknown as Migration;
      expect(extractEnumValueAdditions([noUp])).toEqual([]);
    });

    it('should return nothing for a migration that touches no enum', () => {
      const sql = `ALTER TABLE "permission_groups" ADD COLUMN "workflow_folder_create" boolean NOT NULL DEFAULT false;`;
      expect(extractEnumValueAdditions([migrationWithUpSql('M1', sql)])).toEqual([]);
    });
  });
});
