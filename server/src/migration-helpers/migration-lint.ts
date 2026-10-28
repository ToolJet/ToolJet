import * as ts from 'typescript';

/**
 * Static checks on migration source. test/modules/migrations/unit/migration-lint.spec.ts runs them on
 * every real migration. Async mode applies schema migrations at boot, while the previous release still serves, so a migration
 * may only add schema and every migration needs a way back. Older migrations predate the rules and are
 * not checked; async mode runs them the blocking way.
 */

export interface MigrationSource {
  file: string;
  text: string;
}

export const PHASE_FOLDERS = ['schema', 'data', 'cleanup'];
/** Phase rules apply from here: the newest migration when they were added. */
export const PHASE_RULES_FROM = 1793100000000;

const OPT_OUT = /\/\/\s*migration-lint:\s*allow-destructive\s+\S/;
const RULES_DOC = 'Rules: the Migrations section of server/AGENTS.md.';

type Rule = [string, RegExp];

// --- Rule tables ---

const DESTRUCTIVE_SQL: Rule[] = [
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

const DROP_WITHOUT_IF_EXISTS =
  /\bDROP\s+(?:TABLE|COLUMN|CONSTRAINT|INDEX(?:\s+CONCURRENTLY)?|TRIGGER|FUNCTION|TYPE|VIEW|SEQUENCE)\s+(?!IF\s+EXISTS\b)/i;

const SCHEMA_DATA_CHANGES: Rule[] = [
  ['UPDATE … SET', /\bUPDATE\s+\S+\s+SET\b/i],
  ['DELETE FROM', /\bDELETE\s+FROM\b/i],
  ['INSERT … SELECT', /\bINSERT\s+INTO\b[^;]*\bSELECT\b/i],
];
/** Long or exclusive locks; in a data migration they would block readers for the whole run. */
const DATA_FORBIDDEN: Rule[] = [
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

const COLUMN_DECORATORS = new Set([
  'Column',
  'PrimaryColumn',
  'PrimaryGeneratedColumn',
  'CreateDateColumn',
  'UpdateDateColumn',
  'DeleteDateColumn',
  'VersionColumn',
  'JoinColumn',
]);

// --- Reading source ---

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
function codeIn(node: ts.Node): { sql: string; literals: string[]; identifiers: Set<string> } {
  const sql: string[] = [];
  const identifiers = new Set<string>();
  const visit = (child: ts.Node) => {
    if (ts.isStringLiteralLike(child) || ts.isTemplateLiteralToken(child)) sql.push(child.text);
    if (ts.isIdentifier(child)) identifiers.add(child.text);
    ts.forEachChild(child, visit);
  };
  visit(node);
  return { sql: sql.join(' '), literals: sql, identifiers };
}

const matching = (rules: Rule[], sql: string) =>
  rules.filter(([, pattern]) => pattern.test(sql)).map(([label]) => label);

const stringOption = (args: ts.NodeArray<ts.Expression>, option: string): string | undefined => {
  for (const arg of args) {
    if (!ts.isObjectLiteralExpression(arg)) continue;
    const found = arg.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) && property.name.getText() === option
    );
    if (found && ts.isStringLiteralLike(found.initializer)) return found.initializer.text;
  }
};

function emptyDown(cls: ts.ClassDeclaration, file: string): string[] {
  const down = method(cls, 'down');
  return down?.body?.getText().slice(1, -1).trim()
    ? []
    : [`${file}: down() is missing or empty; undo up() or comment why it cannot be undone. ${RULES_DOC}`];
}

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

// --- Rules: one migration in, violation messages out ---

/** Schema and data: up() only adds schema; down() is not empty. */
export function authoringViolations({ file, text }: MigrationSource): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const cls = migrationClass(source);
  if (!cls) return [`${file}: no migration class found. ${RULES_DOC}`];
  const violations: string[] = [];

  violations.push(...emptyDown(cls, file));

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

