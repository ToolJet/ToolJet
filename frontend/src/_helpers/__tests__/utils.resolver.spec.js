/**
 * Contract tests for the SECOND expression resolver: `resolveReferences`, `resolveString`
 * and `resolveCode` in `src/_helpers/utils.js`.
 *
 * There are two near-duplicate resolvers in this repo:
 *
 *   - `src/AppBuilder/_stores/utils.js`   — `resolveDynamicValues` + `resolveCode`,
 *      the runtime path for widget properties. Covered by
 *      `src/AppBuilder/_stores/__tests__/utils.resolver.spec.js`.
 *   - `src/_helpers/utils.js` (THIS FILE'S SUBJECT) — `resolveReferences` + `resolveString`
 *      + `resolveCode`, imported by ~144 modules including the inspector,
 *      `resolveWidgetFieldValue` and `validateWidget`.
 *
 * They are NOT interchangeable, and the differences are silent. This suite pins the
 * `_helpers` behaviour so the divergence is visible instead of folkloric:
 *
 *   - plain prose passes through UNCHANGED here (the store copy evaluates it as JS and
 *     returns `''`);
 *   - `null`/`undefined` interpolate as the literal text `"null"`/`"undefined"` here
 *     (the store copy has `?? ''` and produces an empty string);
 *   - `resolveReferences` also walks objects and arrays, resolves `%%server.x%%`, and
 *     returns `[value, error]` tuples from some branches even when `withError` is false;
 *   - `resolveCode` here injects `secrets` and no `input`; the store copy injects `input`
 *     and no `secrets`. An expression is therefore resolvable through one resolver and a
 *     ReferenceError through the other.
 *
 * Both functions are pure — the state is an argument and nothing here touches a store —
 * so this suite uses ZERO mocks. The only import is the module under test.
 *
 * `test.failing` marks real, still-unfixed bugs, each one naming its production line.
 */
import { resolveReferences, resolveCode } from '@/_helpers/utils';

// The resolver receives the already-flattened exposed-value state; `components`,
// `queries`, `secrets`, ... become the argument names of the generated Function.
const withComponent = (value, name = 'c1') => ({ components: { [name]: { value } } });

