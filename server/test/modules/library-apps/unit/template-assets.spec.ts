import {
  deriveSources,
  TemplateDefinition,
  TemplateManifest,
  validateManifest,
} from '@modules/templates/template-assets';

function definitionWith(
  dataSources: Array<{ id: string; kind: string }>,
  queryDataSourceIds: string[]
): TemplateDefinition {
  return {
    app: [
      {
        definition: {
          appV2: { dataSources, dataQueries: queryDataSourceIds.map((dataSourceId) => ({ dataSourceId })) },
        },
      },
    ],
  };
}

const validManifest: TemplateManifest = {
  id: 'hvac-service-management',
  name: 'HVAC service management',
  description: 'Dispatch HVAC jobs.',
  category: 'field-services',
  sources: [],
};
const categories = { 'field-services': 'Field services' };

/** @group platform */
describe('templates assets', () => {
  describe('deriveSources', () => {
    const noPlugins = () => undefined;

    it('should list only the kinds that queries use, once each, sorted by id', () => {
      const definition = definitionWith(
        [
          { id: 'ds-db', kind: 'tooljetdb' },
          { id: 'ds-js', kind: 'runjs' },
          { id: 'ds-py', kind: 'runpy' },
        ],
        ['ds-db', 'ds-js', 'ds-db']
      );

      expect(deriveSources(definition, noPlugins)).toEqual([
        { id: 'runjs', name: 'Run JavaScript' },
        { id: 'tooljetdb', name: 'ToolJet Database' },
      ]);
    });

    it('should name plugin kinds from the plugin manifest', () => {
      const definition = definitionWith([{ id: 'ds-pg', kind: 'postgresql' }], ['ds-pg']);

      expect(deriveSources(definition, (kind) => (kind === 'postgresql' ? 'PostgreSQL' : undefined))).toEqual([
        { id: 'postgresql', name: 'PostgreSQL' },
      ]);
    });

    it('should throw when a kind has no known name', () => {
      const definition = definitionWith([{ id: 'ds-x', kind: 'mystery' }], ['ds-x']);

      expect(() => deriveSources(definition, noPlugins)).toThrow('Unknown data source kind "mystery"');
    });
  });

  describe('validateManifest', () => {
    it('should accept a valid manifest', () => {
      expect(validateManifest('hvac-service-management', validManifest, categories, true)).toEqual([]);
    });

    it.each([
      ['a missing name', { ...validManifest, name: '' }, 'name is required'],
      ['a missing description', { ...validManifest, description: ' ' }, 'description is required'],
      ['an id that is not the folder name', { ...validManifest, id: 'other' }, 'id "other" must equal the folder name'],
      ['an unknown category', { ...validManifest, category: 'nope' }, 'category "nope" is not in categories.json'],
      ['a name over 90 characters', { ...validManifest, name: 'x'.repeat(91) }, 'name is longer than 90 characters'],
      [
        'features that are not strings',
        { ...validManifest, features: [1] as unknown as string[] },
        'features must be an array of strings',
      ],
    ])('should reject %s', (_, manifest, error) => {
      expect(validateManifest('hvac-service-management', manifest, categories, true)).toContain(error);
    });

    it('should reject a template without a preview file', () => {
      expect(validateManifest('hvac-service-management', validManifest, categories, false)).toContain(
        'preview hvac-service-management.html is missing'
      );
    });
  });
});
