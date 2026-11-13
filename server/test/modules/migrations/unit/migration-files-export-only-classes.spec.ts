/**
 * TypeORM loads every export of a migration file as a migration class: one exported helper function in a data
 * migration stopped `db:migrate:data` with "someClass is not a constructor" before any data migration ran (found by a
 * migration dry run on a copy of staging data). Every file in migrations/ and data-migrations/ exports its class and
 * nothing else; a helper is a static method of the class or lives outside these folders.
 */
import * as fs from 'fs';
import * as path from 'path';

const SERVER = path.resolve(__dirname, '../../../..');
const files = ['migrations', 'data-migrations'].flatMap((dir) =>
  fs
    .readdirSync(path.join(SERVER, dir))
    .filter((f) => /\.ts$/.test(f))
    .map((f) => path.join(dir, f))
);

const NON_CLASS_EXPORT = /^export\s+(?:const|let|var|function|async\s+function|default|\{|\*)/m;

describe('migration files', () => {
  it('finds the migration folders', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('export only their migration class', () => {
    const offenders = files.filter((f) => NON_CLASS_EXPORT.test(fs.readFileSync(path.join(SERVER, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