/** Schema adds only and changes no rows; data keeps lock-taking statements to beforeCommit(). */
export function phaseViolations(phase: 'schema' | 'data', { file, text }: MigrationSource): string[] {
  if (OPT_OUT.test(text)) return [];
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const cls = migrationClass(source);
  const up = cls && method(cls, 'up');
  if (!up?.body) return [];
  const { sql, identifiers } = codeIn(up.body);
  if (phase === 'schema') {
    const found = [...matching(SCHEMA_DATA_CHANGES, sql), ...indexesOnExistingTables(sql)];
    return found.length
      ? [`${file}: schema changes rows or locks a table (${found.join(', ')}); move it to data. ${RULES_DOC}`]
      : [];
  }
  const beforeCommit = method(cls, 'beforeCommit');
  const beforeCommitCode = beforeCommit?.body ? codeIn(beforeCommit.body) : { sql: '', identifiers: new Set<string>() };
  const violations: string[] = [];
  const forbidden = [
    ...matching(DATA_FORBIDDEN, `${sql} ${beforeCommitCode.sql}`),
    ...[...identifiers, ...beforeCommitCode.identifiers].filter((name) => SCHEMA_API.has(name)),
  ];
  if (forbidden.length) {
    violations.push(`${file}: data holds a long lock (${forbidden.join(', ')}); move it to cleanup. ${RULES_DOC}`);
  }
  const beforeCommitOnly = matching(BEFORE_COMMIT_ONLY, sql);
  if (beforeCommitOnly.length)
    violations.push(`${file}: ${beforeCommitOnly.join(', ')} in up(); move it to beforeCommit(). ${RULES_DOC}`);
  return violations;
}

/**
 * Cleanup runs after writes reopen, one short transaction per step, so up() goes through
 * withShortLock / setNotNull, never queryRunner directly, and every step is safe to run twice.
 */
export function cleanupViolations({ file, text }: MigrationSource, knownMigrations: ReadonlySet<string>): string[] {
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

  violations.push(...emptyDown(cls, file));
  return violations;
}

/** `table.column` and `table` for every entity; synchronize is off, so nothing else checks them against the schema. */
export function entityMappings(sources: MigrationSource[]): Set<string> {
  const mapped = new Set<string>();
  for (const { file, text } of sources) {
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    for (const cls of source.statements.filter(ts.isClassDeclaration)) {
      const entity = ts
        .getDecorators(cls)
        ?.map((decorator) => decorator.expression)
        .find((call): call is ts.CallExpression => ts.isCallExpression(call) && call.expression.getText() === 'Entity');
      if (!entity) continue;
      const [first] = entity.arguments;
      const table = first && ts.isStringLiteralLike(first) ? first.text : stringOption(entity.arguments, 'name');
      if (!table) continue;
      mapped.add(table);
      for (const member of cls.members.filter(ts.isPropertyDeclaration)) {
        for (const decorator of ts.getDecorators(member) ?? []) {
          const call = decorator.expression;
          if (!ts.isCallExpression(call) || !COLUMN_DECORATORS.has(call.expression.getText())) continue;
          const named = stringOption(call.arguments, 'name');
          if (named || call.expression.getText() !== 'JoinColumn') {
            mapped.add(`${table}.${named ?? member.name.getText()}`);
          }
        }
      }
    }
  }
  return mapped;
}

/** Tables and columns a cleanup migration's up() drops, as `table` and `table.column`. */
export function droppedSchema({ file, text }: MigrationSource): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const up = migrationClass(source) && method(migrationClass(source), 'up');
  if (!up?.body) return [];
  const dropped: string[] = [];
  // One statement per literal: joined with spaces, a later ALTER's drops would land on the first table.
  const sql = codeIn(up.body)
    .literals.join(';\n')
    .replace(/\bpublic\./gi, '');
  for (const [, table] of sql.matchAll(/\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/gi)) dropped.push(table);
  for (const [statement, table] of sql.matchAll(/\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)[^;]*/gi)) {
    for (const [, column] of statement.matchAll(/\bDROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?(\w+)/gi)) {
      dropped.push(`${table}.${column}`);
    }
  }
  return dropped;
}

/** Names on one side only: `added` were back-dated past the cutoff, `missing` were removed or renamed. */
export function frozenListDrift(frozen: string[], current: string[]): { added: string[]; missing: string[] } {
  return {
    added: current.filter((name) => !frozen.includes(name)),
    missing: frozen.filter((name) => !current.includes(name)),
  };
}

export const newerThanPhaseRules = (sources: MigrationSource[]) =>
  sources.filter(({ text }) => Number(text.match(/class\s+\w*?(\d{13})\b/)?.[1]) > PHASE_RULES_FROM);
