/** @group working */
import { HttpException } from '@nestjs/common';
import { PostgrestProxyService } from '@modules/tooljet-db/services/postgrest-proxy.service';
import { TooljetDatabaseError } from '@modules/tooljet-db/types';

type ProxyOptions = { userResDecorator: (...args: unknown[]) => unknown };
let options: ProxyOptions;
jest.mock('express-http-proxy', () => (_url: string, config: ProxyOptions) => {
  options = config;
  return jest.fn();
});

const config = { get: () => 'http://localhost:3002' };

describe('PostgREST proxy', () => {
  describe('schema cache rejection', () => {
    it('returns a retryable explicit rejection instead of hanging when PostgREST returns an empty error', () => {
      new PostgrestProxyService({} as never, config as never, {} as never, {} as never, {} as never);
      try {
        options.userResDecorator(
          { statusCode: 404 },
          Buffer.from('{}'),
          { headers: { tableInfo: { garden: 'garden' } } },
          {}
        );
        throw new Error('Expected rejection');
      } catch (error) {
        expect(error).toBeInstanceOf(TooljetDatabaseError);
        expect(error.toString()).toContain('schema cache');
      }
    });
  });

  describe('request body', () => {
    const service = (columns: Array<{ column_name: string; data_type: string }>) => {
      const tableOperations = {
        perform: jest.fn().mockResolvedValue({ columns }),
      };
      const proxy = new PostgrestProxyService(
        {} as never,
        config as never,
        {} as never,
        tableOperations as never,
        {} as never
      );
      return { proxy, tableOperations };
    };

    it('keeps a list of rows a list when the table has no JSONB columns', async () => {
      const { proxy } = service([{ column_name: 'name', data_type: 'text' }]);
      const rows = [{ name: 'a' }, { name: 'b' }];
      expect(await proxy['validateJSONBInputs']('org', 'garden', rows, undefined)).toEqual(rows);
    });

    it('parses JSONB values row by row and reads the table once', async () => {
      const { proxy, tableOperations } = service([{ column_name: 'meta', data_type: 'jsonb' }]);
      const rows = [
        { name: 'a', meta: '{"x":1}' },
        { name: 'b', meta: { y: 2 } },
      ];
      expect(await proxy['validateJSONBInputs']('org', 'garden', rows, undefined)).toEqual([
        { name: 'a', meta: { x: 1 } },
        { name: 'b', meta: { y: 2 } },
      ]);
      expect(tableOperations.perform).toHaveBeenCalledTimes(1);
    });

    it('rejects a list with an invalid JSONB value in any row', async () => {
      const { proxy } = service([{ column_name: 'meta', data_type: 'jsonb' }]);
      await expect(
        proxy['validateJSONBInputs']('org', 'garden', [{ meta: { ok: true } }, { meta: 'not json' }], undefined)
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('leaves a single row as it was', async () => {
      const { proxy } = service([{ column_name: 'meta', data_type: 'jsonb' }]);
      expect(await proxy['validateJSONBInputs']('org', 'garden', { name: 'a', meta: '{"x":1}' }, undefined)).toEqual({
        name: 'a',
        meta: { x: 1 },
      });
      const plain = service([{ column_name: 'name', data_type: 'text' }]);
      expect(await plain.proxy['validateJSONBInputs']('org', 'garden', { name: 'a' }, undefined)).toEqual({
        name: 'a',
      });
    });

    const proxyFor = (remainingRowCapacity: number) => {
      const tableOperations = {
        perform: jest.fn().mockResolvedValue({ columns: [{ column_name: 'name', data_type: 'text' }] }),
        getRemainingRowCapacity: jest.fn().mockResolvedValue(remainingRowCapacity),
      };
      const proxy = new PostgrestProxyService(
        {} as never,
        config as never,
        {} as never,
        tableOperations as never,
        {} as never
      );
      proxy['signJwtPayload'] = () => 'token';
      proxy['resolveAndRewrite'] = async (url: string) => ({ url, tableInfo: { [tableId]: 'garden' } });
      const httpProxy = jest.fn();
      proxy['httpProxy'] = httpProxy;
      return { proxy, httpProxy };
    };
    const tableId = '11111111-1111-4111-8111-111111111111';
    const postRequest = (body: unknown) => ({
      method: 'POST',
      url: `/api/tooljet-db/proxy/${tableId}`,
      headers: { 'tj-workspace-id': 'org' },
      body,
    });

    it('forwards a bulk insert to PostgREST as a list of rows', async () => {
      const { proxy, httpProxy } = proxyFor(500);
      const rows = [{ name: 'a' }, { name: 'b' }];
      const req = postRequest(rows);
      await proxy.proxy(req, { set: jest.fn() }, jest.fn());
      expect(req.body).toEqual(rows);
      expect(httpProxy).toHaveBeenCalled();
    });

    it('allows a bulk insert that uses exactly the rows the Workspace has left', async () => {
      const { proxy, httpProxy } = proxyFor(2);
      await proxy.proxy(postRequest([{ name: 'a' }, { name: 'b' }]), { set: jest.fn() }, jest.fn());
      expect(httpProxy).toHaveBeenCalled();
    });

    it('rejects a bulk insert with more rows than the Workspace has left', async () => {
      const { proxy, httpProxy } = proxyFor(1);
      await expect(
        proxy.proxy(postRequest([{ name: 'a' }, { name: 'b' }]), { set: jest.fn() }, jest.fn())
      ).rejects.toMatchObject({ status: 451 });
      expect(httpProxy).not.toHaveBeenCalled();
    });
  });
});
