/**
 * Import rename across a whole app: properties, events and query code, per version, idempotent, with action aliases.
 *
 * Adopted from the release audit evidence (repros/integrated/reviewSplitImportNormalization.spec.ts, 16 Oct), import path adapted.
 */
import { applyUi2RenamesToImport } from '@modules/apps/services/ui2-legacy-names';

const fixture = () => ({
  pages: [
    { id: 'p1', appVersionId: 'v1' },
    { id: 'p2', appVersionId: 'v2' },
  ],
  components: [
    { id: 'tags1-id', name: 'tags1', type: 'ShadTagsInput', pageId: 'p1', properties: {} },
    {
      id: 'link1-id',
      name: 'link1',
      type: 'ShadLink',
      pageId: 'p1',
      properties: { href: { value: 'https://example.com' }, text: { value: 'Docs' } },
    },
    { id: 'native-tags-id', name: 'tags1', type: 'Tags', pageId: 'p2', properties: {} },
  ],
  events: [
    {
      name: 'onTagRemoved',
      sourceId: 'tags1-id',
      appVersionId: 'v1',
      event: {
        eventId: 'onTagRemoved',
        actionId: 'control-component',
        componentId: 'tags1-id',
        componentSpecificActionHandle: 'disable',
      },
    },
  ],
  dataQueries: [
    { id: 'q1', appVersionId: 'v1', options: { code: 'return components.tags1.tags;' } },
    { id: 'q2', appVersionId: 'v2', options: { code: 'return components.tags1.tags;' } },
  ],
});

test('normalization handles properties, events and query references without crossing versions', () => {
  const data = fixture();
  applyUi2RenamesToImport(data);
  expect(data.components[1].properties).toEqual({
    linkTarget: { value: 'https://example.com' },
    linkText: { value: 'Docs' },
  });
  expect(data.events[0]).toMatchObject({
    name: 'onTagDeleted',
    event: { eventId: 'onTagDeleted', componentSpecificActionHandle: 'setDisable' },
  });
  expect(data.dataQueries[0].options.code).toBe('return components.tags1.values;');
  expect(data.dataQueries[1].options.code).toBe('return components.tags1.tags;');
});
test('a second normalization is idempotent for supported references', () => {
  const data = fixture();
  applyUi2RenamesToImport(data);
  const once = JSON.stringify(data);
  applyUi2RenamesToImport(data);
  expect(JSON.stringify(data)).toBe(once);
});
test('normalization preserves RunJS literal data while rewriting actual access', () => {
  const data = fixture();
  data.dataQueries[0].options.code = 'const label="components.tags1.tags"; return components.tags1.tags;';
  applyUi2RenamesToImport(data);
  expect(data.dataQueries[0].options.code).toBe('const label="components.tags1.tags"; return components.tags1.values;');
});
test('normalization preserves callable aliases for renamed actions', () => {
  const data = fixture();
  data.dataQueries[0].options.code = 'const setDisabled=components.tags1.disable; return setDisabled(true);';
  applyUi2RenamesToImport(data);
  expect(data.dataQueries[0].options.code).toBe(
    'const setDisabled=components.tags1.setDisable; return setDisabled(true);'
  );
});
