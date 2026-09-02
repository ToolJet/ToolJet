import { DataQueriesService } from '../../../../src/modules/data-queries/service';

class QueryError extends Error {
  category = 'authentication';
  description = 'invalid credentials';
  data = { code: 'ELOGIN' };
}

function serviceRejecting(error: Error): DataQueriesService {
  return new DataQueriesService({} as any, { runQuery: jest.fn().mockRejectedValue(error) } as any, {} as any);
}

function serviceReturning(result: object): DataQueriesService {
  return new DataQueriesService({} as any, { runQuery: jest.fn().mockResolvedValue(result) } as any, {} as any);
}

describe('DataQueriesService failed query response', () => {
  it('preserves a structured plugin error category', async () => {
    const result = await serviceRejecting(new QueryError('query failed')).preview(
      {} as any,
      {} as any,
      'environment',
      {},
      {} as any
    );

    expect(result).toMatchObject({
      status: 'failed',
      category: 'authentication',
      data: { code: 'ELOGIN' },
    });
  });

  it('labels an unstructured server failure as unknown', async () => {
    const result = await serviceRejecting(new Error('opaque failure')).preview(
      {} as any,
      {} as any,
      'environment',
      {},
      {} as any
    );

    expect(result).toMatchObject({ status: 'failed', category: 'unknown' });
  });

  it('normalizes a plugin-returned failure without a category', async () => {
    const result = await serviceReturning({ status: 'failed', message: 'opaque plugin failure' }).preview(
      {} as any,
      {} as any,
      'environment',
      {},
      {} as any
    );

    expect(result).toMatchObject({ status: 'failed', category: 'unknown' });
  });
});
