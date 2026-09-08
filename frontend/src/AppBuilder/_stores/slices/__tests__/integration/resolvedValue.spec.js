/**
 * Contract tests for the STORE-LEVEL resolver seam in `resolvedSlice.js`:
 * `getResolvedValue`, `getResolvedState` and the slice's own `resolveReferences`.
 *
 * Why this file exists alongside the two pure-resolver suites:
 *
 *   - `_stores/__tests__/utils.resolver.spec.js` pins `resolveDynamicValues`/`resolveCode`
 *     — pure evaluation, state handed in as an argument.
 *   - `_helpers/__tests__/utils.resolver.spec.js` pins the second, divergent copy.
 *   - `_stores/__tests__/ast.spec.js` pins `ast.js`'s `extractAndReplaceReferencesFromString`
 *     — the name->id rewrite, in isolation. It is now the only implementation; a
 *     regex-based twin in `utils.js` was deleted as dead code (see the JSON.stringify
 *     test below for the behaviour that made the two disagree).
 *   - THIS FILE pins the COMPOSITION of those three against the real store:
 *     rewrite the author's names to ids, look up the live exposed values, evaluate.
 *
 * That composition is what ~249 call sites actually invoke, and none of them can be
 * expressed without the real store: the name->id mapping and the exposed-value tree
 * are store state, and the whole point of `getResolvedValue` is joining them. A mocked
 * store would assert only that the mock was wired up.
 *
 * The load-bearing facts, in one sentence each:
 *
 *   - Authors write component NAMES; exposed values are keyed by component ID. The
 *     rewrite is the only bridge, and it is silent when it fails — a binding to a
 *     renamed component blanks rather than erroring.
 *   - `getResolvedValue` is the gate that keeps ordinary prose out of the evaluator.
 *     The pure resolver evaluates any string as JavaScript, so a widget property of
 *     "Hello world" is a ReferenceError one missing `includes('{{')` away.
 *   - `getResolvedState` runs the mapping BACKWARDS, and is what RunJS and event
 *     handlers see as `components`. Get the direction wrong and every user script
 *     addresses components by uuid.
 *
 * No slice is mocked. Reads go straight through the store rather than through
 * `AppBuilderTestSession` for the reason exposedValueCascade.spec.js gives: nothing is
 * rendered here, so the session buys nothing, and its `act` wrapper would flush
 * microtasks we sometimes want to leave unflushed.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();

/** One TextInput, author-facing name `textinput1`, store-facing id `c1`. */
function seedInput() {
  return seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') });
}

