/**
 * The FlexContainer layout-version migration, through the compat replay: a FlexContainer in a UI 2.0 app saved before
 * the flag gets the UI 2.0 layout's flag (and Equal heights, on); one in a UI 1.0 app, or one that has a flag, does not
 * change. None of the saved-app fixtures has a FlexContainer, so this covers the stand-in's answers to its queries.
 */
import { usesFlexLayoutV2 } from '@/AppBuilder/_helpers/flexLayoutVersion';
import { migrate } from './migrationReplay';

jest.mock(
  '@helpers/migration.helper',
  () => ({
    MigrationProgress: class {
      show() {}
    },
    deleteAppHistoryForStructuralMigration: async () => {},
  }),
  { virtual: true }
);

const flex = (id, pageId, properties) => ({ id, name: id, type: 'FlexContainer', pageId, properties });
const widget = (id, type, pageId) => ({ id, name: id, type, pageId, properties: {} });

const app = (components, appVersions) => ({
  pages: [
    { id: 'p-ui2', appVersionId: 'v-ui2' },
    { id: 'p-ui1', appVersionId: 'v-ui1' },
    { id: 'p-saved', appVersionId: 'v-saved' },
  ],
  components,
  events: [],
  dataQueries: [],
  ...(appVersions ? { appVersions } : {}),
});

const propertiesOf = (migrated, id) => migrated.components.find((c) => c.id === id).properties;

describe('FlexContainer layout version, replayed', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('stamps a container in a UI 2.0 app, after its saved keys', async () => {
    const migrated = await migrate(
      app([
        widget('button1', 'ShadButton', 'p-ui2'),
        flex('row1', 'p-ui2', { direction: { value: 'row' }, gap: { value: 8 } }),
      ])
    );
    const properties = propertiesOf(migrated, 'row1');
    expect(Object.keys(properties)).toEqual(['direction', 'gap', 'layoutVersion', 'equalHeights']);
    expect(properties.layoutVersion).toEqual({ value: '2' });
    expect(properties.equalHeights).toEqual({ value: '{{true}}' });
    expect(usesFlexLayoutV2(properties)).toBe(true);
  });

  it('leaves a container in a UI 1.0 app alone, inferred or saved', async () => {
    const saved = { direction: { value: 'column' } };
    const migrated = await migrate(
      app(
        [
          widget('button1', 'Button', 'p-ui1'),
          flex('col1', 'p-ui1', saved),
          // A saved 'ui1' wins even over a Shad* widget in the version.
          widget('stat1', 'ShadStat', 'p-saved'),
          flex('col2', 'p-saved', saved),
        ],
        [{ id: 'v-saved', globalSettings: { componentLibrary: 'ui1' } }]
      )
    );
    expect(propertiesOf(migrated, 'col1')).toEqual(saved);
    expect(propertiesOf(migrated, 'col2')).toEqual(saved);
  });

  it('keeps a container that already has a layout version, and a hand-set Equal heights', async () => {
    const flagged = { layoutVersion: { value: '2' }, equalHeights: { value: '{{false}}' } };
    const handSet = { equalHeights: { value: '{{false}}' } };
    const migrated = await migrate(
      app([widget('button1', 'ShadButton', 'p-ui2'), flex('row1', 'p-ui2', flagged), flex('row2', 'p-ui2', handSet)])
    );
    expect(propertiesOf(migrated, 'row1')).toEqual(flagged);
    expect(propertiesOf(migrated, 'row2')).toEqual({ ...handSet, layoutVersion: { value: '2' } });
  });
});
