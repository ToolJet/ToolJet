/**
 * Adds back the old rules a failed async upgrade from 3.21.58 dropped, so the 3.21.58 image can run again. For when
 * the pod running the upgrade was killed before it restored them. Run it from the new image, then deploy 3.21.58.
 */
import dataDataSource from '../src/migration-helpers/data-datasource';
import { getLockWaitOptions, withMigrationAdvisoryLock } from '../src/migration-helpers/migration-locks';
import { restoreLegacyRules } from '../src/migration-helpers/legacy-3-21-58-upgrade';
import { getEnvVars } from './database-config-utils';

async function main(): Promise<number> {
  await dataDataSource.initialize();
  try {
    // A running upgrade holds this lock; restoring under it would race the data phase.
    const problems = await withMigrationAdvisoryLock(dataDataSource, getLockWaitOptions(getEnvVars()), {}, () =>
      restoreLegacyRules(dataDataSource)
    );
    return problems?.length ? 1 : 0;
  } finally {
    await dataDataSource.destroy();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`[migrations] ${(error as Error).message}`);
    process.exit(1);
  });