describe('getResolvedValue — the author writes a NAME, the store keys by ID', () => {
  test('a binding by component name resolves against the exposed value stored under its id', () => {
    // Break this catches: dropping the extractAndReplaceReferencesFromString call at
    // `getResolvedValue`'s call to it (passing `value` straight to resolveDynamicValues). The
    // expression would then read `components.textinput1.value` while the exposed-value
    // tree is keyed `components.c1`, so EVERY by-name binding in every app blanks.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');

    expect(state().getResolvedValue('{{components.textinput1.value}}')).toBe('hello');
  });

  test('a binding written against the raw id also resolves', () => {
    // Break this catches: making the rewrite reject an unmapped entity name instead of
    // assuming it is already an id (the `mapping[name] ||` fallback in `ast.js`'s
    // `replaceIdsInExpression`). Internally-generated bindings and
    // migrated apps carry raw ids, and they must keep working.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');

    expect(state().getResolvedValue('{{components.c1.value}}')).toBe('hello');
  });

  test('a binding to a name that is in no mapping blanks instead of throwing', () => {
    // Break this catches: removing a try/catch layer so that a deleted or renamed
    // component takes the canvas down. `components["ghost"]` is undefined, so reading
    // `.value` off it throws inside the generated Function; the resolver must swallow it.
    seedInput();

    expect(state().getResolvedValue('{{components.ghost.value}}')).toBe('');
  });

  test('the type of the exposed value survives a whole-string binding', () => {
    // Break this catches: routing the rewritten expression down the interpolation path
    // (`resolvedValue.replace(variable, resolvedCode ?? '')` in `resolveDynamicValues`)
    // instead of the whole-string path. A Table `data` bound to an array
    // would arrive as "1,2" and a `visible` bound to false as the truthy string "false".
    seedInput();
    state().setExposedValue('c1', 'value', false);
    expect(state().getResolvedValue('{{components.textinput1.value}}')).toBe(false);

    state().setExposedValue('c1', 'value', [1, 2]);
    expect(state().getResolvedValue('{{components.textinput1.value}}')).toEqual([1, 2]);
  });

  test('a binding embedded in surrounding text is interpolated by name', () => {
    // Break this catches: a rewrite that only fires when the binding is the entire
    // string. `Hello {{components.textinput1.value}}!` is the single most common
    // binding shape in real apps.
    seedInput();
    state().setExposedValue('c1', 'value', 'Ada');

    expect(state().getResolvedValue('Hello {{components.textinput1.value}}!')).toBe('Hello Ada!');
  });

  test('two different components in one string each resolve to their own value', () => {
    // Break this catches: a rewrite that reuses the first match's id for later matches
    // (e.g. hoisting `entityId` out of the replace callback). Both halves would show
    // the same component's value — a wrong-value bug, not a blank, so it ships quietly.
    seedApp({
      c1: componentDefinition('c1', 'textinput1', 'TextInput'),
      c2: componentDefinition('c2', 'textinput2', 'TextInput'),
    });
    state().setExposedValue('c1', 'value', 'A');
    state().setExposedValue('c2', 'value', 'B');

    expect(state().getResolvedValue('{{components.textinput1.value}}-{{components.textinput2.value}}')).toBe('A-B');
  });

  test('a component whose name looks like another component name is not a prefix match', () => {
    // Break this catches: swapping the anchored regex capture for a substring/`startsWith`
    // lookup in the mapping. `textinput1` is a prefix of `textinput10`, and a prefix
    // match would silently bind the wrong widget.
    seedApp({
      c1: componentDefinition('c1', 'textinput1', 'TextInput'),
      c2: componentDefinition('c2', 'textinput10', 'TextInput'),
    });
    state().setExposedValue('c1', 'value', 'one');
    state().setExposedValue('c2', 'value', 'ten');

    expect(state().getResolvedValue('{{components.textinput10.value}}')).toBe('ten');
  });
});

describe('getResolvedValue — the gate that keeps prose out of the evaluator', () => {
  // `getResolvedValue` admits a string only when it contains BOTH `{{` and `}}`.
  // Everything else is returned by reference, untouched. This is not a nicety: the
  // pure resolver's else-branch evaluates whatever it is handed as a JavaScript
  // expression, so without this gate a Text widget reading "Hello world" resolves to ''.

  test('ordinary prose is returned unchanged, not evaluated', () => {
    // Break this catches: dropping either `includes` from the gate. `hello world` would
    // reach Function('return hello world') — a syntax error, swallowed, returned as ''.
    seedInput();

    expect(state().getResolvedValue('hello world')).toBe('hello world');
  });

  test('an unterminated `{{` is returned unchanged', () => {
    // Break this catches: gating on `{{` alone. A half-typed binding in the CodeEditor
    // would blank the property on every keystroke instead of showing the literal text.
    seedInput();

    expect(state().getResolvedValue('{{ unclosed')).toBe('{{ unclosed');
  });

  test('a stray `}}` is returned unchanged', () => {
    // Break this catches: gating on `}}` alone.
    seedInput();

    expect(state().getResolvedValue('closed }}')).toBe('closed }}');
  });

  test('`}}` before `{{` passes the gate and blanks — the gate is textual, not syntactic', () => {
    // Break this catches: nothing in production; this is the characterization of a real
    // hole. Both delimiters are present so the gate admits the string, no binding
    // matches, and the whole thing is evaluated as JS. A Text widget whose content is
    // `a }} b {{ c` renders blank today. Pinned so that fixing the gate is a visible,
    // deliberate change rather than a surprise.
    seedInput();

    expect(state().getResolvedValue('a }} b {{ c')).toBe('');
  });

  test('non-string values are passed through by reference, never resolved', () => {
    // Break this catches: replacing the `typeof value === 'string'` guard with a truthy
    // check. `getResolvedValue` is called with already-resolved values all over the
    // slice; coercing them would corrupt numbers, booleans and null.
    seedInput();

    expect(state().getResolvedValue(42)).toBe(42);
    expect(state().getResolvedValue(false)).toBe(false);
    expect(state().getResolvedValue(null)).toBeNull();
    expect(state().getResolvedValue(undefined)).toBeUndefined();
  });

  test('an object is returned as-is — getResolvedValue does NOT walk structures', () => {
    // Break this catches: making getResolvedValue recurse. That is `resolveReferences`'s
    // job (below), and the two have different call sites; conflating them would resolve
    // bindings in places that deliberately keep them raw, such as saved definitions.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');
    const definition = { text: '{{components.textinput1.value}}' };

    expect(state().getResolvedValue(definition)).toBe(definition);
  });
});

