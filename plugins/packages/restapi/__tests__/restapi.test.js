'use strict';

const http = require('http');
const restapi = require('../lib');

const { resolveRequestTimeout } = restapi;

describe('restapi', () => {
  describe('resolveRequestTimeout', () => {
    it('defaults to 120 seconds', () => {
      expect(resolveRequestTimeout({}, {})).toBe(120000);
      expect(resolveRequestTimeout({ request_timeout: '' }, { query_timeout: '' })).toBe(120000);
    });

    it("uses the data source's request timeout when the query has no timeout", () => {
      expect(resolveRequestTimeout({ request_timeout: '30000' }, {})).toBe(30000);
    });

    it("prefers the query's own timeout over the data source's", () => {
      expect(resolveRequestTimeout({ request_timeout: '30000' }, { query_timeout: '5000' })).toBe(5000);
      expect(resolveRequestTimeout({ request_timeout: 30000 }, { query_timeout: 7000 })).toBe(7000);
    });

    it('disables the timeout when set to 0', () => {
      expect(resolveRequestTimeout({ request_timeout: '0' }, {})).toBeUndefined();
      expect(resolveRequestTimeout({ request_timeout: '30000' }, { query_timeout: '0' })).toBeUndefined();
    });

    it('ignores invalid values', () => {
      expect(resolveRequestTimeout({ request_timeout: 'not-a-number' }, { query_timeout: '-5' })).toBe(120000);
    });
  });

  describe('run', () => {
    let server;
    let baseUrl;
    let closedRequests;

    beforeAll(async () => {
      server = http.createServer((req, res) => {
        req.on('close', () => closedRequests.push(req.url));
        if (req.url === '/slow') return; // never responds
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      });
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      baseUrl = `http://127.0.0.1:${server.address().port}`;
    });

    beforeEach(() => {
      closedRequests = [];
    });

    afterAll(async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    });

    const runQuery = (queryOptions, sourceOptions = {}) =>
      new restapi.default().run(sourceOptions, { method: 'get', headers: [], url_params: [], ...queryOptions }, undefined);

    it('fails with a timeout error and closes the connection when the endpoint does not respond', async () => {
      const startedAt = Date.now();

      await expect(runQuery({ url: `${baseUrl}/slow`, query_timeout: '200' })).rejects.toMatchObject({
        message: 'Query timed out',
      });

      expect(Date.now() - startedAt).toBeLessThan(5000);
      // The request must be cancelled, not left hanging on the server
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(closedRequests).toContain('/slow');
    });

    it("applies the data source's request timeout when the query has no timeout", async () => {
      await expect(runQuery({ url: `${baseUrl}/slow` }, { request_timeout: '200' })).rejects.toMatchObject({
        message: 'Query timed out',
      });
    });

    it('returns the response when the endpoint answers within the timeout', async () => {
      const result = await runQuery({ url: `${baseUrl}/fast`, query_timeout: '5000' });

      expect(result.status).toBe('ok');
      expect(result.data).toEqual({ ok: true });
    });
  });
});
