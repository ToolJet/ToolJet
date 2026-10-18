/**
 * Import rename: component and key names that match Object.prototype members are not treated as renames.
 *
 * Adopted from the release audit evidence (repros/integrated/reviewSplitImportPrototypeNames.spec.ts, 16 Oct), import path adapted.
 */
import { applyUi2RenamesToImport } from '@modules/apps/services/ui2-legacy-names';
const fixture = (text: string) => ({
  pages: [{ id: 'p', appVersionId: 'v' }],
  components: [
    { id: 'tags-id', name: 'tags1', type: 'ShadTagsInput', pageId: 'p', properties: {} },
    { id: 'text-id', name: 'text1', type: 'Text', pageId: 'p', properties: { text: { value: text } } },
  ],
  events: [],
  dataQueries: [],
});
test.each(['constructor', 'toString', '__proto__'])(
  'plain documentation mentioning components.%s.name must not crash import',
  (name) => {
    const text = `Example: components.${name}.name`;
    const data = fixture(text);
    expect(() => applyUi2RenamesToImport(data)).not.toThrow();
    expect(data.components[1].properties).toEqual({ text: { value: text } });
  }
);
test('unrelated ordinary component names are preserved', () => {
  const text = 'Example: components.missing.name';
  const data = fixture(text);
  applyUi2RenamesToImport(data);
  expect(data.components[1].properties).toEqual({ text: { value: text } });
});
test('supported references still migrate', () => {
  const data = fixture('{{components.tags1.tags}}');
  applyUi2RenamesToImport(data);
  expect(data.components[1].properties).toEqual({ text: { value: '{{components.tags1.values}}' } });
});
