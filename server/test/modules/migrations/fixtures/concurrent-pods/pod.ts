/**
 * One simulated pod.
 *
 * Runs the REAL `run()` from `src/migration-helpers/run-all-migrations.ts` — only the
 * DataSources are swapped for ones pointing at a scratch database and the fixture migration
 * set, so the test exercises the production gate and waiting-room code paths verbatim.
 *
 * Spawned as a separate OS process (not a thread) so each pod gets its own connection pool,
 * its own exit code — the thing that used to crash-loop.
 *
 * Contract with the spec: everything the runner logs goes to stdout, and the last line is
 * `__POD_RESULT__{json}`. Exit code 0 means the pod booted successfully, 75 that it left the run to another.
 */
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { run } from '../../../../../src/migration-helpers/run-all-migrations';
import { SKIPPED_EXIT_CODE } from '../../../../../src/migration-helpers/migration-locks';

const podId = process.env.POD_ID ?? 'pod-?';
const fixtureSet = process.env.FIXTURE_SET ?? 'concurrent-pods';

function dataSourceFor(migrationsDirectory: string): DataSource {
  const options: DataSourceOptions = {
    type: 'postgres',
    host: process.env.SCRATCH_PG_HOST,
    port: Number(process.env.SCRATCH_PG_PORT),
    username: process.env.SCRATCH_PG_USER,
    password: process.env.SCRATCH_PG_PASS,
    database: process.env.SCRATCH_PG_DB,
    entities: [],
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'all',
    migrations: [
      join(__dirname, migrationsDirectory, 'LockMigrationsTable*.ts'),
      join(__dirname, '..', fixtureSet, migrationsDirectory, '1*.ts'),
    ],
  };
  return new DataSource(options);
}

async function main() {
  const schemaDS = dataSourceFor('migrations');
  const dataDS = dataSourceFor('data-migrations');
  const contractDS = dataSourceFor('contract');

  // Every pod is released at the same wall-clock instant, so ts-node start-up jitter cannot
  // decide who wins the lock and the contention is real rather than incidental.
  const startAt = Number(process.env.START_AT);
  const delay = startAt - Date.now();
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

  const startedAt = Date.now();
  let error: string | null = null;
  let skipped = false;
  try {
    skipped = !(await run(schemaDS, dataDS, contractDS));
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  await schemaDS.destroy().catch(() => undefined);
  await dataDS.destroy().catch(() => undefined);
  await contractDS.destroy().catch(() => undefined);

  console.log(`__POD_RESULT__${JSON.stringify({ podId, error, durationMs: Date.now() - startedAt })}`);
  process.exit(error ? 1 : skipped ? SKIPPED_EXIT_CODE : 0);
}

main();