describe('getResolvedValue — customVariables become extra globals', () => {
  test('a custom variable is resolvable as a top-level identifier', () => {
    // Break this catches: dropping the `customVariables` argument on the way to
    // resolveDynamicValues (the `customVariables` argument). This is the mechanism behind every
    // ListView/Table row scope — `{{listItem.name}}` inside a row is nothing but a
    // custom variable — so losing it blanks every cell in every list.
    seedInput();

    expect(
      state().getResolvedValue('{{listItem.name}}', {
        listItem: { name: 'Ada' },
      })
    ).toBe('Ada');
  });

  test('a custom variable and a component binding resolve in the same string', () => {
    // Break this catches: passing customVariables only down the whole-string path and
    // not the interpolation path. Row templates mix the two constantly.
    seedInput();
    state().setExposedValue('c1', 'value', 'filter');

    const result = state().getResolvedValue('{{listItem.name}} / {{components.textinput1.value}}', {
      listItem: { name: 'Ada' },
    });

    expect(result).toBe('Ada / filter');
  });
});

describe('getResolvedValue — a method call wrapped around a binding', () => {
  test('`{{JSON.stringify(components.<name>.selectedRow)}}` resolves', () => {
    // Break this catches: a reference-rewriter that grabs the property name by scanning
    // to a delimiter instead of parsing. `)` is not a delimiter, so such a scanner takes
    // `value)` as the key, notices, chops the paren off — and re-appends it AFTER the
    // closing `}}`, yielding `{{JSON.stringify(components["c1"].value}})`. That is not
    // valid JS, so the binding resolves to the literal string `")"` instead of the data.
    //
    // Not hypothetical: `_stores/utils.js` carried exactly such a regex twin of
    // `extractAndReplaceReferencesFromString` until it was deleted as dead code
    // (2026-09-08 — every caller already used the acorn version in `_stores/ast.js`).
    // Verified by pointing this slice's import at that twin: this test failed with `")"`,
    // and it was the only one that did.
    //
    // Wrapping a reference in a call is the documented way to render an object into a
    // Text widget, so this is a real authoring path and not a curiosity.
    seedInput();
    state().setExposedValue('c1', 'value', { id: 7 });

    expect(state().getResolvedValue('{{JSON.stringify(components.textinput1.value)}}')).toBe('{"id":7}');
  });
});

