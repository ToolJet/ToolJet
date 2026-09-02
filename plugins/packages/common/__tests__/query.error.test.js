'use strict';

const { classifyQueryErrorCategory, QueryError } = require('../lib/query.error');

describe('structured query error classification', () => {
  it.each([
    [{ code: '08006' }, 'connection'],
    [{ code: 'ER_ACCESS_DENIED_ERROR', sqlState: '28000' }, 'authentication'],
    [{ state: '08001' }, 'connection'],
    [{ code: 'ELOGIN', number: 18456 }, 'authentication'],
    [{ name: 'MongoServerSelectionError' }, 'connection'],
    [{ responseObject: { statusCode: 401 } }, 'authentication'],
    [{ response: { status: 'UNAUTHENTICATED' } }, 'authentication'],
    [{ $metadata: { httpStatusCode: 429 } }, 'rate_limit'],
    [{ responseObject: { statusCode: 429 } }, 'rate_limit'],
    [{ responseObject: { statusCode: 503 } }, 'transient'],
    [{ code: '42P01' }, 'schema_name'],
    [{ code: 'ER_NO_SUCH_TABLE' }, 'schema_name'],
  ])('classifies %o as %s', (data, category) => {
    expect(classifyQueryErrorCategory(data)).toBe(category);
  });

  it('does not classify from human-readable text or an API response body', () => {
    const error = new QueryError('connection refused', 'password invalid', {
      responseObject: { statusCode: 400, responseBody: { code: 'ER_ACCESS_DENIED_ERROR' } },
    });

    expect(error.category).toBe('query');
  });

  it('uses an explicit plugin category when one is supplied', () => {
    const error = new QueryError('failed', 'opaque', {}, undefined, 'timeout');
    expect(error.category).toBe('timeout');
  });
});
