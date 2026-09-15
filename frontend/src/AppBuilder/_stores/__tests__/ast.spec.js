/**
 * Regression tests for the dependency-graph extractor used by the AppBuilder store.
 *
 * `ast.js` is a pure module (acorn + acorn-walk, no store access), so these tests use
 * ZERO mocks. Every case below is a shipped, user-visible bug class: when
 * `extractAndReplaceReferencesFromString` drops a reference from `allRefs`, the
 * dependency edge is silently lost and the bound property never updates again.
 */
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { findAllEntityReferences } from '@/AppBuilder/_stores/utils';

const UUID_A = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const UUID_B = '11111111-2222-3333-4444-555555555555';
const PLACEHOLDER = '__UUID_PLACEHOLDER_0__';

const ref = (entityNameOrId, entityKey, entityType = 'components') => ({ entityType, entityNameOrId, entityKey });

describe('extractAndReplaceReferencesFromString — whitespace before the closing braces', () => {
  // ast.js:56-61 — the triple-brace (object-literal) form is recognised by an
  // endsWith('}}}') test and is then rewritten to `{{({...})}}` so acorn sees a real
  // object expression. `{{{ a: x, b: y } }}` has a space between the inner object's `}`
  // and the template's `}}`, so without the normalisation at ast.js:58 it falls through
  // to the generic /{{(.*?)}}/ path, where the expression `{ a: x, b: y }` is parsed as
  // a *block statement* — invalid with more than one key — and the catch at ast.js:197
  // bails out with an EMPTY allRefs. The dependency edge is silently lost.
  //
  // NOTE: a single-key literal (`{{{ text: components.t1.value } }}`) survives even
  // without the guard, because `{ text: components.t1.value }` happens to be a valid
  // block statement (a label + a member expression). Multi-key literals are the ones
  // that regress, so they are what these tests use.
  it('extracts the reference when a multi-key object literal is followed by a space', () => {
    const result = extractAndReplaceReferencesFromString('{{{ text: components.t1.value, color: "red" } }}', {}, {});

    expect(result.allRefs).toEqual([ref('t1', 'value')]);
  });

  it('extracts the reference when the reference is not the first key', () => {
    const result = extractAndReplaceReferencesFromString('{{{ color: "red", text: components.t1.value } }}', {}, {});

    expect(result.allRefs).toEqual([ref('t1', 'value')]);
  });

  it('tolerates more than one space before the closing braces', () => {
    const result = extractAndReplaceReferencesFromString('{{{ text: queries.q1.data, x: 1 }   }}', {}, {});

    expect(result.allRefs).toEqual([ref('q1', 'data', 'queries')]);
  });

  it('extracts the same reference from the un-spaced form (control)', () => {
    const result = extractAndReplaceReferencesFromString('{{{ text: components.t1.value, color: "red" }}}', {}, {});

    expect(result.allRefs).toEqual([ref('t1', 'value')]);
  });
});

describe('extractAndReplaceReferencesFromString — numeric row index must not become the key', () => {
  // ast.js:406-409 (numeric-index skip in createReferenceObject) plus the
  // `path.length >= 3` gate at ast.js:384-385. Inside a ListView a binding reads
  // `components.t1[0].value`; if the numeric segment is taken as the key, the edge is
  // registered on the non-existent `components.t1.0` and `value` changes never propagate.
  it('registers components.t1[0].value under key "value", not key "0"', () => {
    const result = extractAndReplaceReferencesFromString('{{components.t1[0].value}}', {}, {});

    expect(result.allRefs).toContainEqual(ref('t1', 'value'));
  });

  it('skips several consecutive numeric segments', () => {
    const result = extractAndReplaceReferencesFromString('{{components.t1[0][2].value}}', {}, {});

    expect(result.allRefs).toContainEqual(ref('t1', 'value'));
  });

  // Pinning CURRENT behaviour, not asserting it is desirable: acorn's walk also visits
  // the intermediate MemberExpression `components.t1[0]`, and that 3-segment path yields
  // a second reference whose key is the index itself. It is a spurious-but-inert extra
  // edge (nothing ever publishes `components.t1.0`), unlike the lost edge above.
  // Open question for the product: should intermediate nodes emit references at all?
  it('also emits an extra (inert) reference for the intermediate node — current behaviour', () => {
    const result = extractAndReplaceReferencesFromString('{{components.t1[0].value}}', {}, {});

    expect(result.allRefs).toEqual([ref('t1', '0'), ref('t1', 'value')]);
  });
});

