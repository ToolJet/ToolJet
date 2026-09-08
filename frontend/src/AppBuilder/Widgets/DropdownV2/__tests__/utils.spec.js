/**
 * DropdownV2 option sorting — the one Unit-layer scenario in the approved
 * contract (ee/test/app-builder/widgets/DropdownV2/TESTING.md).
 *
 * `sortArray` is the deterministic seam behind the registered `sort` property:
 * DropdownV2.jsx builds `selectOptions` and hands the result to it, so option
 * ORDER is decided here while option identity (the typed `value` each label
 * carries) must survive untouched. The fixture is deep-frozen on purpose —
 * the helper receives a memoised array that other renders read, so sorting in
 * place is a real defect, not a style preference.
 */
import { sortArray } from '../utils';

/** Labels deliberately out of alphabetical order, values deliberately not strings. */
const buildOptions = () => [
  { label: 'Gamma', value: 0 },
  { label: 'alpha', value: false },
  { label: 'Beta', value: 'b' },
];

/** The same fixture, frozen — the shape the immutability guarantee needs. */
const buildFrozenOptions = () => Object.freeze(buildOptions().map(Object.freeze));

describe('DropdownV2 sortArray', () => {
  // Break this catches: swapping `none`/`asc`/`desc` branches, comparing on
  // `value` instead of `label`, or dropping the localeCompare so 'alpha' sorts
  // after 'Gamma' by code point.
  test.each([
    ['none', ['Gamma', 'alpha', 'Beta']],
    ['asc', ['alpha', 'Beta', 'Gamma']],
    ['desc', ['Gamma', 'Beta', 'alpha']],
  ])('[DropdownV2-OPT-007] sort %s presents labels as %s', (sort, expectedLabels) => {
    const options = buildOptions();

    const sorted = sortArray(options, sort);

    expect(sorted.map((option) => option.label)).toEqual(expectedLabels);
    // Presentation changed; identity did not — each label keeps its own typed value.
    expect(sorted.map((option) => [option.label, option.value])).toEqual(
      expectedLabels.map((label) => [label, options.find((option) => option.label === label).value])
    );
  });

  /**
   * PENDING A PRODUCTION FIX — kept as `test.failing` so the approved
   * guarantee is recorded and the day someone fixes it, this file says so.
   *
   * `sortArray` sorts IN PLACE (`arr.sort(...)`), so it reorders the caller's
   * array rather than returning a new one. DropdownV2, MultiselectV2 and
   * TagsInput all hand it a memoised `selectOptions`; two call sites in
   * Inspector/Components/Select.jsx already work around it by passing
   * `[...options]`, which is the tell. The fix is `[...arr].sort(...)` in both
   * branches of utils.js, at which point this test starts passing and the
   * `.failing` marker must be dropped.
   */
  test.failing('[DropdownV2-OPT-007] sorting leaves the caller’s array untouched', () => {
    const options = buildFrozenOptions();

    sortArray(options, 'asc');

    expect(options.map((option) => option.label)).toEqual(['Gamma', 'alpha', 'Beta']);
  });
});