describe('resolveCode — evaluation, injected globals and the two refusal guards', () => {
  test('an expression is evaluated against the state object', () => {
    // utils.js:104-138. `components` is a Function parameter name, so `components.c1.value`
    // is ordinary property access on the state slice.
    expect(resolveCode('components.c1.value', withComponent('hello'), {}, false, [], true)).toBe('hello');
  });

  test('`secrets` is an injected global — this is the resolver that has it', () => {
    // utils.js:114 declares `secrets` and utils.js:132 passes `state?.secrets || {}`.
    // The store resolver injects `input` in this slot and NO `secrets` at all, so
    // `{{secrets.x}}` resolves here and ReferenceErrors there.
    expect(resolveCode('secrets.apiKey', { secrets: { apiKey: 'k' } }, {}, false, [], true)).toBe('k');
  });

  test('`secrets` defaults to an empty object rather than undefined', () => {
    // utils.js:132's `|| {}`. Without it `{{secrets.x}}` on an app that has no secrets
    // throws "Cannot read properties of undefined" instead of yielding undefined.
    expect(resolveCode('secrets.missing', {}, {}, false, [], true)).toBeUndefined();
  });

  test('`constants` is passed regardless of isJsCode', () => {
    // utils.js:131 — the only argument NOT gated on isJsCode, deliberately (see the
    // comment on that line). Constants must resolve in both server (%%) and client ({{})
    // contexts.
    expect(resolveCode('constants.c', { constants: { c: 1 } }, {}, false, [], false)).toBe(1);
  });

  test('isJsCode=true hides `server`, and isJsCode=false hides `components`', () => {
    // utils.js:124-130. This gating is what stops a client-side `{{}}` binding from
    // reading server-only environment variables: the parameter exists but is undefined.
    expect(resolveCode('server', { server: { s: 1 } }, {}, false, [], true)).toBeUndefined();
    expect(resolveCode('components', withComponent('x'), {}, false, [], false)).toBeUndefined();
  });

  test('lodash is reachable as `_` inside expressions', () => {
    // utils.js:117 / 135. If `_` is ever undefined at that point, every `_.`-using
    // binding in every app silently blanks.
    expect(resolveCode('_.sum([1,2,3])', {}, {}, false, [], true)).toBe(6);
  });

  test('moment is reachable as `moment` inside expressions', () => {
    // utils.js:116 / 134.
    expect(resolveCode("moment('2020-01-02').format('YYYY')", {}, {}, false, [], true)).toBe('2020');
  });

  test('customObjects are appended as extra globals', () => {
    // utils.js:118 / 136 — the mechanism behind ListView row scopes and the
    // `customResolveObjects` argument of resolveWidgetFieldValue (utils.js:383).
    expect(resolveCode('row.name', {}, { row: { name: 'n' } }, false, [], true)).toBe('n');
  });

  test('a bare `_` is refused as a circular reference, with a STRING error', () => {
    // utils.js:97-98. Note the inconsistency with the eval path below: this guard
    // reports a string, so a caller doing `error.message` gets undefined.
    expect(resolveCode('_', {}, {}, true, [], true)).toEqual(['', 'Cannot resolve circular reference _']);
  });

  test('a query `run()` call is refused rather than executed', () => {
    // utils.js:99-101. Resolving `{{queries.q1.run()}}` would fire the query on every
    // recompute, so it is blocked at the resolver — again with a string error.
    expect(resolveCode('queries.q1.run()', {}, {}, true, [], true)).toEqual([
      '',
      'Cannot resolve function call queries.q1.run()',
    ]);
  });

  test("a failing expression yields `''` and never throws", () => {
    // utils.js:94 initialises `result = ''` and utils.js:139-142 swallows the throw.
    // This is the single most load-bearing fact in the module: one bad binding must
    // blank one property, not take down the render.
    expect(resolveCode('foo.bar.baz', {}, {}, false, [], true)).toBe('');
    expect(resolveCode('a b c', {}, {}, false, [], true)).toBe('');
  });

  test('withError returns the real Error object from the eval path', () => {
    // utils.js:140 + 144. The CodeEditor renders `error.message` under the field.
    const [result, error] = resolveCode('foo.bar.baz', {}, {}, true, [], true);

    expect(result).toBe('');
    expect(error).toBeInstanceOf(ReferenceError);
    expect(error.message).toMatch(/foo is not defined/);
  });

  test('withError=false returns the bare value, not a tuple', () => {
    // utils.js:144-145. Every hot caller relies on this; returning the tuple would
    // stringify as "value," into every interpolated property.
    expect(resolveCode('1 + 1', {}, {}, false, [], true)).toBe(2);
  });

  test('resolveCode throws on a non-string code — unlike resolveReferences', () => {
    // utils.js:97 calls `code.includes` with no type guard. Pinned because it is the
    // reason resolveReferences' `typeof` switch (utils.js:215) exists at all: every
    // non-string must be routed away from here.
    expect(() => resolveCode(42, {}, {}, false, [], true)).toThrow(TypeError);
  });
});

describe('resolveReferences — a binding that IS the whole string keeps its JavaScript type', () => {
  // utils.js:221-235: `{{expr}}` with exactly one `{{` returns resolveCode's value
  // verbatim, with no interpolation. Widgets rely on it: a Table's `data` must stay an
  // array, `disabled` must stay a boolean.
  const whole = (value) => resolveReferences('{{components.c1.value}}', withComponent(value));

  test('a number stays a number', () => {
    expect(whole(42)).toBe(42);
  });

  test('a boolean false stays boolean false, not the string "false"', () => {
    // The one that bites hardest: `'false'` is truthy, so a flattened boolean inverts
    // every `visible` / `disabled` binding.
    expect(whole(false)).toBe(false);
  });

  test('an object stays an object and an array stays an array', () => {
    expect(whole({ a: 1 })).toEqual({ a: 1 });
    expect(whole([1, 2])).toEqual([1, 2]);
  });

  test('null stays null and undefined stays undefined', () => {
    // Not `''`. Callers that distinguish "not set" from "empty" (defaults via `??`)
    // depend on this.
    expect(whole(null)).toBeNull();
    expect(whole(undefined)).toBeUndefined();
  });

  test('a function value is returned as a function', () => {
    // Relevant to FilePicker handles and query `run` references: this path does not
    // stringify, so a function survives. The interpolation paths explicitly skip
    // functions instead (utils.js:250 / 275).
    expect(typeof whole(() => 1)).toBe('function');
  });

  test('a triple-brace object literal resolves to a real object', () => {
    // The `{{{ ... }}}` form used by Table column definitions and style objects.
    expect(resolveReferences('{{{ text: components.c1.value, color: "red" }}}', withComponent('hello'))).toEqual({
      text: 'hello',
      color: 'red',
    });
  });

  test('the empty triple-brace `{{{}}}` is special-cased to the empty string', () => {
    // utils.js:203 — a hard-coded guard, because `return {}` would otherwise hand an
    // empty object to a string property.
    expect(resolveReferences('{{{}}}', {})).toBe('');
  });

  test('a whole-string expression containing `$&` is NOT corrupted', () => {
    // Worth pinning as the contrast case: this path returns resolveCode's value
    // directly (utils.js:235) instead of splicing it through String.replace, so the
    // `$`-pattern hazard below does not reach it. The store resolver DOES corrupt this
    // input (its isJSCodeResolver branch replaces), which is a genuine behavioural
    // divergence between the two copies.
    expect(resolveReferences("{{'a $& b'}}", {})).toBe('a $& b');
  });
});

