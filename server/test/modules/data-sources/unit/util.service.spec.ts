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

describe('DataSourcesUtilService.testConnection | option & credential binding', () => {
  function makeService({
    getOptions,
    getValue,
    pluginTestConnection,
    getService,
  }: {
    getOptions?: jest.Mock;
    getValue?: jest.Mock;
    pluginTestConnection?: jest.Mock;
    getService?: jest.Mock;
  }) {
    const pluginTest = pluginTestConnection ?? jest.fn().mockResolvedValue({ status: 'ok' });
    const getServiceFn = getService ?? jest.fn().mockResolvedValue({ testConnection: pluginTest });
    const service = new DataSourcesUtilService(
      { getOptions: getOptions ?? jest.fn().mockResolvedValue({ options: {} }) } as any,
      { getValue: getValue ?? jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      { getService: getServiceFn } as any,
      {} as any,
      {} as any,
      {} as any
    );
    return { service, pluginTest, getServiceFn };
  }

  const persistedDataSource = { kind: 'couchdb', pluginId: 'couchdb-plugin-id' } as any;

  it('ignores body host/port and tests the SAVED options for a use-only (non-editor) caller', async () => {
    const storedOptions = {
      host: { value: 'saved-host.internal' },
      port: { value: '5984' },
      username: { value: 'admin' },
      password: { credential_id: 'cred-stored', encrypted: true },
    };
    const { service, pluginTest } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: storedOptions }),
      getValue: jest.fn().mockResolvedValue('STORED_SECRET'),
    });

    const body = {
      kind: 'couchdb',
      plugin_id: 'couchdb-plugin-id',
      environment_id: 'env',
      options: {
        host: { value: 'attacker.evil.com' },
        port: { value: '9099' },
        username: { value: 'admin' },
        password: { credential_id: 'cred-stored', encrypted: true },
      },
    } as any;

    await service.testConnection(body, 'org', 'ds-1', undefined, {
      dataSource: persistedDataSource,
      canEditDataSource: false,
    });

    const sentOptions = pluginTest.mock.calls[0][0];
    expect(sentOptions.host).toBe('saved-host.internal');
    expect(sentOptions.port).toBe('5984');
    expect(sentOptions.password).toBe('STORED_SECRET');
  });

  it('does not resolve body-injected {{secrets.*}} for a use-only (non-editor) caller', async () => {
    const storedOptions = {
      host: { value: 'saved-host.internal' },
      username: { value: 'admin' },
      password: { value: 'placeholder' },
    };
    const getValue = jest.fn();
    const { service, pluginTest } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: storedOptions }),
      getValue,
    });

    const body = {
      kind: 'couchdb',
      plugin_id: 'couchdb-plugin-id',
      environment_id: 'env',
      options: {
        host: { value: 'attacker.evil.com' },
        username: { value: '{{secrets.DB_PASS}}' },
        password: { value: 'x' },
      },
    } as any;

    await service.testConnection(body, 'org', 'ds-1', undefined, {
      dataSource: persistedDataSource,
      canEditDataSource: false,
    });

    const sentOptions = pluginTest.mock.calls[0][0];
    expect(sentOptions.username).toBe('admin');
    expect(sentOptions.username).not.toContain('{{secrets');
    expect(sentOptions.host).toBe('saved-host.internal');
  });

  it('takes kind/plugin_id from the persisted data source, never the request body', async () => {
    const getServiceFn = jest.fn().mockResolvedValue({ testConnection: jest.fn().mockResolvedValue({ status: 'ok' }) });
    const { service } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: { host: { value: 'saved-host.internal' } } }),
      getService: getServiceFn,
    });

    const body = {
      kind: 'restapi',
      plugin_id: 'evil-plugin',
      environment_id: 'env',
      options: {},
    } as any;

    await service.testConnection(body, 'org', 'ds-1', undefined, {
      dataSource: persistedDataSource,
      canEditDataSource: false,
    });

    expect(getServiceFn).toHaveBeenCalledWith('couchdb-plugin-id', 'couchdb');
  });

  it('lets an editor test unsaved body options (test-before-save) when the credential_id matches', async () => {
    const storedOptions = {
      host: { value: 'saved-host.internal' },
      username: { value: 'admin' },
      password: { credential_id: 'cred-stored', encrypted: true },
    };
    const { service, pluginTest } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: storedOptions }),
      getValue: jest.fn().mockResolvedValue('STORED_SECRET'),
    });

    const body = {
      kind: 'couchdb',
      plugin_id: 'couchdb-plugin-id',
      environment_id: 'env',
      options: {
        host: { value: 'new-host.internal' },
        username: { value: 'admin' },
        password: { credential_id: 'cred-stored', encrypted: true },
      },
    } as any;

    await service.testConnection(body, 'org', 'ds-1', undefined, {
      dataSource: persistedDataSource,
      canEditDataSource: true,
    });

    expect(pluginTest.mock.calls[0][0].host).toBe('new-host.internal');
  });

  it('rejects an editor whose body credential_id does not belong to the data source', async () => {
    const storedOptions = {
      password: { credential_id: 'cred-stored', encrypted: true },
    };
    const { service } = makeService({
      getOptions: jest.fn().mockResolvedValue({ options: storedOptions }),
      getValue: jest.fn().mockResolvedValue('STORED_SECRET'),
    });

    const body = {
      kind: 'couchdb',
      plugin_id: 'couchdb-plugin-id',
      environment_id: 'env',
      options: {
        password: { credential_id: 'cred-foreign', encrypted: true },
      },
    } as any;

    await expect(
      service.testConnection(body, 'org', 'ds-1', undefined, {
        dataSource: persistedDataSource,
        canEditDataSource: true,
      })
    ).rejects.toThrow('credential_id does not belong to this data source');
  });
});
