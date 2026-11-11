// db migrate: the dev DB the usual way, the test DB the way that actually migrates.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from '../args.ts';
import { processEnv, readEnv, withoutDotEnv } from '../env.ts';
import { repoAt } from '../repo.ts';
import { run } from '../sh.ts';
import { logFile } from '../state.ts';
import { emit, since, TjError, ui } from '../ui.ts';

export const dbMigrate: Command = {
  name: 'db migrate',
  summary: 'Run pending migrations on the dev DB, or the test DB with --test',
  usage: 'tj db migrate [--test]',
  options: { test: { type: 'boolean', desc: 'Migrate the .env.test DB (NODE_ENV=test would silently skip)' } },
  async run({ values, cwd }) {
    const { root } = await repoAt(cwd);
    const test = Boolean(values.test);
    const file = join(root, test ? '.env.test' : '.env');
    if (!existsSync(file)) throw new TjError(`no ${file}`, { hint: test ? 'tj setup' : 'tj setup --app' });
    const db = readEnv(file).PG_DB;
    const t = Date.now();
    ui.step(`migrating ${db}`);
    const opts = { cwd: join(root, 'server'), log: logFile(root, test ? 'db-test' : 'db-dev') };
    if (test) await withoutDotEnv(root, () => run('test migrate', 'npm', ['run', 'db:migrate'], { ...opts, env: processEnv(readEnv(file), { NODE_ENV: '' }) }));
    else await run('migrate', 'npm', ['run', 'db:migrate'], { ...opts, env: processEnv({}, { NODE_ENV: '' }) });
    ui.ok(`${db} migrated ${since(t)}`);
    emit({ db, test });
  },
};
