/** @group platform */
import { NextFunction, Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { RedisService } from '@modules/redis/service';
import {
  buildApiPrefix,
  MigrationGateMiddleware,
  MIGRATION_IN_PROGRESS_MESSAGE,
  MIGRATION_PENDING_MESSAGE,
} from '@modules/app/middlewares/migration-gate.middleware';
import { MigrationRunsService, MigrationState } from '@modules/app/migration-runs/service';
import { MIGRATION_IN_PROGRESS_KEY } from 'src/migration-helpers/migration-status';

/** Nest 11 mounts forRoutes('*') middleware on the full path, so req.path is always '/'. */
function buildRequest(path: string, method = 'GET'): Request {
  return { path: '/', originalUrl: `${path}?x=1`, method } as Request;
}

function buildResponse() {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & typeof res;
}

function runsIn(state: MigrationState) {
  return { status: async () => ({ state }) } as unknown as MigrationRunsService;
}

const idleRuns = runsIn('idle');

function buildMiddleware(get: jest.Mock, runs = idleRuns) {
  const logger = { warn: jest.fn(), log: jest.fn(), error: jest.fn() } as unknown as Logger;
  const redisService = { getClient: () => ({ get }) } as unknown as RedisService;
  return { middleware: new MigrationGateMiddleware(redisService, logger, runs), logger };
}

/** The cache is per-instance and time-based; a fresh instance per test keeps them independent. */
function flagSet() {
  return jest.fn().mockResolvedValue('pod-3:17:deadbeef');
}

function flagCleared() {
  return jest.fn().mockResolvedValue(null);
}

function flagClear() {
  return jest.fn().mockResolvedValue(null);
}

describe('MigrationGateMiddleware', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetAllMocks();
  });

  describe('buildApiPrefix | matches the prefix main.ts installs', () => {
    it.each([
      [undefined, '/api'],
      ['', '/api'],
      ['/tooljet/', '/tooljet/api'],
      ['tooljet', '/tooljet/api'],
    ])('should map SUB_PATH %s to %s', (subPath, expected) => {
      expect(buildApiPrefix(subPath)).toBe(expected);
    });
  });

  describe('while MIGRATION_IN_PROGRESS is set | API traffic is cut', () => {
    it('should answer an API request with a retryable 503 instead of hitting a half-migrated schema', async () => {
      const { middleware } = buildMiddleware(flagSet());
      const res = buildResponse();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps'), res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '30');
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 503,
        timestamp: expect.any(String),
        path: '/api/apps?x=1',
        message: MIGRATION_IN_PROGRESS_MESSAGE,
        code: 'MIGRATION_IN_PROGRESS',
      });
    });

    it.each([
      ['/health', 'the un-prefixed health route'],
      ['/api/health', 'the orchestrator probe — gating it would get the waiting pods killed'],
      ['/api/metrics', 'the scrape endpoint'],
    ])('should never gate %s (%s)', async (path) => {
      const { middleware } = buildMiddleware(flagSet());
      const res = buildResponse();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest(path), res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it.each([['/'], ['/applications/my-app'], ['/assets/main.js']])(
      'should leave %s alone so the SPA shell still loads and can show the upgrade state',
      async (path) => {
        const { middleware } = buildMiddleware(flagSet());
        const res = buildResponse();
        const next = jest.fn() as NextFunction;

        await middleware.use(buildRequest(path), res, next);

        expect(next).toHaveBeenCalled();
      }
    );

    it('should gate the subpath API prefix when SUB_PATH is configured', async () => {
      process.env.SUB_PATH = '/tooljet/';
      const { middleware } = buildMiddleware(flagSet());
      const res = buildResponse();

      await middleware.use(buildRequest('/tooljet/api/apps'), res, jest.fn() as NextFunction);
      expect(res.status).toHaveBeenCalledWith(503);

      const other = buildResponse();
      const next = jest.fn() as NextFunction;
      await middleware.use(buildRequest('/tooljet/api/health'), other, next);
      expect(next).toHaveBeenCalled();
    });

    it('should log that it is rejecting traffic, but not once per request', async () => {
      const { middleware, logger } = buildMiddleware(flagSet());

      for (let i = 0; i < 5; i++) {
        await middleware.use(buildRequest('/api/apps'), buildResponse(), jest.fn() as NextFunction);
      }

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(MIGRATION_IN_PROGRESS_KEY));
    });
  });

  describe('normal service | the gate is invisible', () => {
    it('should pass the request through when no upgrade is running', async () => {
      const get = flagClear();
      const { middleware } = buildMiddleware(get);
      const res = buildResponse();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps'), res, next);

      expect(get).toHaveBeenCalledWith(MIGRATION_IN_PROGRESS_KEY);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should say so at boot when the gate is switched off, naming the env variable', () => {
      process.env.DISABLE_MIGRATION_TRAFFIC_GATE = 'true';
      const { logger } = buildMiddleware(flagClear());

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping the upgrade gate — disabled by env variable')
      );
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('DISABLE_MIGRATION_TRAFFIC_GATE=true'));
    });

    it('should stay quiet at boot when the gate is on, so the log is not noise', () => {
      const { logger } = buildMiddleware(flagClear());

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not read Redis at all when DISABLE_MIGRATION_TRAFFIC_GATE is set', async () => {
      process.env.DISABLE_MIGRATION_TRAFFIC_GATE = 'true';
      const get = flagSet();
      const { middleware } = buildMiddleware(get);
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps'), buildResponse(), next);

      expect(get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not read Redis for a path it would never gate', async () => {
      const get = flagClear();
      const { middleware } = buildMiddleware(get);

      await middleware.use(buildRequest('/api/health'), buildResponse(), jest.fn() as NextFunction);

      expect(get).not.toHaveBeenCalled();
    });

    it('should collapse a burst of requests into a single Redis read', async () => {
      const get = flagClear();
      const { middleware } = buildMiddleware(get);

      await Promise.all(
        Array.from({ length: 50 }, () =>
          middleware.use(buildRequest('/api/apps'), buildResponse(), jest.fn() as NextFunction)
        )
      );

      expect(get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redis outage | the gate fails open', () => {
    it('should serve traffic normally when the flag cannot be read', async () => {
      const get = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const { middleware, logger } = buildMiddleware(get);
      const res = buildResponse();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps'), res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('serving traffic normally'));
    });

    it('should give up on a Redis that never answers instead of parking the request', async () => {
      // A connected-but-unresponsive Redis: ioredis would queue this command indefinitely.
      const get = jest.fn().mockReturnValue(new Promise(() => undefined));
      const { middleware, logger } = buildMiddleware(get);
      const next = jest.fn() as NextFunction;

      const startedAt = Date.now();
      await middleware.use(buildRequest('/api/apps'), buildResponse(), next);

      expect(next).toHaveBeenCalled();
      expect(Date.now() - startedAt).toBeLessThan(2000);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('timed out'));
    });

    it('should keep serving traffic rather than wedging when Redis has not been initialised', async () => {
      const logger = { warn: jest.fn(), log: jest.fn(), error: jest.fn() } as unknown as Logger;
      const redisService = {
        getClient: () => {
          throw new Error('Redis client not initialized. Ensure RedisModule is imported.');
        },
      } as unknown as RedisService;
      const middleware = new MigrationGateMiddleware(redisService, logger, idleRuns);
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps'), buildResponse(), next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('in async migration mode | the app keeps serving, writes fail', () => {
    beforeEach(() => {
      process.env.MIGRATION_MODE = 'async';
    });

    it.each([
      ['GET', '/api/apps'],
      ['POST', '/api/authenticate'],
      ['GET', '/api/session'],
      ['POST', '/api/data-queries/q1/run'],
      ['POST', '/api/data-queries/q1/versions/v1/run/e1'],
      ['POST', '/api/migration-runs/run'],
      ['POST', '/api/sso/saml/c1'],
    ])('should let %s %s through', async (method, path) => {
      const { middleware } = buildMiddleware(flagSet());
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest(path, method), buildResponse(), next);

      expect(next).toHaveBeenCalled();
    });

    it.each([
      ['POST', '/api/apps'],
      ['PUT', '/api/apps/a1'],
      ['DELETE', '/api/data-queries/q1'],
      ['POST', '/API/apps'],
    ])('should answer %s %s with 503', async (method, path) => {
      const { middleware } = buildMiddleware(flagSet());
      const res = buildResponse();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest(path, method), res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe('in manual migration mode | writes wait for a super admin to run migrations', () => {
    beforeEach(() => {
      process.env.MIGRATION_MODE = 'manual';
    });

    it('should answer writes with 503 MIGRATION_PENDING while migrations are waiting', async () => {
      const { middleware } = buildMiddleware(flagCleared(), runsIn('pending'));
      const res = buildResponse();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps', 'POST'), res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'MIGRATION_PENDING', message: MIGRATION_PENDING_MESSAGE })
      );
    });

    it.each([
      ['GET', '/api/apps'],
      ['POST', '/api/migration-runs/run'],
    ])('should let %s %s through while migrations are waiting', async (method, path) => {
      const { middleware } = buildMiddleware(flagCleared(), runsIn('pending'));
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest(path, method), buildResponse(), next);

      expect(next).toHaveBeenCalled();
    });

    it('should let writes through once the migrations succeeded', async () => {
      const { middleware } = buildMiddleware(flagCleared(), runsIn('succeeded'));
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps', 'POST'), buildResponse(), next);

      expect(next).toHaveBeenCalled();
    });
  });
});
