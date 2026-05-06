/**
 * acmeHttpChallengeMiddleware Unit Tests
 *
 * Covers the two modes:
 *   1. DB lookup mode (EE / multi-pod) — token served from shared DB
 *   2. Filesystem fallback mode (CE / no lookup provided)
 *
 * @group platform
 */
import { acmeHttpChallengeMiddleware } from '../../../../src/middleware/acme-http-challenge.middleware';
import { Request, Response } from 'express';

// ---------------------------------------------------------------------------
// Mock express.static so we can verify without touching disk
// ---------------------------------------------------------------------------
const mockStaticHandler = jest.fn((_req, _res, next) => next());

jest.mock('express', () => ({
  ...jest.requireActual('express'),
  static: jest.fn(() => mockStaticHandler),
}));

// ---------------------------------------------------------------------------
// Minimal Express req/res mocks
// ---------------------------------------------------------------------------
function makeReq(path: string): Partial<Request> {
  return { path };
}

function makeRes(): { headers: Record<string, string>; body: string; setHeader: jest.Mock; send: jest.Mock } {
  const res: any = { headers: {}, body: '' };
  res.setHeader = jest.fn((k: string, v: string) => { res.headers[k] = v; return res; });
  res.send = jest.fn((data: string) => { res.body = data; return res; });
  return res;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('acmeHttpChallengeMiddleware', () => {
  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // DB lookup mode
  // -------------------------------------------------------------------------
  describe('with DB lookup function (EE multi-pod mode)', () => {
    it('serves key authorization as text/plain when token is found', async () => {
      const lookup = jest.fn().mockResolvedValue('abc123.fingerprint');
      const middleware = acmeHttpChallengeMiddleware(lookup);
      const res = makeRes();
      const next = jest.fn();

      await middleware(makeReq('/abc123') as Request, res as unknown as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(res.send).toHaveBeenCalledWith('abc123.fingerprint');
      expect(next).not.toHaveBeenCalled();
    });

    it('strips the leading slash before calling lookup', async () => {
      const lookup = jest.fn().mockResolvedValue('value');
      const middleware = acmeHttpChallengeMiddleware(lookup);

      await middleware(makeReq('/mytoken') as Request, makeRes() as unknown as Response, jest.fn());

      expect(lookup).toHaveBeenCalledWith('mytoken');
    });

    it('calls next() when token is not found in DB', async () => {
      const lookup = jest.fn().mockResolvedValue(null);
      const middleware = acmeHttpChallengeMiddleware(lookup);
      const res = makeRes();
      const next = jest.fn();

      await middleware(makeReq('/unknown') as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('calls next() when lookup throws (graceful degradation)', async () => {
      const lookup = jest.fn().mockRejectedValue(new Error('DB down'));
      const middleware = acmeHttpChallengeMiddleware(lookup);
      const next = jest.fn();

      await middleware(makeReq('/abc123') as Request, makeRes() as unknown as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Filesystem fallback mode
  // -------------------------------------------------------------------------
  describe('without lookup function (filesystem fallback mode)', () => {
    it('returns an express.static handler pointed at the certbot webroot', () => {
      const expressModule = require('express');
      acmeHttpChallengeMiddleware();

      expect(expressModule.static).toHaveBeenCalledWith(
        expect.stringContaining('/var/www/certbot'),
        expect.objectContaining({ dotfiles: 'allow', index: false })
      );
    });

    it('delegates requests to the static handler', () => {
      const middleware = acmeHttpChallengeMiddleware();
      const next = jest.fn();

      middleware(makeReq('/sometoken') as Request, makeRes() as unknown as Response, next);

      expect(mockStaticHandler).toHaveBeenCalled();
    });
  });
});
