import { DataSourcesUtilService } from '../../../../src/modules/data-sources/util.service';

function serviceWith(pluginService: object): DataSourcesUtilService {
  return new DataSourcesUtilService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { getService: jest.fn().mockResolvedValue(pluginService) } as any,
    {} as any,
    {} as any
  );
}

describe('DataSourcesUtilService.testConnection', () => {
  const input = { kind: 'plugin', options: {}, environment_id: 'environment' } as any;

  it('marks a missing plugin connection test as structurally unsupported', async () => {
    await expect(serviceWith({}).testConnection(input, 'organization')).resolves.toMatchObject({
      status: 'failed',
      category: 'unsupported',
      supported: false,
    });
  });

  it('does not mark an actual plugin failure as unsupported', async () => {
    const testConnection = jest.fn().mockRejectedValue(new Error('connection refused'));
    const result = await serviceWith({ testConnection }).testConnection(input, 'organization');

    expect(result).toMatchObject({ status: 'failed', message: expect.stringContaining('connection refused') });
    expect(result).not.toHaveProperty('category');
  });
});
