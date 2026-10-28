/** @group database */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { MIGRATION_AUTHORING_RULES_CUTOFF } from 'src/migration-helpers/migration-mode';
import * as frozenPreCutoff from './pre-cutoff-migrations.json';

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

const DROP_WITHOUT_IF_EXISTS =
  /\bDROP\s+(?:TABLE|COLUMN|CONSTRAINT|INDEX(?:\s+CONCURRENTLY)?|TRIGGER|FUNCTION|TYPE|VIEW|SEQUENCE)\s+(?!IF\s+EXISTS\b)/i;

/**
 * Contract runs after writes reopen, one short transaction per step, so up() goes through
 * withShortLock / setNotNull, never queryRunner directly, and every step is safe to run twice.
 */
/** Class names in every phase folder. */
function migrationClassNames(): Set<string> {
  return new Set(
    ['expand', 'backfill', 'contract'].flatMap((phase) =>
      readdirSync(join(SERVER_ROOT, 'migrations', phase))
        .filter((name) => name.endsWith('.ts'))
        .map((name) => readFileSync(join(SERVER_ROOT, 'migrations', phase, name), 'utf8').match(/class\s+(\w+)/)?.[1])
        .filter((name): name is string => !!name)
    )
  );
}

function contractViolations({ file, text }: MigrationSource, knownMigrations: ReadonlySet<string>): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const cls = migrationClass(source);
  if (!cls) return [`${file}: no migration class found. ${RULES_DOC}`];
  const violations: string[] = [];

  const optsOut = cls.members.some(
    (member) =>
      ts.isPropertyDeclaration(member) &&
      member.name.getText() === 'transaction' &&
      member.initializer?.kind === ts.SyntaxKind.FalseKeyword
  );
  if (!optsOut) violations.push(`${file}: declare transaction = false; each step commits on its own. ${RULES_DOC}`);

  const up = method(cls, 'up');
  const runner = up?.parameters[0]?.name.getText();
  const direct: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText() === runner
    ) {
      direct.push(node.expression.name.text);
    }
    ts.forEachChild(node, visit);
  };
  if (up?.body) visit(up.body);
  if (direct.length) {
    violations.push(
      `${file}: up() calls ${runner}.${direct.join(`, ${runner}.`)}; use withShortLock or setNotNull. ${RULES_DOC}`
    );
  }
  if (up?.body && DROP_WITHOUT_IF_EXISTS.test(codeIn(up.body).sql)) {
    violations.push(
      `${file}: every DROP in up() needs IF EXISTS, so a rerun after a partial run succeeds. ${RULES_DOC}`
    );
  }

  const requires = cls.members.find(
    (member): member is ts.PropertyDeclaration =>
      ts.isPropertyDeclaration(member) && member.name.getText() === 'requires'
  )?.initializer;
  const required = requires && ts.isStringLiteralLike(requires) ? requires.text : undefined;
  if (!required || !knownMigrations.has(required)) {
    violations.push(
      `${file}: requires must name the migration of the release that stopped using what this removes` +
        `${required ? ` (no migration ${required})` : ''}. ${RULES_DOC}`
    );
  }

  const down = method(cls, 'down');
  if (!down?.body || !down.body.getText().slice(1, -1).trim()) {
    violations.push(`${file}: down() is missing or empty; undo up() or comment why it cannot be undone. ${RULES_DOC}`);
  }
  return violations;
}

/** Phase rules below apply from here: the newest migration when they were added. */
const PHASE_RULES_FROM = 1793100000000;