describe('getResolvedState — the mapping runs backwards for RunJS and event handlers', () => {
  test('components come back keyed by NAME, not by id', () => {
    // Break this catches: dropping the `reverseMapping` lookup in `getResolvedState`'s
    // `addToState`. Every
    // RunJS script and every event handler reads `components.textinput1.value`; keyed by
    // id they would all have to know uuids, and every existing script breaks at once.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');

    const resolved = state().getResolvedState('canvas', 'components');

    // Asserting the reachable path rather than the whole tree on purpose: a TextInput
    // also seeds `isVisible`, `isMandatory` and friends, and whole-object equality here
    // would be a change detector that fails whenever a widget gains a default.
    expect(resolved.components.textinput1.value).toBe('hello');
    expect(resolved.components).not.toHaveProperty('c1');
    expect(resolved.queries).toEqual({});
  });

  test('a component with no entry in the mapping keeps its id as the key', () => {
    // Break this catches: removing the `reverseMapping[k] || k` fallback in
    // `getResolvedState`'s `addToState`. Without
    // it the key becomes the string "undefined", and two unmapped components collide
    // onto one another.
    seedInput();
    state().setExposedValue('orphan', 'value', 'kept');

    expect(state().getResolvedState('canvas', 'components').components.orphan).toEqual({ value: 'kept' });
  });

  test("key 'components' excludes the variables/constants/globals branches", () => {
    // Break this catches: always returning the merged object. Callers asking for one
    // slice would receive the whole exposed-value tree, and `Object.keys` walks over it
    // (hint building, dependency scans) would silently widen.
    seedInput();
    state().setVariable('v1', 'x');

    const resolved = state().getResolvedState('canvas', 'components');

    // All three, not just `variables`: the branch this pins is the early `return state`,
    // which excludes the entire exposed-value tree. Asserting only `variables` would let a
    // mutation that leaks `constants` or `globals` pass under this title.
    expect(resolved).not.toHaveProperty('variables');
    expect(resolved).not.toHaveProperty('constants');
    expect(resolved).not.toHaveProperty('globals');
    expect(Object.keys(resolved).sort()).toEqual(['components', 'queries']);
  });

  test("key 'all' merges the rest of the exposed values in", () => {
    // Break this catches: returning the bare `state` shell for 'all'. `variables`,
    // `constants` and `globals` would vanish from RunJS, so `{{variables.x}}` works in a
    // widget property but `variables.x` is undefined in a script — a maddening split.
    seedInput();
    state().setVariable('v1', 'x');

    const resolved = state().getResolvedState('canvas', 'all');

    expect(resolved.variables).toEqual({ v1: 'x' });
    expect(resolved.components).toHaveProperty('textinput1');
  });

  test("under 'all' the name-keyed components WIN over the id-keyed exposed values", () => {
    // Break this catches: flipping `getResolvedState`'s final spread to
    // `{ ...state, ...exposedValues }`
    // (`{ ...state, ...exposedValues }`). The id-keyed tree would clobber the name-keyed
    // one and RunJS would be back to addressing components by uuid — with no error, just
    // `undefined` everywhere.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');

    const resolved = state().getResolvedState('canvas', 'all');

    expect(resolved.components.textinput1.value).toBe('hello');
    expect(resolved.components).not.toHaveProperty('c1');
  });

  test('an omitted key behaves like `all`', () => {
    // Break this catches: changing `!key` to a `key === undefined` check that misses the
    // no-argument call, or vice versa. `getResolvedState(moduleId)` is called without a
    // key in production, and it must still carry variables.
    seedInput();
    state().setVariable('v1', 'x');

    expect(state().getResolvedState('canvas')).toEqual(state().getResolvedState('canvas', 'all'));
  });

  test('queries come back keyed by name once the query mapping is registered', () => {
    // Break this catches: reversing the query mapping with the component mapping (an easy
    // copy-paste between the two `addToState` calls in `getResolvedState`). Queries would
    // keep their ids while components
    // got names, so half of every script breaks.
    seedInput();
    state().addNewQueryMapping('q-uuid-1', 'getUsers');
    state().setResolvedQuery('q-uuid-1', {
      data: [{ id: 1 }],
      isLoading: false,
    });

    const resolved = state().getResolvedState('canvas', 'queries');

    expect(resolved.queries.getUsers).toEqual({
      data: [{ id: 1 }],
      isLoading: false,
    });
    expect(resolved.queries).not.toHaveProperty('q-uuid-1');
  });
});

