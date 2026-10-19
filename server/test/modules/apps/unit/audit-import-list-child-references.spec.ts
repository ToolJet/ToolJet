/**
 * Import rename: a widget in a List view row is read through the list (`components.list1.children[0].tags1`), keyed by
 * the widget's name; those references are renamed like direct ones.
 *
 * Adopted from the release audit evidence (repros/review-legacy-references.spec.ts, 18 Oct), import path adapted.
 */
import {
  buildRenamesByComponentRef,
  rewriteBindings,
  rewriteReferences,
} from '@modules/apps/services/ui2-legacy-names';

const refs = buildRenamesByComponentRef([
  { id: 'list-id', name: 'list1', type: 'ShadListView' },
  { id: 'tags-id', name: 'tags1', type: 'ShadTagsInput' },
]);
const rewrite = (text: string) => rewriteReferences(text, refs);

test.each([
  ['a direct reference', 'components.tags1.tags', 'components.tags1.values'],
  ['a row', 'components.tags1[0].tags', 'components.tags1[0].values'],
  ['a computed row', 'components.tags1[variables.row].tags', 'components.tags1[variables.row].values'],
  ['a child of a row', 'components.list1.children[0].tags1.tags', 'components.list1.children[0].tags1.values'],
  ['a child of a computed row', 'components.list1.children[i].tags1.tags', 'components.list1.children[i].tags1.values'],
  [
    'a child of a nested list',
    'components.outer1.children[0].list1.children[2].tags1.tags',
    'components.outer1.children[0].list1.children[2].tags1.values',
  ],
  [
    'a child action call',
    'components.list1.children[0].tags1.disable(true)',
    'components.list1.children[0].tags1.setDisable(true)',
  ],
  [
    'an action passed on',
    'const reset = components.tags1.disable; reset(true);',
    'const reset = components.tags1.setDisable; reset(true);',
  ],
])('%s is renamed', (_, input, expected) => {
  expect(rewrite(input)).toBe(expected);
});

test.each([
  ['a string', 'const label = "components.list1.children[0].tags1.tags";'],
  ['a key that is not children', 'return components.list1.data[0].tags1.tags;'],
  ['a child name that is not a widget', 'return components.list1.children[0].other1.tags;'],
  ['a children key read as a name', "return components.list1.children['tags1'].tags;"],
])('%s is left alone', (_, code) => {
  expect(rewrite(code)).toBe(code);
});

test('a child reference in a binding', () => {
  expect(rewriteBindings('{{ components.list1.children[0].tags1.tags.length }}', refs)).toBe(
    '{{ components.list1.children[0].tags1.values.length }}'
  );
});
