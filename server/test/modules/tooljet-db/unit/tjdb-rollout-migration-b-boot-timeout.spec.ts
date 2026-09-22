/**
 * Migration B boots a full Nest app context to resolve its edition-correct service classes while
 * an earlier migration in the same transaction holds ACCESS EXCLUSIVE on internal_tables - if that
 * boot ever blocks on that lock, it hangs the whole migration run forever. `withTimeout` is the
 * guard that turns that into a fast, clear failure instead. This mutation-tests the guard itself:
 * simulate the hang (a promise that never settles) and confirm it fires with the given message
 * rather than hanging the test run.
 *
 * @group database
 */
import { TjdbRolloutMigrationBEnvironmentAssignment1788252587903 } from '../../../../data-migrations/1788252587903-TjdbRolloutMigrationBEnvironmentAssignment';

const { withTimeout } = TjdbRolloutMigrationBEnvironmentAssignment1788252587903;

describe('TjdbRolloutMigrationBEnvironmentAssignment1788252587903.withTimeout', () => {
  it('should resolve with the underlying value when it settles before the timeout', async () => {
    await expect(withTimeout(Promise.resolve('boot-complete'), 50, 'should not fire')).resolves.toBe('boot-complete');
  });

  it('should reject with the underlying rejection when it rejects before the timeout', async () => {
    await expect(withTimeout(Promise.reject(new Error('real boot failure')), 50, 'should not fire')).rejects.toThrow(
      'real boot failure'
    );
  });

  it('should reject with the timeout message when the promise never settles (simulated boot hang)', async () => {
    const neverSettles = new Promise(() => {
      /* simulates a boot blocked forever on a lock wait */
    });

    await expect(withTimeout(neverSettles, 20, 'migration boot deadlocked')).rejects.toThrow(
      'migration boot deadlocked'
    );
  });
});
