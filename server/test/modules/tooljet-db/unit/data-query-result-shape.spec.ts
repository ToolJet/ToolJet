/** @group database */
/**
 * The result shape apps read from ToolJet Database queries. Apps bind to `data.results` (SQL mode) and
 * `data.result` (join) - changing either breaks every existing app on upgrade, so it is pinned here.
 * Internal callers (the TJDB dashboard) call sqlExecution()/joinTables() directly and get the raw rows.
 */
import { TooljetDbDataOperationsService } from '@modules/tooljet-db/services/tooljet-db-data-operations.service';

describe('TooljetDbDataOperationsService.run | result shape apps read', () => {
  const rows = [{ id: 1, item: 'apple' }];

  function buildService() {
    const service = Object.create(TooljetDbDataOperationsService.prototype);
    service.sqlExecution = jest.fn().mockResolvedValue({ status: 'ok', data: rows });
    service.joinTables = jest.fn().mockResolvedValue({ status: 'ok', data: rows });
    return service as TooljetDbDataOperationsService;
  }

  const run = (service: TooljetDbDataOperationsService, operation: string) =>
    service.run({}, { operation }, undefined, undefined, {});

  it('should return SQL mode rows under data.results', async () => {
    await expect(run(buildService(), 'sql_execution')).resolves.toEqual({ status: 'ok', data: { results: rows } });
  });

  it('should return join rows under data.result', async () => {
    await expect(run(buildService(), 'join_tables')).resolves.toEqual({ status: 'ok', data: { result: rows } });
  });

  it('should pass a failed SQL result through unchanged', async () => {
    const service = buildService();
    const failed = { status: 'failed', errorMessage: 'row limit', data: {} };
    (service.sqlExecution as jest.Mock).mockResolvedValue(failed);

    await expect(run(service, 'sql_execution')).resolves.toBe(failed);
  });
});
