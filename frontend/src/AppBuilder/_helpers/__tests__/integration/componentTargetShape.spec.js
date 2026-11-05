import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { buildComponentTargetShape, buildMentionedComponentShapes } from '../../componentTargetShape';

// Table contracts use configured data keys and never copy cell values into AI context.
test('describes table fields and labels from the live component definition', () => {
  seedApp({
    telescope: componentDefinition('telescope', 'telescopeTable', 'Table', {
      columns: binding([
        { key: 'altitude', name: 'Altitude', columnType: 'number' },
        { name: 'station' },
        null,
        { key: 9 },
        {},
      ]),
    }),
  });
  expect(buildComponentTargetShape('telescopeTable')).toEqual({
    version: 1,
    name: 'telescopeTable',
    type: 'Table',
    page: 'Home',
    expects: 'array of flat row objects, one per table row',
    fields: [{ key: 'altitude', label: 'Altitude', columnType: 'number' }, { key: 'station' }],
  });
});

// Resolved dynamic columns override stale saved column definitions.
test('uses resolved columns and reports unconstrained tables without invented fields', () => {
  seedApp({ telescope: componentDefinition('telescope', 'telescopeTable', 'Table', { columns: binding([]) }) });
  expect(buildComponentTargetShape('telescopeTable')).toMatchObject({
    note: expect.stringContaining('no columns configured'),
  });
  useStore
    .getState()
    .setResolvedComponent('telescope', { properties: { columns: [{ key: 'exposure', name: 'Exposure' }] } });
  expect(buildComponentTargetShape('telescopeTable').fields).toEqual([{ key: 'exposure', label: 'Exposure' }]);
});

// Fixed widget contracts describe the expected output fields for AI transformations.
test.each([
  ['Chart', ['x', 'y']],
  ['Calendar', ['title', 'start', 'end', 'resourceId']],
  ['Kanban', ['id', 'title', 'columnId']],
  ['DropdownV2', ['label', 'value']],
  ['MultiselectV2', ['label', 'value']],
])('describes the %s output contract', (type, keys) => {
  seedApp({ output: componentDefinition('output', 'outputView', type) });
  expect(buildComponentTargetShape('outputView').fields.map(({ key }) => key)).toEqual(keys);
});

// List contracts include only distinct fields referenced by their own children.
test('collects dot and bracket listItem references from child slots', () => {
  const child = componentDefinition('caption', 'caption', 'Text', {
    text: binding("{{listItem.station + listItem['altitude'] + listItem.station}}"),
  });
  child.component.parent = 'observations-header';
  const unrelated = componentDefinition('other', 'other', 'Text', { text: binding('{{listItem.privateField}}') });
  unrelated.component.parent = 'different-list';
  seedApp({
    observations: componentDefinition('observations', 'observationsList', 'Listview'),
    caption: child,
    other: unrelated,
  });
  expect(buildComponentTargetShape('observationsList').fields).toEqual([{ key: 'station' }, { key: 'altitude' }]);
});

// Missing names and unrelated modules cannot borrow another canvas's contract.
test('handles missing, unconstrained and unshaped components without guessing', () => {
  seedApp({
    list: componentDefinition('list', 'observationsList', 'Listview'),
    label: componentDefinition('label', 'caption', 'Text'),
  });
  expect(buildComponentTargetShape('observationsList')).toMatchObject({
    note: expect.stringContaining('No child component'),
  });
  expect(buildComponentTargetShape('caption')).toEqual({ version: 1, name: 'caption', type: 'Text', page: 'Home' });
  expect(buildComponentTargetShape('caption', 'other-module')).toBeNull();
  expect(buildComponentTargetShape('missing')).toBeNull();
  expect(buildComponentTargetShape('')).toBeNull();
});

// Mention boundaries, escaped names and the context cap prevent accidental over-sharing.
test('matches complete component mentions and limits context to three targets', () => {
  seedApp(
    Object.fromEntries(
      ['plot', 'plotOld', 'plot.v2', 'fourth'].map((name, index) => [
        `c${index}`,
        componentDefinition(`c${index}`, name, 'Chart'),
      ])
    )
  );
  expect(buildMentionedComponentShapes('Use @plotOld and @plot.v2').map(({ name }) => name)).toEqual([
    'plotOld',
    'plot.v2',
  ]);
  expect(buildMentionedComponentShapes('email@plot, @plot.v20')).toEqual([]);
  expect(buildMentionedComponentShapes('@plot, @plotOld @plot.v2 @fourth').map(({ name }) => name)).toEqual([
    'plot',
    'plotOld',
    'plot.v2',
  ]);
  expect(buildMentionedComponentShapes('')).toEqual([]);
});
