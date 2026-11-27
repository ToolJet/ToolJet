'use strict';

const postgresql = require('../lib');

// Needs the local PostgreSQL the dev setup runs (PG_HOST etc. from the root .env)
const sourceOptions = {
  connection_type: 'manual',
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  username: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASS || 'postgres',
  database: 'postgres',
  ssl_enabled: false,
  ssl_certificate: 'none',
};

const abortAfter = (ms) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error('Step stopped')), ms);
  return controller.signal;
};

describe('postgresql | cancel on the step deadline', () => {
  const service = new postgresql.default();

  it.each([
    ['plain SQL', { mode: 'sql', query: 'SELECT pg_sleep(10)' }],
    ['SQL with parameters', { mode: 'sql', query: 'SELECT pg_sleep(:secs)', query_params: [['secs', '10']] }],
  ])('cancels %s on the server when the signal fires', async (_label, queryOptions) => {
    const startedAt = Date.now();

    await expect(
      service.run(sourceOptions, queryOptions, `cancel-test-${_label}`, new Date().toISOString(), {
        signal: abortAfter(300),
      })
    ).rejects.toMatchObject({ description: expect.stringMatching(/canceling statement due to user request/) });

    expect(Date.now() - startedAt).toBeLessThan(5000);
  }, 20000);
});