type Rule = [string, RegExp];
const EXPAND_DATA_CHANGES: Rule[] = [
  ['UPDATE … SET', /\bUPDATE\s+\S+\s+SET\b/i],
  ['DELETE FROM', /\bDELETE\s+FROM\b/i],
  ['INSERT … SELECT', /\bINSERT\s+INTO\b[^;]*\bSELECT\b/i],
];
/** Long or exclusive locks; in a backfill they would block readers for the whole run. */
const BACKFILL_FORBIDDEN: Rule[] = [
  ['DROP', /\bDROP\s+(?:TABLE|COLUMN|CONSTRAINT|INDEX|TRIGGER|FUNCTION|TYPE|VIEW|SEQUENCE)\b/i],
  ['SET NOT NULL', /\bSET\s+NOT\s+NULL\b/i],
  // ACCESS EXCLUSIVE even NOT VALID.
  ['CHECK constraint', /\bADD\s+(?:CONSTRAINT\s+\S+\s+)?CHECK\b/i],
  ['ADD CONSTRAINT without NOT VALID', /\bADD\s+(?:CONSTRAINT|CHECK|UNIQUE|FOREIGN\s+KEY)\b(?![^,;]*\bNOT\s+VALID\b)/i],
  ['ALTER COLUMN or RENAME', /\bALTER\s+TABLE\b[^;]*\b(?:ALTER\s+COLUMN|RENAME)\b/i],
  ['LOCK TABLE', /\bLOCK\s+TABLE\b/i],
  ['TRUNCATE', /\bTRUNCATE\b/i],
  ['REINDEX', /\bREINDEX\b/i],
  ['CLUSTER', /\bCLUSTER\b/i],
  ['VACUUM FULL', /\bVACUUM\s+FULL\b/i],
  ['ALTER INDEX', /\bALTER\s+INDEX\b/i],
  ['ALTER TRIGGER', /\bALTER\s+TRIGGER\b/i],
];
/** Short locks, so they belong in beforeCommit(), which runs just before commit. */
const BEFORE_COMMIT_ONLY: Rule[] = [
  ['CREATE INDEX', /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b/i],
  ['CREATE TRIGGER', /\bCREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\b/i],
  ['foreign key NOT VALID', /\bFOREIGN\s+KEY\b[^;]*\bNOT\s+VALID\b/i],
  ['VALIDATE CONSTRAINT', /\bVALIDATE\s+CONSTRAINT\b/i],
];
const SCHEMA_API = new Set([
  ...DESTRUCTIVE_API,
  'createTable',
  'addColumn',
  'addColumns',
  'createIndex',
  'createIndices',
  'dropIndex',
]);

const matching = (rules: Rule[], sql: string) =>
  rules.filter(([, pattern]) => pattern.test(sql)).map(([label]) => label);

/** Index builds lock writes on the table; fine only on a table the same up() creates. */
function indexesOnExistingTables(sql: string): string[] {
  const created = new Set(
    [...sql.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi)].map(([, t]) => t)
  );
  return [...sql.matchAll(/\bCREATE\s+(?:UNIQUE\s+)?INDEX\b(?!\s+CONCURRENTLY)[^;]*?\bON\s+"?(\w+)"?/gi)]
    .map(([, table]) => table)
    .filter((table) => !created.has(table))
    .map((table) => `CREATE INDEX on existing table ${table}`);
}

/** Expand adds only and changes no rows; backfill keeps lock-taking statements to beforeCommit(). */
function phaseViolations(phase: 'expand' | 'backfill', { file, text }: MigrationSource): string[] {
  if (OPT_OUT.test(text)) return [];
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const cls = migrationClass(source);
  const up = cls && method(cls, 'up');
  if (!up?.body) return [];
  const { sql, identifiers } = codeIn(up.body);
  if (phase === 'expand') {
    const found = [...matching(EXPAND_DATA_CHANGES, sql), ...indexesOnExistingTables(sql)];
    return found.length
      ? [`${file}: expand changes rows or locks a table (${found.join(', ')}); move it to backfill. ${RULES_DOC}`]
      : [];
  }
  const beforeCommit = method(cls, 'beforeCommit');
  const beforeCommitCode = beforeCommit?.body ? codeIn(beforeCommit.body) : { sql: '', identifiers: new Set<string>() };
  const violations: string[] = [];
  const forbidden = [
    ...matching(BACKFILL_FORBIDDEN, `${sql} ${beforeCommitCode.sql}`),
    ...[...identifiers, ...beforeCommitCode.identifiers].filter((name) => SCHEMA_API.has(name)),
  ];
  if (forbidden.length) {
    violations.push(`${file}: backfill holds a long lock (${forbidden.join(', ')}); move it to contract. ${RULES_DOC}`);
  }
  const beforeCommitOnly = matching(BEFORE_COMMIT_ONLY, sql);
  if (beforeCommitOnly.length) violations.push(`${file}: ${beforeCommitOnly.join(', ')} in up(); move it to beforeCommit(). ${RULES_DOC}`);
  return violations;
}

const newerThanPhaseRules = (sources: MigrationSource[]) =>
  sources.filter(({ text }) => Number(text.match(/class\s+\w*?(\d{13})\b/)?.[1]) > PHASE_RULES_FROM);

function migrationsNewerThanCutoff(directory: string): MigrationSource[] {
  return readdirSync(join(SERVER_ROOT, directory))
    .filter((name) => name.endsWith('.ts') && !name.includes('LockMigrationsTable'))
    .map((name) => ({ file: `${directory}/${name}`, text: readFileSync(join(SERVER_ROOT, directory, name), 'utf8') }))
    .filter(({ text }) => {
      const [, timestamp] = text.match(/class\s+\w*?(\d{13})\b/) ?? [];
      return Number(timestamp) > MIGRATION_AUTHORING_RULES_CUTOFF;
    });
}