describe('resolveReferences — a binding embedded in text is interpolated and stringified', () => {
  // utils.js:267-279: with surrounding text the result is spliced into a string, so the
  // type is gone by construction. These are the exact strings the inspector shows.
  const embedded = (value) => resolveReferences('n={{components.c1.value}}', withComponent(value));

  test('a number becomes its decimal form', () => {
    expect(embedded(42)).toBe('n=42');
  });

  test('an object becomes "[object Object]" and an array its comma-joined form', () => {
    // Worth knowing before blaming the widget: this is the resolver, not the renderer.
    expect(embedded({ a: 1 })).toBe('n=[object Object]');
    expect(embedded([1, 2])).toBe('n=1,2');
  });

  test('null and undefined interpolate as the literal text "null" / "undefined"', () => {
    // DIVERGENCE, and the user-visible kind: utils.js:276 has no `?? ''`, unlike the
    // store resolver's `resolvedValue.replace(variable, resolvedCode ?? '')`. An
    // inspector field bound to `Hi {{components.input1.value}}` on an untouched input
    // literally reads "Hi undefined" through this resolver and "Hi " through the other.
    expect(embedded(null)).toBe('n=null');
    expect(embedded(undefined)).toBe('n=undefined');
  });

  test('a function-valued binding is skipped, leaving the raw `{{...}}` in the text', () => {
    // utils.js:275's `typeof value !== 'function'` guard. Removing it would splice a
    // function's source code into the string.
    expect(
      resolveReferences(
        'x {{components.c1.value}}',
        withComponent(() => 1)
      )
    ).toBe('x {{components.c1.value}}');
  });

  test('every binding in the string is resolved', () => {
    // NOTE: this string both starts with `{{` and ends with `}}`, so it takes the OTHER
    // interpolation loop — utils.js:237-254, via resolveString — not the embedded-text one
    // at utils.js:273. Two loops, same job, and a caller cannot tell which it will get.
    // If either stops iterating, the tail of a template renders as raw `{{...}}` text.
    expect(
      resolveReferences('{{components.c1.value}} and {{components.c2.value}}', {
        components: { c1: { value: 'A' }, c2: { value: 'B' } },
      })
    ).toBe('A and B');
  });

  test('a binding repeated twice is resolved at both occurrences', () => {
    // getDynamicVariables (utils.js:312) returns the duplicate twice, and each pass of the
    // utils.js:237-254 loop replaces the left-most remaining occurrence.
    expect(resolveReferences('{{components.c1.value}}-{{components.c1.value}}', withComponent('A'))).toBe('A-A');
  });

  test('a failing binding blanks only that binding, and the surrounding text survives', () => {
    expect(resolveReferences('x {{foo.bar.baz}} y', {})).toBe('x  y');
  });

  test('withError is forced OFF on the interpolation path, so no tuple leaks into the text', () => {
    // utils.js:274 hard-codes `false` for the recursive call's withError. This is the
    // other genuine improvement over the store resolver, whose equivalent line
    // interpolates `String([result, error])` and produces
    // "x ,ReferenceError: foo is not defined y".
    expect(resolveReferences('x {{foo.bar.baz}} y', {}, null, {}, true)).toEqual(['x  y', undefined]);
  });
});

