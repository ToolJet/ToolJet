import { DataSourcesService } from '../../../../src/modules/data-sources/service';

function serviceWith(dataSources: object[]): DataSourcesService {
  return new DataSourcesService(
    { allGlobalDS: jest.fn().mockResolvedValue(dataSources) } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any
  );
}

const pluginSchema = {
  properties: {
    operation: {
      type: 'dropdown-component-flip',
      commonFields: {
        model: {
          type: 'dynamic-selector',
          dependsOn: ['operation'],
          autoFetch: true,
          operation: { invokeMethod: 'listModels' },
        },
      },
    },
  },
};

describe('DataSourcesService.getForApp', () => {
  it('decamelizes data source scalars', async () => {
    const { data_sources } = await serviceWith([
      { id: 'data-source-id', organizationId: 'organization-id', scope: 'global' },
    ]).getForApp({}, { organizationId: 'organization-id' } as any, {} as any);

    expect(data_sources[0]).toMatchObject({ organization_id: 'organization-id' });
  });

  it('ships plugin schemas verbatim so dynamic form fields keep their camelCase keys', async () => {
    const { data_sources } = await serviceWith([
      {
        id: 'data-source-id',
        organizationId: 'organization-id',
        pluginId: 'plugin-id',
        plugin: {
          id: 'plugin-id',
          operationsFile: { data: pluginSchema },
          manifestFile: { data: { files: [] } },
          iconFile: { data: '<svg></svg>' },
        },
      },
    ]).getForApp({}, { organizationId: 'organization-id' } as any, {} as any);

    const plugin = (data_sources[0] as any).plugin;
    expect(plugin.operations_file.data).toEqual(pluginSchema);
    expect(plugin.manifest_file.data).toEqual({ files: [] });
    expect(plugin.icon_file.data).toBe('<svg></svg>');
    expect(JSON.stringify(data_sources)).not.toContain('common_fields');
  });
});
