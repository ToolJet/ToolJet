/**
 * Import rename: references in each JavaScript shape (rows, optional access, strings, comments) keep their meaning.
 *
 * Adopted from the release audit evidence (repros/integrated/reviewSplitImportExpressionShapes.spec.ts, 16 Oct), import path adapted.
 */
import { buildRenamesByComponentRef, rewriteReferences } from '@modules/apps/services/ui2-legacy-names';
const refs = buildRenamesByComponentRef([{ id: 'tags-id', name: 'tags1', type: 'ShadTagsInput' }]);
test.each([
  ['static row', 'components.tags1[0].tags', 'components.tags1[0].values'],
  ['dynamic row', 'components.tags1[index].tags', 'components.tags1[index].values'],
  ['computed row', 'components.tags1[variables.row].tags', 'components.tags1[variables.row].values'],
  ['optional access', "components?.['tags1']?.[0]?.tags", "components?.['tags1']?.[0]?.values"],
  [
    'literal and actual access',
    'const label="components.tags1.tags"; return components.tags1.tags;',
    'const label="components.tags1.tags"; return components.tags1.values;',
  ],
  [
    'template text and interpolation',
    '`components.tags1.tags: ${components.tags1.tags}`',
    '`components.tags1.tags: ${components.tags1.values}`',
  ],
  [
    'action comment before call',
    'components.tags1.disable /* reason */ (true)',
    'components.tags1.setDisable /* reason */ (true)',
  ],
  ['plain action call', 'components.tags1.disable(true)', 'components.tags1.setDisable(true)'],
])('%s preserves JavaScript meaning during rename', (name, input, expected) => {
  expect(rewriteReferences(input, refs)).toBe(expected);
});