describe('resolveReferences — `$` in resolved user data corrupts the output (UNFIXED)', () => {
  // The 2nd argument of `String.prototype.replace` is a replacement PATTERN, and at
  // utils.js:251, utils.js:276 and utils.js:165 that argument is the user's own resolved
  // value. `$&` expands to the matched text (the binding source), `` $` `` to everything
  // before it, `$'` to everything after it, `$$` to a literal `$`.
  //
  // User-facing impact: an inspector field bound to `Hi {{components.input1.value}}`
  // shows garbage the moment somebody types `$&` or `$'` into the input — a price list
  // ("$&nbsp;"), a regex a support agent pasted, a currency template. Nothing errors and
  // nothing is logged; the value is silently rewritten.
  //
  // Fix: pass a replacer function (`() => value`), or escape `$` as `$$` first.
  // The same bug exists in the store copy at _stores/utils.js:97.

  test.failing('a resolved value containing `$&` must be inserted verbatim — utils.js:276', () => {
    const result = resolveReferences('x {{components.c1.value}} y', withComponent('a $& b'));

    // Actual today: 'x a {{components.c1.value}} b y' — `$&` expanded to the binding text.
    expect(result).toBe('x a $& b y');
  });

  test.failing(
    "a resolved value containing `` $` `` / `$'` must not splice in the surrounding text — utils.js:276",
    () => {
      const result = resolveReferences('x {{components.c1.value}} y', withComponent("$` and $'"));

      // Actual today: 'x x  and  y y' — the prefix and suffix of the whole string got
      // spliced into the middle of the user's own value.
      expect(result).toBe("x $` and $' y");
    }
  );

  test.failing('a resolved value containing `$$` must keep both dollar signs — utils.js:276', () => {
    const result = resolveReferences('cost: {{components.c1.value}}', withComponent('$$'));

    // Actual today: 'cost: $' — `$$` is the escape for a literal `$`, so one is eaten.
    expect(result).toBe('cost: $$');
  });

  test.failing('the multi-binding whole-string loop is corrupted the same way — utils.js:251', () => {
    // A string that both starts with `{{` and ends with `}}` but holds several bindings
    // takes the other interpolation loop (utils.js:237-254), which has the identical
    // `object.replace(dynamicVariable, value)` hazard.
    const result = resolveReferences('{{components.c1.value}} {{components.c2.value}}', {
      components: { c1: { value: '$&' }, c2: { value: 'B' } },
    });

    // Actual today: '{{components.c1.value}} B' — c1's `$&` re-inserted its own binding
    // source, which then survives every later pass.
    expect(result).toBe('$& B');
  });

  test.failing('a resolved value that itself contains `{{...}}` must not be re-substituted — utils.js:251,267', () => {
    // Same root cause plus an amplifier: after the loop at utils.js:237-254 finishes,
    // utils.js:267 runs getDynamicVariables over the ALREADY-SUBSTITUTED string and
    // resolves whatever bindings the user's own data introduced.
    const result = resolveReferences('{{components.c1.value}} {{components.c2.value}}', {
      components: { c1: { value: '{{components.c2.value}}' }, c2: { value: 'B' } },
    });

    // Actual today: 'B B' — c1's literal text was re-resolved by the second pass, so
    // the binding the user typed is gone and c2's value appears twice.
    expect(result).toBe('{{components.c2.value}} B');
  });
});

