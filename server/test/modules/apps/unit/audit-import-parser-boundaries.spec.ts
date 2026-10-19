/**
 * Import rename: only what the code reads as an app reference is renamed. A string in parentheses or followed by a
 * comment is text, and a local variable or parameter named `components` is not the app's components.
 *
 * Adopted from the release audit evidence (repros/integrated/reviewImportParserBoundaries.spec.ts and
 * reviewAssemblyImportPublicBoundary.spec.ts, 18 Oct), import path adapted.
 */
import {
  applyUi2RenamesToImport,
  buildRenamesByComponentRef,
  rewriteBindings,
  rewriteReferences,
} from '@modules/apps/services/ui2-legacy-names';

const refs = buildRenamesByComponentRef([{ id: 'tags-id', name: 'tags1', type: 'ShadTagsInput' }]);

const BINDINGS = [
  ['plain string', '{{ "components.tags1.tags" }}', '{{ "components.tags1.tags" }}'],
  ['parenthesized string', '{{ ("components.tags1.tags") }}', '{{ ("components.tags1.tags") }}'],
  ['string and a comment', '{{ "components.tags1.tags" /* label */ }}', '{{ "components.tags1.tags" /* label */ }}'],
  ['string and a line comment', '{{ "components.tags1.tags" // label\n}}', '{{ "components.tags1.tags" // label\n}}'],
  [
    'mixed, in parentheses',
    '{{ ("components.tags1.tags" + components.tags1.tags.length) }}',
    '{{ ("components.tags1.tags" + components.tags1.values.length) }}',
  ],
  [
    'two bindings',
    'Label {{ components.tags1.tags.length }} / {{ "components.tags1.tags" }}',
    'Label {{ components.tags1.values.length }} / {{ "components.tags1.tags" }}',
  ],
  ['a reference', '{{components.tags1.tags}}', '{{components.tags1.values}}'],
  ['a reference in parentheses', '{{ (components.tags1).tags }}', '{{ (components.tags1).values }}'],
  ['an action in parentheses', '{{ (components.tags1.disable)(true) }}', '{{ (components.tags1.setDisable)(true) }}'],
];

const SHADOWED = [
  'function label(components) { return components.tags1.tags; }',
  'const render = (components) => components.tags1.tags;',
  'const render = ({ components }) => components.tags1.tags;',
  '{ const components = { tags1: { tags: ["local"] } }; console.log(components.tags1.tags); }',
  'try { run(); } catch (components) { log(components.tags1.tags); }',
  'for (const components of lists) log(components.tags1.tags);',
  'function f() { if (x) { var components = y; } return components.tags1.tags; }',
];

describe('rewriteBindings', () => {
  it.each(BINDINGS)('%s', (_, input, expected) => {
    expect(rewriteBindings(input, refs)).toBe(expected);
  });
});

describe('rewriteReferences', () => {
  it.each(SHADOWED)('leaves a local `components` alone: %s', (code) => {
    expect(rewriteReferences(code, refs)).toBe(code);
  });

  it('renames the app reference next to a local one', () => {
    const code = 'const read = (components) => components.tags1.tags;\nreturn components.tags1.tags;';
    expect(rewriteReferences(code, refs)).toBe(
      'const read = (components) => components.tags1.tags;\nreturn components.tags1.values;'
    );
  });
});

describe('applyUi2RenamesToImport', () => {
  const imported = (text: string, code = 'return components.tags1.tags;') => {
    const data = {
      pages: [{ id: 'p', appVersionId: 'v' }],
      components: [
        { id: 'tags', name: 'tags1', type: 'ShadTagsInput', pageId: 'p', properties: {} },
        { id: 'label', name: 'label1', type: 'Text', pageId: 'p', properties: { text: { value: text } } },
      ],
      dataQueries: [{ appVersionId: 'v', options: { code } }],
    };
    applyUi2RenamesToImport(data);
    return { text: data.components[1].properties.text.value, code: data.dataQueries[0].options.code };
  };

  it.each(BINDINGS)('%s binding', (_, input, expected) => {
    expect(imported(input)).toEqual({ text: expected, code: 'return components.tags1.values;' });
  });

  it.each(SHADOWED)('keeps local scope in query code: %s', (code) => {
    expect(imported('Caption', code)).toEqual({ text: 'Caption', code });
  });
});
