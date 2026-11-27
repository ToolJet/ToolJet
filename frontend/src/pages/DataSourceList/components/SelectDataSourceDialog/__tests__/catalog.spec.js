import { buildCatalogSections } from '../catalog';

jest.mock('@/modules/common/components/DataSourceComponents', () => ({
  DataBaseSources: [
    { name: 'PostgreSQL', kind: 'postgresql', description: 'Read and write tables with SQL queries.' },
    { name: 'Legacy DB', kind: 'legacydb' },
  ],
  ApiSources: [],
  CloudStorageSources: [],
  AiSources: [],
  getCommonlyUsedDataSources: () => [],
}));

const descriptionsByName = (installedPlugins) => {
  const items = buildCatalogSections(installedPlugins, { includePlugins: true }).flatMap((section) => section.items);
  return Object.fromEntries(items.map((item) => [item.name, item.description]));
};

describe('buildCatalogSections descriptions', () => {
  it('uses the description a built-in source carries', () => {
    expect(descriptionsByName([])['PostgreSQL']).toBe('Read and write tables with SQL queries.');
  });

  it('reads an installed plugin description from its tj:source manifest', () => {
    const plugin = {
      id: 'p1',
      name: 'Anthropic',
      kind: 'anthropic',
      description: 'Old marketplace listing text',
      manifestFile: { data: { 'tj:source': { type: 'ai', description: 'Run chat prompts with Claude models.' } } },
    };
    expect(descriptionsByName([plugin])['Anthropic']).toBe('Run chat prompts with Claude models.');
  });

  it('reads an installed plugin description from an old-format source manifest', () => {
    const plugin = {
      id: 'p2',
      name: 'PrestoDB',
      kind: 'Presto',
      manifestFile: { data: { source: { description: 'Run SQL queries on data across multiple sources.' } } },
    };
    expect(descriptionsByName([plugin])['PrestoDB']).toBe('Run SQL queries on data across multiple sources.');
  });

  it('leaves the description empty when the manifest has none, ignoring the plugin row description', () => {
    const plugin = {
      id: 'p3',
      name: 'Old Plugin',
      kind: 'old',
      description: 'Old marketplace listing text',
      manifestFile: { data: { 'tj:source': { type: 'api' } } },
    };
    const descriptions = descriptionsByName([plugin]);
    expect(descriptions['Old Plugin']).toBeUndefined();
    expect(descriptions['Legacy DB']).toBeUndefined();
  });
});