describe('resolveReferences — whitespace inside the braces', () => {
  test('the braces and the padding around them are stripped before evaluation', () => {
    // removeNestedDoubleCurlyBraces (utils.js:1322) is what turns `{{  expr  }}` into
    // `expr`. Leave the braces in and `return {{ ... }}` reaches Function() as a syntax
    // error, so EVERY binding in the app blanks at once.
    expect(resolveReferences('{{  components.c1.value  }}', withComponent('hello'))).toBe('hello');
  });

  test('tab padding also survives', () => {
    // Tabs are not stripped by this copy (see the failing test below), but `return \tx\t`
    // is still valid JavaScript, so only the newline case is broken.
    expect(resolveReferences('{{\tcomponents.c1.value\t}}', withComponent(7))).toBe(7);
  });

  test.failing('a NEWLINE-padded binding must resolve — utils.js:1357,1371', () => {
    // The `_helpers` copy of removeNestedDoubleCurlyBraces trims only `' '`:
    //     if (transformedInput[iter] === ' ' && shouldRemoveSpace)
    // The store copy trims `[' ', '\n', '\t']`. So here the newline survives, resolveCode
    // builds `return \n components.c1.value \n`, and JavaScript's automatic semicolon
    // insertion turns that into a bare `return;` — the expression is never evaluated and
    // the binding resolves to `undefined`, silently.
    //
    // Multi-line bindings come out of the CodeEditor with real newlines, so this is
    // reachable by anyone who presses Enter inside `{{ }}` on a field that goes through
    // this resolver.
    const result = resolveReferences('{{\n components.c1.value \n}}', withComponent(7));

    // Actual today: undefined.
    expect(result).toBe(7);
  });

  test('a newline-padded binding embedded in text is not even recognised as a binding', () => {
    // getDynamicVariables (utils.js:312) uses `/\{\{(.*?)\}\}/g`, and `.` does not match
    // a newline — so the interpolation path leaves the raw text on screen. Pinned as the
    // second half of the same defect.
    expect(resolveReferences('x {{\n components.c1.value \n}} y', withComponent(7))).toBe(
      'x {{\n components.c1.value \n}} y'
    );
  });
});

describe('resolveReferences — non-binding input is passed through, not evaluated', () => {
  // THE headline divergence from the store resolver. `resolveDynamicValues` falls into an
  // else branch that evaluates the whole string as JavaScript, so `'hello world'` becomes
  // `''` there and its callers must gate on `includes('{{')`. This resolver's `switch`
  // (utils.js:215) plus the `startsWith('{{')` tests mean plain text is returned as-is,
  // and no caller gate is required.

  test('ordinary prose is returned unchanged', () => {
    expect(resolveReferences('hello world', {})).toBe('hello world');
  });

  test('an unterminated `{{` or a stray `}}` is returned unchanged', () => {
    expect(resolveReferences('{{ unclosed', {})).toBe('{{ unclosed');
    expect(resolveReferences('closed }}', {})).toBe('closed }}');
  });

  test('non-string scalars fall through the switch untouched', () => {
    // utils.js:305-308's default branch. `resolveWidgetFieldValue` hands raw definition
    // values straight in, so numbers and booleans must survive.
    expect(resolveReferences(42, {})).toBe(42);
    expect(resolveReferences(true, {})).toBe(true);
    expect(resolveReferences(undefined, {})).toBeUndefined();
  });
});

describe('resolveReferences — the `%%server.x%%` branch', () => {
  // NOT covered here, deliberately: the `$`-escaping on resolveString's server
  // substitution (utils.js:184 and :186) has no demonstrable path from any exported
  // entry point. resolveString itself has zero production importers, and no
  // resolveReferences input we could construct routes a `%%server.x%%` value through
  // those two lines — reverting the fix on both leaves all 54 tests green. The fix is
  // kept because a replacer function is strictly safer, but the branch looks like dead
  // code and is a deletion candidate rather than a testing gap. Do not add a direct
  // resolveString test to "cover" it; that would only assert that unreachable code works.

  test('a whole-string `%%server.x%%` resolves against state.server', () => {
    // utils.js:256-264, called with isJsCode=false so `server` is the populated argument.
    expect(resolveReferences('%%server.foo%%', { server: { foo: 'S' } })).toBe('S');
  });

  test('a nested server path is refused and returns a [value, error] tuple even when withError is false', () => {
    // utils.js:259-262. The regex allows exactly `server.<alnum>`; anything deeper could
    // walk into a secret. Pinned including the API wart: this branch returns the tuple
    // unconditionally, so a caller that passed withError=false still gets an array.
    expect(resolveReferences('%%server.foo.bar%%', { server: { foo: { bar: 'S' } } })).toEqual([
      {},
      "server.foo.bar is invalid. Server variables can't be used like this",
    ]);
  });

  test('a nested server path embedded in text is masked as "HiddenEnvironmentVariable"', () => {
    // utils.js:179-180 — the embedded-in-text counterpart of the guard above. It masks
    // rather than errors, so the value never reaches the browser.
    expect(resolveReferences('a {{1}} b %%server.foo.bar%% c', { server: { foo: { bar: 'S' } } })).toBe(
      'a 1 b HiddenEnvironmentVariable c'
    );
  });

  test('a mixed `{{}}` + `%%%%` string resolves both kinds through resolveString', () => {
    // utils.js:217 is the ONLY entry point to resolveString from resolveReferences, and
    // it requires the string to contain `{{`, `}}` and `%%`. A `%%` inside a string that
    // has no `{{` never reaches the server branch here.
    expect(
      resolveReferences('a {{components.c1.value}} b %%server.foo%% c', {
        components: { c1: { value: 'C' } },
        server: { foo: 'S' },
      })
    ).toBe('a C b S c');
  });
});