describe('resolveReferences — the slice walks objects and arrays', () => {
  test('every string value in an object is resolved', () => {
    // Break this catches: the recursive `resolveReferences` call in the slice's
    // non-array object branch.
    // Table column definitions, style objects and event-action parameters are all plain
    // objects full of bindings; without the walk they reach widgets as raw `{{...}}`.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');

    const result = state().resolveReferences('canvas', {
      text: '{{components.textinput1.value}}',
      colour: 'red',
    });

    expect(result).toEqual({ text: 'hello', colour: 'red' });
  });

  test('array elements are resolved against the live store', () => {
    // Break this catches: the recursive call inside the slice's `Array.isArray` branch.
    // Worth its own test because the OTHER resolver — `resolveReferences` in
    // `_helpers/utils.js` — gets this wrong, and
    // that divergence is pinned as `test.failing` in the _helpers suite. This one must
    // not regress to match it.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');

    expect(state().resolveReferences('canvas', ['{{components.textinput1.value}}', 'plain'])).toEqual([
      'hello',
      'plain',
    ]);
  });

  test('bindings nested inside arrays inside objects are resolved at every depth', () => {
    // Break this catches: recursing only one level (resolving `object[key]` with
    // getResolvedValue instead of resolveReferences). Table `columns` is exactly this
    // shape — an array of objects — so a one-level walk leaves every column unresolved.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');

    const result = state().resolveReferences('canvas', {
      columns: [{ header: '{{components.textinput1.value}}' }],
    });

    expect(result).toEqual({ columns: [{ header: 'hello' }] });
  });

  test("the caller's object keeps its bindings — resolution does not mutate the input", () => {
    // Break this catches: dropping the `_.clone(object)` at the top of the slice's
    // `resolveReferences`. The definition
    // objects handed in here are store state; resolving in place would overwrite the
    // author's `{{...}}` source with its current value, and the next save would persist
    // the flattened text. That is unrecoverable data loss in the app JSON.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');
    const definition = { text: '{{components.textinput1.value}}' };

    state().resolveReferences('canvas', definition);

    expect(definition).toEqual({ text: '{{components.textinput1.value}}' });
  });

  test('the empty triple-brace `{{{}}}` is special-cased to the empty string', () => {
    // Break this catches: removing the `if (object === '{{{}}}') return ''` guard at the
    // top of the slice's `resolveReferences`. `{{{}}}` is what
    // the CodeEditor leaves behind when an author clears an fx field; evaluated as JS it
    // is a block statement, not an object, so it would blank via the error path instead
    // — same output today, but the guard is what makes it intentional.
    seedInput();

    expect(state().resolveReferences('canvas', '{{{}}}')).toBe('');
  });

  test('scalars fall through untouched', () => {
    // Break this catches: a default branch that coerces. `resolveReferences` is called
    // with already-resolved values, so a number must come back a number.
    seedInput();

    expect(state().resolveReferences('canvas', 42)).toBe(42);
    expect(state().resolveReferences('canvas', false)).toBe(false);
    expect(state().resolveReferences('canvas', null)).toBeNull();
  });

  test('withError returns an [object, error] tuple on the structure paths', () => {
    // Break this catches: returning the bare object when withError is set. The inspector
    // destructures this tuple; a bare object would make `error` the object's first key.
    seedInput();
    state().setExposedValue('c1', 'value', 'hello');

    const [resolved, error] = state().resolveReferences(
      'canvas',
      { text: '{{components.textinput1.value}}' },
      undefined,
      undefined,
      {},
      true
    );

    expect(resolved).toEqual({ text: 'hello' });
    expect(error).toBeUndefined();
  });
});