/** Class names at or before the cutoff, which TypeORM records in `migrations`. */
function preCutoffMigrations(directory: string): string[] {
  return readdirSync(join(SERVER_ROOT, directory))
    .filter((name) => name.endsWith('.ts') && !name.includes('LockMigrationsTable'))
    .map((name) => readFileSync(join(SERVER_ROOT, directory, name), 'utf8').match(/class\s+(\w*?\d{13})\b/)?.[1])
    .filter((name): name is string => !!name && Number(name.slice(-13)) <= MIGRATION_AUTHORING_RULES_CUTOFF)
    .sort();
}

/** Names on one side only: `added` were back-dated past the cutoff, `missing` were removed or renamed. */
function frozenListDrift(frozen: string[], current: string[]): { added: string[]; missing: string[] } {
  return {
    added: current.filter((name) => !frozen.includes(name)),
    missing: frozen.filter((name) => !current.includes(name)),
  };
}

const sample = (up: string, down = '// irreversible: values only grow', header = '') => ({
  file: 'migrations/expand/1799999999999-Sample.ts',
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
    const violations = migrationsNewerThanCutoff('migrations/expand').flatMap((source) => authoringViolations(source));
    expect(violations).toEqual([]);
  });

  it('should keep data migrations additive and reversible', () => {
    const violations = migrationsNewerThanCutoff('migrations/backfill').flatMap((source) =>
      authoringViolations(source)
    );
    expect(violations).toEqual([]);
  });
});

describe('Migration authoring rules | expand and backfill placement', () => {
  const migration = (up: string, beforeCommit = '') => ({
    file: 'migrations/backfill/1799999999999-Sample.ts',
    text: `
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  ${beforeCommit ? `public async beforeCommit(queryRunner: QueryRunner): Promise<void> { ${beforeCommit} }` : ''}
  public async down(): Promise<void> { /* rows only */ }
}`,
  });

  it.each([
    ['an UPDATE', 'await queryRunner.query(`UPDATE apps SET slug = name`);', 'UPDATE … SET'],
    [
      'an index on an existing table',
      'await queryRunner.query(`CREATE INDEX apps_slug ON apps (slug)`);',
      'existing table apps',
    ],
  ])('should flag expand that runs %s', (_what, up, label) => {
    expect(phaseViolations('expand', migration(up))).toEqual([expect.stringContaining(label)]);
  });

  it('should pass expand that creates a table and indexes it', () => {
    const up = 'await queryRunner.query(`CREATE TABLE gadgets (id int); CREATE INDEX gadgets_id ON gadgets (id)`);';
    expect(phaseViolations('expand', migration(up))).toEqual([]);
  });

  it('should pass a backfill that adds a foreign key NOT VALID and validates it in beforeCommit()', () => {
    const source = migration(
      'await queryRunner.query(`UPDATE apps SET owner_id = created_by`);',
      'await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT fk FOREIGN KEY (owner_id) REFERENCES users(id) NOT VALID`); await queryRunner.query(`ALTER TABLE apps VALIDATE CONSTRAINT fk`);'
    );
    expect(phaseViolations('backfill', source)).toEqual([]);
  });

  it('should pass a backfill that updates rows and builds its index in beforeCommit()', () => {
    const source = migration(
      'await queryRunner.query(`UPDATE apps SET slug = name`);',
      'await queryRunner.query(`CREATE INDEX apps_slug ON apps (slug)`);'
    );
    expect(phaseViolations('backfill', source)).toEqual([]);
  });

  it.each([
    [
      'an index build in up()',
      'await queryRunner.query(`CREATE INDEX apps_slug ON apps (slug)`);',
      'move it to beforeCommit()',
    ],
    ['a DROP', 'await queryRunner.query(`ALTER TABLE apps DROP COLUMN slug`);', 'move it to contract'],
    [
      'a constraint without NOT VALID',
      'await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT c CHECK (true)`);',
      'ADD CONSTRAINT without NOT VALID',
    ],
    ['the TypeORM schema API', "await queryRunner.addColumn('apps', column);", 'addColumn'],
    [
      'a CHECK, even NOT VALID',
      'await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT c CHECK (slug IS NOT NULL) NOT VALID`);',
      'CHECK constraint',
    ],
  ])('should flag a backfill with %s', (_what, up, message) => {
    expect(phaseViolations('backfill', migration(up))).toEqual([expect.stringContaining(message)]);
  });

  it.each(['expand', 'backfill'] as const)('should keep new %s migrations in their phase', (phase) => {
    const sources = newerThanPhaseRules(migrationsNewerThanCutoff(`migrations/${phase}`));
    expect(sources.flatMap((source) => phaseViolations(phase, source))).toEqual([]);
  });
});

