/** @group database */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { MIGRATION_AUTHORING_RULES_CUTOFF } from 'src/migration-helpers/migration-status';

/**
 * Async mode applies schema migrations at boot, while the previous release still serves.
 * So a migration may only add schema, and every migration needs a way back. Older migrations predate
 * the rules and are not checked; async mode runs them the blocking way.
 */
const SERVER_ROOT = join(__dirname, '../../../..');
const OPT_OUT = /\/\/\s*migration-lint:\s*allow-destructive\s+\S/;
const RULES_DOC = 'Rules: server/AGENTS.md § Migrations.';

const DESTRUCTIVE_SQL: [string, RegExp][] = [
  ['DROP TABLE', /\bDROP\s+TABLE\b/i],
  ['DROP COLUMN', /\bDROP\s+COLUMN\b/i],
  ['RENAME COLUMN', /\bRENAME\s+COLUMN\b/i],
  ['RENAME TO', /\bRENAME\s+TO\b/i],
  ['ALTER COLUMN … TYPE', /\bALTER\s+COLUMN\b[^,;]*?\bTYPE\b/i],
  ['SET NOT NULL', /\bSET\s+NOT\s+NULL\b/i],
  ['DROP TYPE', /\bDROP\s+TYPE\b/i],
  // The previous release's inserts do not set the column.
  ['ADD COLUMN … NOT NULL without DEFAULT', /\bADD\s+COLUMN\b(?![^,;]*\bDEFAULT\b)[^,;]*\bNOT\s+NULL\b/i],
  // On an existing table it rejects the previous release's writes. New table: opt out.
  ['ADD CONSTRAINT', /\bADD\s+(?:CONSTRAINT|UNIQUE|CHECK|FOREIGN\s+KEY|PRIMARY\s+KEY|EXCLUDE)\b/i],
  ['CREATE UNIQUE INDEX', /\bCREATE\s+UNIQUE\s+INDEX\b/i],
];
const DESTRUCTIVE_API = new Set([
  'dropTable',
  'dropColumn',
  'dropColumns',
  'renameColumn',
  'renameTable',
  'changeColumn',
  'changeColumns',
  'createUniqueConstraint',
  'createUniqueConstraints',
  'createCheckConstraint',
  'createCheckConstraints',
  'createForeignKey',
  'createForeignKeys',
  'createExclusionConstraint',
  'createExclusionConstraints',
]);
const UNIQUE_INDEX_API = ['createIndex', 'createIndices'];

interface MigrationSource {
  file: string;
  text: string;
}

function migrationClass(source: ts.SourceFile): ts.ClassDeclaration | undefined {
  return source.statements.find(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) && /\d{13}$/.test(statement.name?.text ?? '')
  );
}

function method(cls: ts.ClassDeclaration, name: string): ts.MethodDeclaration | undefined {
  return cls.members.find(
    (member): member is ts.MethodDeclaration => ts.isMethodDeclaration(member) && member.name.getText() === name
  );
}

/** SQL text and identifiers in a body; comments are left out, so prose about a drop does not count. */
function codeIn(node: ts.Node): { sql: string; identifiers: Set<string> } {
  const sql: string[] = [];
  const identifiers = new Set<string>();
  const visit = (child: ts.Node) => {
    if (ts.isStringLiteralLike(child) || ts.isTemplateLiteralToken(child)) sql.push(child.text);
    if (ts.isIdentifier(child)) identifiers.add(child.text);
    ts.forEachChild(child, visit);
  };
  visit(node);
  return { sql: sql.join(' '), identifiers };
}

function authoringViolations({ file, text }: MigrationSource): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const cls = migrationClass(source);
  if (!cls) return [`${file}: no migration class found. ${RULES_DOC}`];
  const violations: string[] = [];

  const down = method(cls, 'down');
  if (!down?.body || !down.body.getText().slice(1, -1).trim()) {
    violations.push(`${file}: down() is missing or empty; undo up() or comment why it cannot be undone. ${RULES_DOC}`);
  }

  const up = method(cls, 'up');
  if (up?.body && !OPT_OUT.test(text)) {
    const { sql, identifiers } = codeIn(up.body);
    const uniqueIndex = identifiers.has('isUnique') && UNIQUE_INDEX_API.some((name) => identifiers.has(name));
    const found = [
      ...DESTRUCTIVE_SQL.filter(([, pattern]) => pattern.test(sql)).map(([label]) => label),
      ...[...DESTRUCTIVE_API].filter((name) => identifiers.has(name)),
      ...(uniqueIndex ? ['createIndex({ isUnique })'] : []),
    ];
    if (found.length) {
      violations.push(
        `${file}: up() is destructive (${found.join(', ')}); migrations only add schema. Ship it a release later, ` +
          `or add "// migration-lint: allow-destructive <reason>". ${RULES_DOC}`
      );
    }
  }
  return violations;
}