describe('getResolvedValue — a binding reads the value that is in the store NOW', () => {
  test('a second read after a write returns the new value, not a cached one', () => {
    // Break this catches: memoising getResolvedValue on the expression string without
    // keying on the exposed-value version. This is the stale-value bug class: the
    // resolver returns last tick's answer and a widget lies about its own state.
    seedInput();
    state().setExposedValue('c1', 'value', 'first');
    expect(state().getResolvedValue('{{components.textinput1.value}}')).toBe('first');

    state().setExposedValue('c1', 'value', 'second');

    expect(state().getResolvedValue('{{components.textinput1.value}}')).toBe('second');
  });

  test('a component binding resolves even when the dependency graph never registered it', () => {
    // Break this catches: making getResolvedValue consult the dependency graph before
    // evaluating. It must be a pure read of the exposed-value tree — the graph decides
    // WHEN to recompute, never WHETHER a value can be read. Ad-hoc callers (the
    // inspector preview, event parameters) resolve expressions the graph has no edge for.
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') });
    state().setExposedValue('c1', 'value', 'hello');

    // `text1` is bound in no component definition, so no edge exists for this path.
    expect(state().getResolvedValue('{{components.textinput1.value.length}}')).toBe(5);
  });
});

describe('getResolvedValue — bindings declared in a component definition', () => {
  test('a definition-declared binding resolves through the same seam', () => {
    // Break this catches: a divergence between what the dependency graph registers from a
    // component definition and what getResolvedValue can evaluate. `binding()` produces
    // the `{ value: '<expr>' }` shape the slice stores, and the expression inside it must
    // resolve identically to an ad-hoc one — the graph and the resolver have to agree on
    // the same rewritten path or the cascade fires and resolves nothing.
    seedApp({
      c1: componentDefinition('c1', 'textinput1', 'TextInput'),
      c2: componentDefinition('c2', 'text1', 'Text', {
        text: binding('{{components.textinput1.value}}'),
      }),
    });
    state().setExposedValue('c1', 'value', 'hello');

    const declared = state().getCurrentPageComponents('canvas').c2.component.definition.properties.text.value;

    expect(state().getResolvedValue(declared)).toBe('hello');
  });
});

describe('getResolvedValue — a component name containing a hyphen', () => {
  // `validateQueryName` (`_helpers/utils.js`) gates component renames on
  // /^[A-Za-z0-9_-]*$/, so a hyphen is ALLOWED in a component name. The codebase already
  // relies on that elsewhere — `_stores/handleReferenceTransactions.js` includes `-` in
  // its rename boundary classes precisely because "entity names may contain hyphens".
  //
  // A hyphen is not valid in a JS member expression, so the two access forms diverge.
  // Only the bracket form can work; the dot form is a silent blank.

  test('the bracket form resolves a hyphenated component name', () => {
    // Break this catches: an id-rewrite that only handles dot-notation member access.
    // This is the ONLY working way to read a hyphen-named component, so it is the whole
    // of that component's reachability from any binding.
    seedApp({ c1: componentDefinition('c1', 'my-comp', 'TextInput') });
    state().setExposedValue('c1', 'value', 'HYPHEN');

    expect(state().getResolvedValue("{{components['my-comp'].value}}")).toBe('HYPHEN');
  });

  test('the dot form resolves to blank, because a hyphen is JS subtraction', () => {
    // Characterization, NOT an endorsement. `{{components.my-comp.value}}` parses as
    // `components.my - comp.value`, so no reference is extracted, no dependency edge is
    // registered, and the property renders empty with nothing logged.
    //
    // The product decision this needs — forbid hyphens at rename time, or surface an
    // error in the CodeEditor — is unresolved, so this test pins today's behaviour rather
    // than asserting a contract. Note the Inspector's own rename error message already
    // claims names may "only include letters, numbers and underscore", which contradicts
    // the regex that actually runs.
    seedApp({ c1: componentDefinition('c1', 'my-comp', 'TextInput') });
    state().setExposedValue('c1', 'value', 'HYPHEN');

    expect(state().getResolvedValue('{{components.my-comp.value}}')).toBe('');
  });
});