describe('Migration authoring rules | contract migrations', () => {
  const contract = (
    up: string,
    header = "transaction = false; requires = 'StopReadingSlug1799999999998';",
    down = '// re-adding the column restores nothing'
  ) => ({
    file: 'migrations/contract/1799999999999-Sample.ts',
    text: `
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  ${header}
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  public async down(queryRunner: QueryRunner): Promise<void> { ${down} }
}`,
  });
  const shortDrop = "await withShortLock(queryRunner, ['ALTER TABLE apps DROP COLUMN IF EXISTS slug']);";
  const known = new Set(['StopReadingSlug1799999999998']);

  it('should pass a step that goes through withShortLock', () => {
    expect(contractViolations(contract(shortDrop), known)).toEqual([]);
  });

  it.each([
    [
      'runs inside a transaction',
      contract(shortDrop, "requires = 'StopReadingSlug1799999999998';"),
      'declare transaction = false',
    ],
    ['names no requires', contract(shortDrop, 'transaction = false;'), 'requires must name'],
    [
      'requires an unknown migration',
      contract(shortDrop, "transaction = false; requires = 'Nope1799999999997';"),
      'no migration Nope1799999999997',
    ],
    [
      'calls queryRunner directly',
      contract('await queryRunner.query(`ALTER TABLE apps DROP COLUMN IF EXISTS slug`);'),
      'up() calls queryRunner.query',
    ],
    [
      'drops without IF EXISTS',
      contract("await withShortLock(queryRunner, ['ALTER TABLE apps DROP COLUMN slug']);"),
      'needs IF EXISTS',
    ],
    [
      'has an empty down()',
      contract(shortDrop, "transaction = false; requires = 'StopReadingSlug1799999999998';", ''),
      'down() is missing or empty',
    ],
  ])('should flag a contract migration that %s', (_how, source, message) => {
    expect(contractViolations(source, known)).toEqual([expect.stringContaining(message)]);
  });

  it('should keep contract migrations to short, rerunnable steps', () => {
    const known = migrationClassNames();
    const violations = readdirSync(join(SERVER_ROOT, 'migrations/contract'))
      .filter((name) => name.endsWith('.ts'))
      .map((name) => ({
        file: `migrations/contract/${name}`,
        text: readFileSync(join(SERVER_ROOT, 'migrations/contract', name), 'utf8'),
      }))
      .flatMap((source) => contractViolations(source, known));
    expect(violations).toEqual([]);
  });
});

/**
 * Migrations at or before the cutoff skip the rules above, so the list is frozen. A new migration
 * dated before the cutoff would skip them silently. Use a current timestamp instead.
 */
describe('Migration authoring rules | migrations at or before the cutoff', () => {
  it('should report back-dated and removed names', () => {
    expect(frozenListDrift(['A1', 'B2'], ['A1', 'C3'])).toEqual({ added: ['C3'], missing: ['B2'] });
  });

  it.each(['migrations/expand', 'migrations/backfill'] as const)('should keep the %s list frozen', (directory) => {
    expect(frozenListDrift(frozenPreCutoff[directory], preCutoffMigrations(directory))).toEqual({
      added: [],
      missing: [],
    });
  });
});

/** TypeORM only loads the phase folders, so a file anywhere else would never run. */
describe('Migration authoring rules | phase folders', () => {
  const PHASE_FOLDERS = ['expand', 'backfill', 'contract'];

  it('should keep every migration inside a phase folder', () => {
    expect(readdirSync(join(SERVER_ROOT, 'migrations')).sort()).toEqual([...PHASE_FOLDERS].sort());
    const oldFolder = join(SERVER_ROOT, 'data-migrations');
    expect(existsSync(oldFolder) ? readdirSync(oldFolder) : []).toEqual([]);
  });

  it('should give each migration newer than the cutoff one phase', () => {
    const classes = PHASE_FOLDERS.flatMap((phase) =>
      migrationsNewerThanCutoff(`migrations/${phase}`).map(({ text }) => text.match(/class\s+(\w+)/)?.[1])
    );
    expect(classes.filter((name, index) => classes.indexOf(name) !== index)).toEqual([]);
  });
});