describe('resolveReferences — objects and arrays are walked recursively', () => {
  test('object values are resolved in place', () => {
    // utils.js:296-303. This is what makes `resolveReferences(styleObject, state)` work
    // for the inspector's object-valued properties.
    expect(resolveReferences({ a: '{{components.c1.value}}', b: 'plain' }, withComponent('A'))).toEqual({
      a: 'A',
      b: 'plain',
    });
  });

  test('nested objects are resolved at every depth', () => {
    expect(resolveReferences({ a: { b: '{{components.c1.value}}' } }, withComponent('A'))).toEqual({ a: { b: 'A' } });
  });

  test("the input is cloned at every level, so the caller's object keeps its bindings", () => {
    // utils.js:205 `object = _.clone(object)`. The clone is shallow, but the object branch
    // recurses through resolveReferences, which clones again — so nothing the caller owns
    // is mutated. Callers that re-resolve the same definition on every render depend on
    // this: mutate in place once and the bindings are gone forever.
    const input = { a: '{{components.c1.value}}', nested: { b: '{{components.c1.value}}' } };

    expect(resolveReferences(input, withComponent('A'))).toEqual({ a: 'A', nested: { b: 'A' } });
    expect(input.a).toBe('{{components.c1.value}}');
    expect(input.nested.b).toBe('{{components.c1.value}}');
  });

  test.failing('array elements must be resolved against the state — utils.js:290', () => {
    // utils.js:286-291:
    //     object.forEach((element, index) => {
    //       const resolved_object = resolveReferences(element);   // <- no state argument
    //     });
    // The object branch three lines below DOES pass `state`. So every binding inside an
    // array resolves against `undefined` and blanks: any array-valued property fed
    // through resolveReferences (Table column lists, option lists, `customResolveObjects`
    // arrays) loses its bindings while the sibling object form works.
    const result = resolveReferences(['{{components.c1.value}}', 'plain'], withComponent('A'));

    // Actual today: ['', 'plain'].
    expect(result).toEqual(['A', 'plain']);
  });
});

describe('resolveReferences — the reservedKeyword blocklist', () => {
  // `reservedKeyword` (utils.js:16) is `['app', 'window']`, and resolveCode consumes it
  // by declaring it as one more Function PARAMETER NAME (utils.js:119) whose argument is
  // `null` (utils.js:137) — the array stringifies to "app,window", so both identifiers
  // are shadowed inside the evaluated expression.

  test('the blocklist is forwarded on the embedded-text path, so `{{window.document}}` cannot reach the real DOM', () => {
    // utils.js:161 passes `reservedKeyword` into resolveCode. Pass `[]` there instead and
    // this interpolates the live `document` object into the string.
    expect(resolveReferences('x {{window.document}} y %%1%%', {})).toBe('x  y 1');
  });

  test('resolveCode shadows the reserved identifiers when the list is supplied', () => {
    // With the list passed, `window` inside the expression is the null parameter, not the
    // browser global — so a property read on it throws and the result blanks.
    expect(resolveCode('window.document', {}, {}, false, ['app', 'window'], true)).toBe('');
  });

  test.failing('a whole-string `{{window}}` must not leak the real global — utils.js:235', () => {
    // utils.js:235 calls resolveCode with a hard-coded EMPTY reservedKeyword list:
    //     return resolveCode(code, state, customObjects, withError, [], true);
    // so the shadowing above never happens on the single-binding path, and the expression
    // sees the genuine `window`. Every other call site in this file forwards the real
    // blocklist (utils.js:161, 182, 264), which is what makes this an oversight rather
    // than a design choice.
    const result = resolveReferences('{{window}}', {});

    // Actual today: the live jsdom/browser Window object itself, handed straight to
    // whatever property was bound. `{{window.localStorage}}` is reachable the same way.
    expect(result).not.toBe(globalThis.window);
  });
});
