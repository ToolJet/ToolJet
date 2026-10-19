/** @group database */
import {
  DEFAULT_MIGRATION_FLAG_TTL_SECONDS,
  getMigrationFlagTtlSeconds,
  getMigrationMode,
  isMigrationInProgressValue,
  isMigrationTrafficGateDisabled,
  MIGRATION_IN_PROGRESS_KEY,
} from 'src/migration-helpers/migration-status';
import { MigrationStatusFlag } from 'src/migration-helpers/migration-status-flag';

// The flag owns its Redis client, so tests drive it through the private constructor rather
// than opening a connection. Only the four commands the flag issues are stubbed.
interface FakeRedis {
  set: jest.Mock;
  eval: jest.Mock;
  quit: jest.Mock;
  disconnect: jest.Mock;
}

function fakeRedis(overrides: Partial<FakeRedis> = {}): FakeRedis {
  return {
    set: jest.fn().mockResolvedValue('OK'),
    eval: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    ...overrides,
  };
}

function flagFor(client: FakeRedis, ttlSeconds = 1800) {
  const logger = { log: jest.fn(), warn: jest.fn() };
  const FlagConstructor = MigrationStatusFlag as unknown as new (
    client: FakeRedis,
    ttlSeconds: number,
    logger: typeof logger
  ) => MigrationStatusFlag;
  return { flag: new FlagConstructor(client, ttlSeconds, logger), logger };
}

