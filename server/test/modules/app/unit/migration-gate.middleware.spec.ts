/** @group platform */
import { NextFunction, Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import {
  buildApiPrefix,
  MigrationGateMiddleware,
  MIGRATION_FAILED_MESSAGE,
  MIGRATION_IN_PROGRESS_MESSAGE,
} from '@modules/app/middlewares/migration-gate.middleware';
import { MigrationRunsService, MigrationState } from '@modules/app/migration-runs/service';

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

/** Caching, single flight and failing open live in MigrationRunsService.status (e2e). */
function buildMiddleware(state: MigrationState) {
  const logger = { warn: jest.fn(), log: jest.fn(), error: jest.fn() } as unknown as Logger;
  const status = jest.fn().mockResolvedValue({ state });
  const runs = { status } as unknown as MigrationRunsService;
  return { middleware: new MigrationGateMiddleware(logger, runs), logger, status };
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

  describe('while a migration runs | API traffic is cut', () => {
    it('should answer an API request with a retryable 503 instead of hitting a half-migrated schema', async () => {
      const { middleware } = buildMiddleware('running');
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
      const { middleware } = buildMiddleware('running');
      const res = buildResponse();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest(path), res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it.each([['/'], ['/applications/my-app'], ['/assets/main.js']])(
      'should leave %s alone so the SPA shell still loads and can show the upgrade state',
      async (path) => {
        const { middleware } = buildMiddleware('running');
        const res = buildResponse();
        const next = jest.fn() as NextFunction;

        await middleware.use(buildRequest(path), res, next);

        expect(next).toHaveBeenCalled();
      }
    );

    it('should gate the subpath API prefix when SUB_PATH is configured', async () => {
      process.env.SUB_PATH = '/tooljet/';
      const { middleware } = buildMiddleware('running');
      const res = buildResponse();

      await middleware.use(buildRequest('/tooljet/api/apps'), res, jest.fn() as NextFunction);
      expect(res.status).toHaveBeenCalledWith(503);

      const other = buildResponse();
      const next = jest.fn() as NextFunction;
      await middleware.use(buildRequest('/tooljet/api/health'), other, next);
      expect(next).toHaveBeenCalled();
    });

    it('should log that it is rejecting traffic, but not once per request', async () => {
      const { middleware, logger } = buildMiddleware('running');

      for (let i = 0; i < 5; i++) {
        await middleware.use(buildRequest('/api/apps'), buildResponse(), jest.fn() as NextFunction);
      }

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Migration running'));
    });
  });

  describe('normal service | the gate is invisible', () => {
    it.each([['idle'], ['succeeded']] as [MigrationState][])(
      'should pass the request through when %s',
      async (state) => {
        const { middleware, status } = buildMiddleware(state);
        const res = buildResponse();
        const next = jest.fn() as NextFunction;

        await middleware.use(buildRequest('/api/apps'), res, next);

        expect(status).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      }
    );

    it('should say so at boot when the gate is switched off, naming the env variable', () => {
      process.env.DISABLE_MIGRATION_TRAFFIC_GATE = 'true';
      const { logger } = buildMiddleware('idle');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping the upgrade gate — disabled by env variable')
      );
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('DISABLE_MIGRATION_TRAFFIC_GATE=true'));
    });

    it('should stay quiet at boot when the gate is on, so the log is not noise', () => {
      const { logger } = buildMiddleware('idle');

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not read the status at all when DISABLE_MIGRATION_TRAFFIC_GATE is set', async () => {
      process.env.DISABLE_MIGRATION_TRAFFIC_GATE = 'true';
      const { middleware, status } = buildMiddleware('running');
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps'), buildResponse(), next);

      expect(status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not read the status for a path it would never gate', async () => {
      const { middleware, status } = buildMiddleware('running');

      await middleware.use(buildRequest('/api/health'), buildResponse(), jest.fn() as NextFunction);

      expect(status).not.toHaveBeenCalled();
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
      const { middleware } = buildMiddleware('running');
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
      const { middleware } = buildMiddleware('running');
      const res = buildResponse();
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest(path, method), res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('should answer writes with 503 MIGRATION_FAILED after a failed run, until a super admin retries', async () => {
      const { middleware } = buildMiddleware('failed');
      const res = buildResponse();

      await middleware.use(buildRequest('/api/apps', 'POST'), res, jest.fn() as NextFunction);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'MIGRATION_FAILED', message: MIGRATION_FAILED_MESSAGE })
      );
    });

    it('should let writes through once the migrations succeeded', async () => {
      const { middleware } = buildMiddleware('succeeded');
      const next = jest.fn() as NextFunction;

      await middleware.use(buildRequest('/api/apps', 'POST'), buildResponse(), next);

      expect(next).toHaveBeenCalled();
    });
  });
});