describe('extractAndReplaceReferencesFromString — UUID placeholders must never leak', () => {
  // UUIDs are swapped for `__UUID_PLACEHOLDER_N__` before parsing (ast.js:220-234)
  // because a raw UUID is not a valid JS identifier. Every exit must undo that
  // (restoreUuidPlaceholders, ast.js:236-244) or the placeholder text is written back
  // into the app definition and the binding is permanently corrupted.

  // Path 1 — acorn throws inside replaceIdsInExpression: catch at ast.js:323-325.
  it('restores the UUID when the expression cannot be parsed', () => {
    const input = `{{components.${UUID_A}.value ===}}`;

    const result = extractAndReplaceReferencesFromString(input, { [UUID_A]: 'name1' }, {});

    expect(result.valueWithId).not.toContain(PLACEHOLDER);
    expect(result.valueWithBrackets).not.toContain(PLACEHOLDER);
    expect(result.valueWithId).toContain(UUID_A);
  });

  // Path 2 — parseable, but no MemberExpression to rewrite (the UUID sits inside a
  // string literal), so the early return at ast.js:310 is taken.
  it('restores the UUID when it appears only inside a string literal', () => {
    const input = `{{"components.${UUID_A}.value"}}`;

    const result = extractAndReplaceReferencesFromString(input, {}, {});

    expect(result.valueWithId).not.toContain(PLACEHOLDER);
    expect(result.valueWithBrackets).not.toContain(PLACEHOLDER);
    expect(result.valueWithId).toBe(`{{"components.${UUID_A}.value"}}`);
  });

  // Path 3 — the success path (ast.js:319-322): one UUID IS rewritten as a member
  // expression while a second one, inside a string literal, is never visited by the walk.
  it('restores the leftover UUID on the success path when another UUID was rewritten', () => {
    const input = `{{components.${UUID_A}.value + "components.${UUID_B}.value"}}`;

    const result = extractAndReplaceReferencesFromString(input, { [UUID_A]: 'name1' }, {});

    expect(result.valueWithId).not.toContain('__UUID_PLACEHOLDER_');
    expect(result.valueWithBrackets).not.toContain('__UUID_PLACEHOLDER_');
    expect(result.valueWithId).toBe(`{{components.name1.value + "components.${UUID_B}.value"}}`);
    expect(result.allRefs).toEqual([ref('name1', 'value')]);
  });
});

describe('extractAndReplaceReferencesFromString — name to id mapping', () => {
  it('rewrites a mapped name to its id in valueWithId', () => {
    const result = extractAndReplaceReferencesFromString('{{components.t1.value}}', { t1: 'id-1' }, {});

    expect(result.valueWithId).toBe('{{components.id-1.value}}');
  });

  it('rewrites a mapped name to its id in valueWithBrackets', () => {
    const result = extractAndReplaceReferencesFromString('{{components.t1.value}}', { t1: 'id-1' }, {});

    expect(result.valueWithBrackets).toBe('{{components["id-1"].value}}');
  });

  it('reports the mapped id in allRefs', () => {
    const result = extractAndReplaceReferencesFromString('{{components.t1.value}}', { t1: 'id-1' }, {});

    expect(result.allRefs).toEqual([ref('id-1', 'value')]);
  });

  it('leaves an unmapped name untouched in the string and in allRefs', () => {
    const result = extractAndReplaceReferencesFromString('{{components.zzz.value}}', { t1: 'id-1' }, {});

    expect(result.valueWithId).toBe('{{components.zzz.value}}');
    expect(result.valueWithBrackets).toBe('{{components.zzz.value}}');
    expect(result.allRefs).toEqual([ref('zzz', 'value')]);
  });

  it('uses the query mapping for queries.<name>, not the component mapping', () => {
    const result = extractAndReplaceReferencesFromString('{{queries.q1.data}}', { q1: 'WRONG' }, { q1: 'qid-1' });

    expect(result.valueWithId).toBe('{{queries.qid-1.data}}');
    expect(result.allRefs).toEqual([ref('qid-1', 'data', 'queries')]);
  });
});

describe('extractAndReplaceReferencesFromString — the 3-segment minimum', () => {
  // Pinning CURRENT behaviour (ast.js:384-388): `components`/`queries`/`page` refs need
  // >= 3 path segments, so a 2-segment ref such as `{{page.handle}}` produces no
  // reference and therefore no dependency edge. `page.handle` happens to be immutable
  // today, so nothing visibly breaks — but whether `page.*` should be reactive at all
  // is an OPEN PRODUCT QUESTION, not a bug claim. This test pins the status quo so a
  // deliberate change to it is visible.
  it('drops 2-segment page references', () => {
    const result = extractAndReplaceReferencesFromString('{{page.handle}}', {}, {});

    expect(result.allRefs).toEqual([]);
    expect(result.valueWithId).toBe('{{page.handle}}');
  });

  it('keeps 3-segment page references', () => {
    const result = extractAndReplaceReferencesFromString('{{page.variables.x}}', {}, {});

    expect(result.allRefs).toEqual([ref('variables', 'x', 'page')]);
  });

  it('drops 2-segment component references', () => {
    const result = extractAndReplaceReferencesFromString('{{components.t1}}', { t1: 'id-1' }, {});

    expect(result.allRefs).toEqual([]);
  });
});

describe('findAllEntityReferences (_stores/utils.js:368-418)', () => {
  it('collects the entity name (not the root object) from a reference', () => {
    expect(findAllEntityReferences({ a: '{{queries.q1.data}}', b: 'components.t1' }, [])).toEqual(['q1']);
  });

  // utils.js:399-402 — a bracket-notation value is SKIPPED (`continue`). It used to
  // `break`, which aborted the whole object scan: every reference under a later key was
  // never collected, so those entities got no dependency edges at all.
  it('keeps scanning the remaining keys after a bracket-notation value', () => {
    const node = { a: "{{components.c1['value']}}", b: '{{queries.q1.data}}' };

    expect(findAllEntityReferences(node, [])).toEqual(['q1']);
  });

  it('keeps scanning nested objects after a bracket-notation value', () => {
    const node = {
      a: '{{queries.q0["data"]}}',
      b: '{{queries.q1.data}}',
      c: { d: '{{components.t2.value}}' },
    };

    expect(findAllEntityReferences(node, [])).toEqual(['q1', 't2']);
  });
});