describe('migration-helpers/migration-status', () => {
  describe('isMigrationInProgressValue | what a serving pod makes of the key', () => {
    it.each([
      ['a pod ownership token', 'pod-7:41:ab12cd34', true],
      ['the literal true', 'true', true],
      ['a missing key — no upgrade running', null, false],
      ['an unset key', undefined, false],
      ['an operator clearing a stuck gate with SET ... false', 'false', false],
      ['the same, in any casing or padding', '  FALSE  ', false],
      ['an empty value', '', false],
    ])('should read %s as in-progress=%s', (_label, value, expected) => {
      expect(isMigrationInProgressValue(value as string | null | undefined)).toBe(expected);
    });
  });

  describe('getMigrationMode | who runs migrations', () => {
    it.each([
      [{}, 'blocking'],
      [{ MIGRATION_MODE: 'async' }, 'async'],
      [{ MIGRATION_MODE: 'manual' }, 'manual'],
      [{ MIGRATION_MODE: 'later' }, 'blocking'],
      [{ MIGRATION_MODE: 'manual', TOOLJET_EDITION: 'cloud' }, 'blocking'],
    ])('should read %j as %s', (env, mode) => {
      expect(getMigrationMode(env)).toBe(mode);
    });
  });

  describe('getMigrationFlagTtlSeconds | the backstop against a leaked flag', () => {
    it('should default to 30 minutes', () => {
      expect(getMigrationFlagTtlSeconds({})).toBe(DEFAULT_MIGRATION_FLAG_TTL_SECONDS);
      expect(DEFAULT_MIGRATION_FLAG_TTL_SECONDS).toBe(1800);
    });

    it('should accept a configured number of minutes', () => {
      expect(getMigrationFlagTtlSeconds({ MIGRATION_FLAG_TTL_MINUTES: '45' })).toBe(2700);
    });

    it.each([['0'], ['-5'], ['forever'], ['']])(
      'should ignore %s and keep the default, so the key can never be set without an expiry',
      (value) => {
        expect(getMigrationFlagTtlSeconds({ MIGRATION_FLAG_TTL_MINUTES: value })).toBe(
          DEFAULT_MIGRATION_FLAG_TTL_SECONDS
        );
      }
    );
  });

  describe('MigrationStatusFlag.create | the opt-out', () => {
    it('should return null when DISABLE_MIGRATION_TRAFFIC_GATE is set, so migrations run without cutting traffic', () => {
      const logger = { log: jest.fn(), warn: jest.fn() };
      expect(MigrationStatusFlag.create({ DISABLE_MIGRATION_TRAFFIC_GATE: 'true' }, logger)).toBeNull();
      // The deploy log is the only place an operator can see why traffic was never cut.
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Skipping the upgrade gate'));
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('DISABLE_MIGRATION_TRAFFIC_GATE=true'));
      expect(isMigrationTrafficGateDisabled({ DISABLE_MIGRATION_TRAFFIC_GATE: 'true' })).toBe(true);
      expect(isMigrationTrafficGateDisabled({})).toBe(false);
    });
  });

  describe('MigrationStatusFlag.create | a broken Redis config must not fail the deploy', () => {
    it('should return null rather than throw when the client cannot even be constructed', () => {
      jest.isolateModules(() => {
        jest.doMock('ioredis', () => {
          const ThrowingRedis = function () {
            throw new Error('Invalid redis options');
          };
          // Mirrors ioredis' own CJS shape (module.exports = Redis; Redis.default = Redis).
          (ThrowingRedis as unknown as { default: unknown }).default = ThrowingRedis;
          return ThrowingRedis;
        });
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { MigrationStatusFlag: Flag } = require('src/migration-helpers/migration-status-flag');
        const logger = { log: jest.fn(), warn: jest.fn() };

        expect(Flag.create({}, logger)).toBeNull();
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Could not create the Redis client'));
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('API traffic will NOT be cut'));
      });
    });
  });

  describe('MigrationStatusFlag | raising and clearing the gate', () => {
    it('should set the key with a TTL, never without one', async () => {
      const client = fakeRedis();
      const { flag } = flagFor(client, 1800);

      await flag.acquire();

      expect(client.set).toHaveBeenCalledWith(MIGRATION_IN_PROGRESS_KEY, expect.any(String), 'EX', 1800);
    });

    it('should re-set the key on refresh so a long wait for another pod cannot outlive the TTL', async () => {
      const client = fakeRedis();
      const { flag } = flagFor(client, 1800);

      await flag.acquire();
      await flag.refresh();

      expect(client.set).toHaveBeenCalledTimes(2);
      expect(client.set.mock.calls[0][1]).toBe(client.set.mock.calls[1][1]);
    });

    it('should clear the key only if this process still owns it', async () => {
      const client = fakeRedis();
      const { flag } = flagFor(client);

      await flag.acquire();
      await flag.release();

      const token = client.set.mock.calls[0][1];
      const [script, keyCount, key, argument] = client.eval.mock.calls[0];
      expect(script).toContain('del');
      expect([keyCount, key, argument]).toEqual([1, MIGRATION_IN_PROGRESS_KEY, token]);
    });

    it('should leave the key alone when another migrating pod has taken ownership', async () => {
      const client = fakeRedis({ eval: jest.fn().mockResolvedValue(0) });
      const { flag, logger } = flagFor(client);

      await flag.acquire();
      await flag.release();

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('still held by another migrating pod'));
    });

    it('should release at most once, so a finally block after a signal handler is harmless', async () => {
      const client = fakeRedis();
      const { flag } = flagFor(client);

      await flag.release();
      await flag.release();

      expect(client.eval).toHaveBeenCalledTimes(1);
    });

    it('should not refresh a released flag back into existence', async () => {
      const client = fakeRedis();
      const { flag } = flagFor(client);

      await flag.release();
      await flag.refresh();

      expect(client.set).not.toHaveBeenCalled();
    });
  });

  describe('MigrationStatusFlag | a Redis outage must not fail the deploy', () => {
    it('should carry on when the key cannot be set, warning that traffic is not cut', async () => {
      const client = fakeRedis({ set: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) });
      const { flag, logger } = flagFor(client);

      await expect(flag.acquire()).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('API traffic will NOT be cut'));
    });

    it('should carry on when the key cannot be cleared, pointing at the TTL as the backstop', async () => {
      const client = fakeRedis({ eval: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) });
      const { flag, logger } = flagFor(client, 1800);

      await expect(flag.release()).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('expires on its own in at most 1800s'));
    });

    it('should fall back to disconnect when a graceful quit fails', async () => {
      const client = fakeRedis({ quit: jest.fn().mockRejectedValue(new Error('Connection is closed.')) });
      const { flag } = flagFor(client);

      await expect(flag.close()).resolves.toBeUndefined();
      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('MigrationStatusFlag.armShutdownRelease | a trappable stop still clears the gate', () => {
    afterEach(() => {
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');
    });

    it('should register SIGINT/SIGTERM handlers and remove them again on disarm', () => {
      const { flag } = flagFor(fakeRedis());
      const before = process.listenerCount('SIGTERM');

      const disarm = flag.armShutdownRelease();
      expect(process.listenerCount('SIGTERM')).toBe(before + 1);
      expect(process.listenerCount('SIGINT')).toBeGreaterThan(0);

      disarm();
      expect(process.listenerCount('SIGTERM')).toBe(before);
    });
  });
});