function migrationsNewerThanCutoff(directory: string): MigrationSource[] {
  return readdirSync(join(SERVER_ROOT, directory))
    .filter((name) => name.endsWith('.ts') && !name.includes('LockMigrationsTable'))
    .map((name) => ({ file: `${directory}/${name}`, text: readFileSync(join(SERVER_ROOT, directory, name), 'utf8') }))
    .filter(({ text }) => {
      const [, timestamp] = text.match(/class\s+\w*?(\d{13})\b/) ?? [];
      return Number(timestamp) > MIGRATION_AUTHORING_RULES_CUTOFF;
    });
}

const sample = (up: string, down = '// irreversible: values only grow', header = '') => ({
  file: 'migrations/1799999999999-Sample.ts',
  text: `${header}
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  public async down(queryRunner: QueryRunner): Promise<void> { ${down} }
}`,
});

describe('Migration authoring rules | migrations newer than the cutoff', () => {
  describe('the checker', () => {
    it('should pass an additive migration whose down() only explains itself', () => {
      expect(authoringViolations(sample('await queryRunner.query(`ALTER TABLE apps ADD COLUMN slug text`);'))).toEqual(
        []
      );
    });

    it.each([
      ['raw SQL', 'await queryRunner.query(`ALTER TABLE apps DROP COLUMN slug`);', 'DROP COLUMN'],
      [
        'a type change',
        'await queryRunner.query(\'ALTER TABLE apps ALTER COLUMN "slug" TYPE varchar\');',
        'ALTER COLUMN … TYPE',
      ],
      ['SET NOT NULL', 'await queryRunner.query(`ALTER TABLE apps ALTER COLUMN slug SET NOT NULL`);', 'SET NOT NULL'],
      ['the TypeORM API', "await queryRunner.renameColumn('apps', 'slug', 'handle');", 'renameColumn'],
      [
        'a NOT NULL column without a default',
        'await queryRunner.query(`ALTER TABLE apps ADD COLUMN slug text NOT NULL`);',
        'ADD COLUMN … NOT NULL without DEFAULT',
      ],
      [
        'a constraint',
        "await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT apps_slug_check CHECK (slug <> '')`);",
        'ADD CONSTRAINT',
      ],
      ['an unnamed unique key', 'await queryRunner.query(`ALTER TABLE apps ADD UNIQUE (slug)`);', 'ADD CONSTRAINT'],
      [
        'a unique index',
        'await queryRunner.query(`CREATE UNIQUE INDEX apps_slug ON apps (slug)`);',
        'CREATE UNIQUE INDEX',
      ],
      [
        'the TypeORM foreign key API',
        "await queryRunner.createForeignKey('apps', new TableForeignKey({ columnNames: ['org_id'] }));",
        'createForeignKey',
      ],
      [
        'the TypeORM unique index API',
        "await queryRunner.createIndex('apps', new TableIndex({ columnNames: ['slug'], isUnique: true }));",
        'createIndex({ isUnique })',
      ],
    ])('should flag a destructive up() written with %s', (_how, up, label) => {
      expect(authoringViolations(sample(up))).toEqual([expect.stringContaining(`up() is destructive (${label})`)]);
    });

    it('should pass a NOT NULL column that has a default', () => {
      const up =
        "await queryRunner.query(`ALTER TABLE apps ADD COLUMN slug text NOT NULL DEFAULT '', ADD COLUMN n int`);";
      expect(authoringViolations(sample(up))).toEqual([]);
    });

    it('should not flag destructive SQL in down(), a comment, or a file that opts out', () => {
      const drop = 'await queryRunner.query(`DROP TABLE apps`);';
      expect(authoringViolations(sample('// we used to DROP TABLE here', drop))).toEqual([]);
      expect(
        authoringViolations(sample(drop, undefined, '// migration-lint: allow-destructive table unused since 3.20'))
      ).toEqual([]);
    });

    it('should flag an empty down()', () => {
      expect(authoringViolations(sample('', ''))).toEqual([expect.stringContaining('down() is missing or empty')]);
    });
  });

  it('should keep schema migrations additive and reversible', () => {
    const violations = migrationsNewerThanCutoff('migrations').flatMap((source) => authoringViolations(source));
    expect(violations).toEqual([]);
  });

  it('should keep data migrations additive and reversible', () => {
    const violations = migrationsNewerThanCutoff('data-migrations').flatMap((source) => authoringViolations(source));
    expect(violations).toEqual([]);
  });
});
