/** @group working */
import { HttpException } from '@nestjs/common';
import { PostgrestProxyService } from '@modules/tooljet-db/services/postgrest-proxy.service';

jest.mock('express-http-proxy', () => () => jest.fn());

// A bulk insert sends a list of rows. Spread into an object it reached PostgREST as columns "0", "1", ..., so every
// bulk insert through the proxy failed and callers fell back to one request per row.
describe('PostgREST proxy request body', () => {
  const service = (columns: Array<{ column_name: string; data_type: string }>) => {
    const tableOperations = {
      perform: jest.fn().mockResolvedValue({ columns }),
    };
    const proxy = new PostgrestProxyService(
      {} as any,
      { get: () => 'http://localhost:3002' } as any,
      {} as any,
      tableOperations as any
    );
    return { proxy: proxy as any, tableOperations };
  };

  it('keeps a list of rows a list when the table has no JSONB columns', async () => {
    const { proxy } = service([{ column_name: 'name', data_type: 'text' }]);
    const rows = [{ name: 'a' }, { name: 'b' }];
    expect(await proxy.validateJSONBInputs('org', 'garden', rows)).toEqual(rows);
  });

  it('parses JSONB values row by row and reads the table once', async () => {
    const { proxy, tableOperations } = service([{ column_name: 'meta', data_type: 'jsonb' }]);
    const rows = [
      { name: 'a', meta: '{"x":1}' },
      { name: 'b', meta: { y: 2 } },
    ];
    expect(await proxy.validateJSONBInputs('org', 'garden', rows)).toEqual([
      { name: 'a', meta: { x: 1 } },
      { name: 'b', meta: { y: 2 } },
    ]);
    expect(tableOperations.perform).toHaveBeenCalledTimes(1);
  });

  it('rejects a list with an invalid JSONB value in any row', async () => {
    const { proxy } = service([{ column_name: 'meta', data_type: 'jsonb' }]);
    await expect(
      proxy.validateJSONBInputs('org', 'garden', [{ meta: { ok: true } }, { meta: 'not json' }])
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('leaves a single row as it was', async () => {
    const { proxy } = service([{ column_name: 'meta', data_type: 'jsonb' }]);
    expect(
      await proxy.validateJSONBInputs('org', 'garden', {
        name: 'a',
        meta: '{"x":1}',
      })
    ).toEqual({
      name: 'a',
      meta: { x: 1 },
    });
    const plain = service([{ column_name: 'name', data_type: 'text' }]);
    expect(await plain.proxy.validateJSONBInputs('org', 'garden', { name: 'a' })).toEqual({ name: 'a' });
  });

  it('forwards a bulk insert to PostgREST as a list of rows', async () => {
    const tableOperations = {
      perform: jest.fn().mockResolvedValue({
        columns: [{ column_name: 'name', data_type: 'text' }],
      }),
      isRowLimitReached: jest.fn().mockResolvedValue(false),
    };
    const manager = {
      findOne: jest.fn().mockResolvedValue({ tableName: 'garden' }),
    };
    const proxy: any = new PostgrestProxyService(
      manager as any,
      { get: () => 'http://localhost:3002' } as any,
      {} as any,
      tableOperations as any
    );
    proxy.signJwtPayload = () => 'token';
    proxy.replaceTableNamesAtPlaceholder = async (url: string) => url;
    proxy.httpProxy = jest.fn();
    const rows = [{ name: 'a' }, { name: 'b' }];
    const req: any = {
      method: 'POST',
      url: '/api/tooljet-db/proxy/table-1',
      headers: { 'tj-workspace-id': 'org' },
      body: rows,
    };
    await proxy.proxy(req, { set: jest.fn() }, jest.fn());
    expect(Array.isArray(req.body)).toBe(true);
    expect(req.body).toEqual(rows);
    expect(proxy.httpProxy).toHaveBeenCalled();
  });
});
