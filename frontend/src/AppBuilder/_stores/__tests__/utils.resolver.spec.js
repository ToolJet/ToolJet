/**
 * Contract tests for the expression resolver: `resolveDynamicValues` and `resolveCode`
 * in `_stores/utils.js`.
 *
 * Every `{{expression}}` in every ToolJet app is evaluated here. Both functions are
 * pure (they take the state object as an argument and touch no store), so these tests
 * use ZERO mocks — the only import is the module under test.
 *
 * What is pinned, and why each fact matters:
 *
 *  - Which of the three internal paths a string takes decides whether the result keeps
 *    its JavaScript type or is flattened to a string. A widget that expects a number and
 *    gets "42" (or `[object Object]`) is a shipped bug, and the path choice is driven by
 *    nothing more than whether the string starts with `{{`, ends with `}}`, and contains
 *    a space.
 *  - A failing expression is swallowed and becomes `''`. That is the difference between a
 *    widget rendering blank and the canvas crashing, so it must never start throwing.
 *  - Substitution back into the surrounding text uses `String.prototype.replace` with a
 *    *string* pattern (utils.js:97 and utils.js:109). The replacement argument is the
 *    resolved user value, so `$&`, `` $` ``, `$'` and `$$` inside ordinary user data are
 *    interpreted as replacement patterns. Those cases are `test.failing` below — real,
 *    unfixed, silent data corruption. The fix is a replacer function at both sites.
 *  - Also open: a resolved value that itself contains `{{...}}` is re-substituted on a
 *    later iteration of the loop, so two bindings can swap values. A proper fix needs a
 *    single-pass replace that also handles the `%%...%%` delimiter form.
 *
 * NOTE: `ast.js` (reference extraction / dependency edges) is covered by `ast.spec.js`.
 * Nothing here duplicates it — these tests are about evaluation, not extraction.
 */
import { resolveCode, resolveDynamicValues } from '@/AppBuilder/_stores/utils';

// The resolver receives the already-flattened exposed-value state; `components`,
// `queries`, `variables`, ... become the argument names of the generated Function.
const withComponent = (value, name = 'c1') => ({ components: { [name]: { value } } });

describe('resolveDynamicValues — interpolation uses String.replace, so `$` in user data corrupts the output', () => {
  // utils.js:97 — `resolvedValue.replace(variable, resolvedCode ?? '')`.
  // `variable` is a plain string, and the second argument of String.replace is a
  // *replacement pattern*: `$&` expands to the matched text (the binding source),
  // `` $` `` to everything before it, `$'` to everything after it, `$$` to a literal `$`.
  //
  // User-facing impact: a Text widget bound to `Hi {{components.input1.value}}!` shows
  // garbage the moment somebody types `$&` or `$'` into the input — a price list
  // ("$&nbsp;"), a regex a support agent pasted, a currency template. Nothing errors,
  // nothing is logged; the value is silently rewritten. The fix is to pass a replacer
  // function (`() => resolvedCode`) at utils.js:97 and :109.

  test.failing('a resolved value containing `$&` must be inserted verbatim', () => {
    const result = resolveDynamicValues('x {{components.c1.value}} y', withComponent('a $& b'));

    // Actual today: 'x a {{components.c1.value}} b y' — `$&` expanded to the binding text.
    expect(result).toBe('x a $& b y');
  });

  test.failing("a resolved value containing `` $` `` / `$'` must not splice in the surrounding text", () => {
    const result = resolveDynamicValues('x {{components.c1.value}} y', withComponent("$` and $'"));

    // Actual today: 'x x  and  y y' — the prefix and suffix of the whole string got
    // spliced into the middle of the user's own value.
    expect(result).toBe("x $` and $' y");
  });

  test.failing('a resolved value containing `$$` must keep both dollar signs', () => {
    const result = resolveDynamicValues('cost: {{components.c1.value}}', withComponent('$$'));

    // Actual today: 'cost: $' — `$$` is the escape for a literal `$`, so one is eaten.
    expect(result).toBe('cost: $$');
  });

  test.failing('the whole-string JS-expression path is corrupted the same way', () => {
    // A `{{ }}` whose contents contain a space takes the isJSCodeResolver branch and is
    // substituted at utils.js:109 — `resolvedValue.replace(code, resolvedCode)` — with the
    // same replacement-pattern hazard, and here the "matched text" is the entire binding.
    const result = resolveDynamicValues("{{'a $& b'}}", {});

    // Actual today: "a {{'a $& b'}} b".
    expect(result).toBe('a $& b');
  });

  test.failing('a resolved value that itself contains `{{...}}` must not be re-substituted', () => {
    // Same root cause: substitution happens into a string that already holds earlier
    // results, so user data that looks like a binding hijacks the next iteration's
    // `replace` and lands in the wrong position.
    const result = resolveDynamicValues('{{components.c1.value}} {{components.c2.value}}', {
      components: { c1: { value: '{{components.c2.value}}' }, c2: { value: 'B' } },
    });

    // Actual today: 'B {{components.c2.value}}' — the two halves are swapped.
    expect(result).toBe('{{components.c2.value}} B');
  });
});

describe('resolveDynamicValues — several bindings in one string', () => {
  test('every binding in the string is resolved', () => {
    // The forEach at utils.js:87 is the only thing that resolves binding #2 onwards.
    // If it ever stops iterating, the tail of a template renders as raw `{{...}}` text.
    const result = resolveDynamicValues('{{components.c1.value}} and {{components.c2.value}}', {
      components: { c1: { value: 'A' }, c2: { value: 'B' } },
    });

    expect(result).toBe('A and B');
  });

  test('a binding repeated twice is resolved at both occurrences', () => {
    // getDynamicVariables returns the duplicate twice, and each pass replaces the
    // left-most remaining occurrence. Losing the duplicate entry would leave the
    // second `{{...}}` visible on the canvas.
    const result = resolveDynamicValues('{{components.c1.value}}-{{components.c1.value}}', withComponent('A'));

    expect(result).toBe('A-A');
  });
});

describe('resolveDynamicValues — a binding that IS the whole string keeps its JavaScript type', () => {
  // utils.js:115-119: `{{expr}}` with no surrounding text and no space inside skips
  // interpolation entirely and returns whatever the expression evaluated to. Widgets
  // rely on this: a Table's `data` must stay an array, `disabled` must stay a boolean.
  const whole = (value) => resolveDynamicValues('{{components.c1.value}}', withComponent(value));

  test('a number stays a number', () => {
    expect(whole(42)).toBe(42);
  });

  test('a boolean false stays boolean false, not the string "false"', () => {
    // The one that bites hardest: `'false'` is truthy, so a flattened boolean inverts
    // every `visible` / `disabled` binding.
    expect(whole(false)).toBe(false);
  });

  test('an object stays an object', () => {
    expect(whole({ a: 1 })).toEqual({ a: 1 });
  });

  test('an array stays an array', () => {
    expect(whole([1, 2])).toEqual([1, 2]);
  });

  test('null stays null', () => {
    expect(whole(null)).toBeNull();
  });

  test('undefined stays undefined', () => {
    // Not `''`. Callers that distinguish "not set" from "empty" (defaults via `??`)
    // depend on this.
    expect(whole(undefined)).toBeUndefined();
  });
});

describe('resolveDynamicValues — a binding embedded in text is stringified', () => {
  // Once there is surrounding text the result is spliced into a string, so the type is
  // gone by construction. These are the exact strings the canvas shows.
  const embedded = (value) => resolveDynamicValues('n={{components.c1.value}}', withComponent(value));

  test('a number becomes its decimal form', () => {
    expect(embedded(42)).toBe('n=42');
  });

  test('an object becomes "[object Object]"', () => {
    // Worth knowing before blaming the widget: this is the resolver, not the renderer.
    expect(embedded({ a: 1 })).toBe('n=[object Object]');
  });

  test('an array becomes its comma-joined form, with no brackets', () => {
    expect(embedded([1, 2])).toBe('n=1,2');
  });

  test('null and undefined become the empty string, not "null"/"undefined"', () => {
    // The `?? ''` at utils.js:97. Without it a Text widget bound to an unset value
    // would literally print "undefined".
    expect(embedded(null)).toBe('n=');
    expect(embedded(undefined)).toBe('n=');
  });
});

describe('resolveCode / resolveDynamicValues — a broken expression yields a blank, never a throw', () => {
  // This is the single most load-bearing fact in the module. resolveCode initialises
  // `result = ''` (utils.js:134) and swallows the exception into `error`, and
  // resolveDynamicValues has two more try/catch layers. If any of that starts
  // propagating, one bad binding takes down the whole canvas render instead of
  // blanking one property.

  test('a member access on an undefined root resolves to the empty string', () => {
    expect(resolveDynamicValues('{{foo.bar.baz}}', {})).toBe('');
  });

  test('the same failure embedded in text blanks only the binding', () => {
    expect(resolveDynamicValues('x {{foo.bar.baz}} y', {})).toBe('x  y');
  });

  test('a syntax error in the expression also resolves to the empty string', () => {
    expect(resolveDynamicValues('{{a b c}}', {})).toBe('');
  });

  test('resolveCode with withError returns [result, Error] instead of throwing', () => {
    // The CodeEditor uses this pair to show the red error text under a field
    // (CodeEditor/utils.js:324). The error is a real Error object here.
    const [result, error] = resolveCode('foo.bar.baz', {}, {}, true);

    expect(result).toBe('');
    expect(error).toBeInstanceOf(ReferenceError);
    expect(error.message).toMatch(/foo is not defined/);
  });

  test('the circular-reference guard reports a plain STRING, not an Error', () => {
    // utils.js:137-138. Note the inconsistency: eval failures give an Error object but
    // the two early guards give a string. Any caller doing `error.message` gets
    // `undefined` for these two cases, which is why the guard messages never surface.
    const [result, error] = resolveCode('_', {}, {}, true);

    expect(result).toBe('');
    expect(error).toBe('Cannot resolve circular reference _');
  });

  test('a query `run()` call is refused rather than executed', () => {
    // utils.js:139-141. Resolving `{{queries.q1.run()}}` would fire the query on every
    // recompute, so it is blocked at the resolver — again with a string error.
    const [result, error] = resolveCode('queries.q1.run()', {}, {}, true);

    expect(result).toBe('');
    expect(error).toBe('Cannot resolve function call queries.q1.run()');
  });

  test('withError is NOT supported on the interpolation path — the [result, error] tuple is stringified into the output', () => {
    // Pinned as a warning, not as a desired behaviour: utils.js:97 has no idea
    // resolveCode returned a tuple, so it interpolates `String([result, error])`.
    // Every production caller passes withError=false (resolvedSlice.js:774,
    // componentsSlice.js:562), which is the only reason this is not visible today.
    expect(resolveDynamicValues('x {{foo.bar.baz}} y', {}, {}, true)).toBe('x ,ReferenceError: foo is not defined y');
  });
});

describe('resolveCode — lodash must be reachable as `_` inside expressions', () => {
  test('`{{_.sum([1,2,3])}}` evaluates', () => {
    // `_` is injected as a Function parameter (utils.js:157 / 175). If lodash is ever
    // undefined at that point, every `_.`-using binding in every app silently blanks.
    expect(resolveDynamicValues('{{_.sum([1,2,3])}}', {})).toBe(6);
  });

  test('utils.js must load lodash with require(), never `import _ from "lodash"`', () => {
    // The packaging trap this file has hit three times: babel-plugin-import (applied by
    // the app's babel config, NOT by jest) rewrites `import _ from 'lodash'` into
    // per-method imports and drops the default binding entirely when `_` is only ever
    // passed as a raw value — which is exactly what resolveCode does with it.
    //
    // Under jest the import form would work fine, so the runtime test above CANNOT
    // catch the regression. This static assertion is the only guard.
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../utils.js'), 'utf8');

    expect(source).toMatch(/require\(['"]lodash['"]\)/);
    expect(source).not.toMatch(/import\s+_\s*(,|from)/);
  });

  test('`{{_}}` on its own is refused by the circular-reference guard', () => {
    // Handing the raw lodash object to a widget property is treated as a circular
    // reference (utils.js:137), so it blanks rather than serialising the library.
    expect(resolveDynamicValues('{{_}}', {})).toBe('');
  });
});

describe('resolveDynamicValues — whitespace, ternaries and object literals', () => {
  test('padding inside the braces is stripped before evaluation', () => {
    // removeNestedDoubleCurlyBraces (utils.js:218) strips the braces AND the padding.
    // Without it the raw `{{...}}` reaches Function() and every binding is a syntax error.
    expect(resolveDynamicValues('{{  components.c1.value  }}', withComponent('hello'))).toBe('hello');
  });

  test('padding must not push a single binding onto the interpolation path', () => {
    // queryHasStringOtherThanVariable trims before testing for a space (utils.js:202).
    // Drop that trim and `{{ components.c1.value }}` looks like "JS code", which routes
    // it through the utils.js:109 replace — where a `$`-bearing value is corrupted and
    // a non-string value would be re-wrapped. The trim is what keeps padded bindings
    // behaving exactly like unpadded ones.
    expect(resolveDynamicValues('{{ components.c1.value }}', withComponent('a $& b'))).toBe('a $& b');
  });

  test('a newline-padded binding resolves', () => {
    // Multi-line bindings come out of the CodeEditor with real newlines.
    expect(resolveDynamicValues('{{\n components.c1.value \n}}', withComponent(7))).toBe(7);
  });

  test('a ternary over a component value evaluates', () => {
    const result = resolveDynamicValues("{{components.c1.value === 'hello' ? 'yes' : 'no'}}", withComponent('hello'));

    expect(result).toBe('yes');
  });

  test('a triple-brace object literal resolves to a real object, not a string', () => {
    // The `{{{ ... }}}` form used by Table column definitions and style objects.
    // utils.js:109 returns non-string results untouched; stringify them and every
    // object-valued property in the app breaks.
    const result = resolveDynamicValues('{{{ text: components.c1.value, color: "red" }}}', withComponent('hello'));

    expect(result).toEqual({ text: 'hello', color: 'red' });
  });
});

describe('resolveDynamicValues — strings with no complete binding are EVALUATED, not passed through', () => {
  // Counter-intuitive and worth being explicit about: this function does not guard
  // against plain text. With no `{{...}}` pair it falls into the utils.js:115 else
  // branch and evaluates the whole string as a JavaScript expression, so ordinary prose
  // is a ReferenceError and comes back as ''.
  //
  // Plain text survives in the app only because the CALLERS gate on
  // `includes('{{') && includes('}}')` — componentsSlice.js:637-641 and
  // resolvedSlice.js:763. Any new call site that forgets that gate blanks its input.
  // (componentsSlice.js:3178-3190 deliberately calls it ungated, to coerce
  // `'42'`/`'true'` style literals — which is why the else branch cannot simply return
  // the string unchanged.)

  test('ordinary prose resolves to the empty string', () => {
    expect(resolveDynamicValues('hello world', {})).toBe('');
  });

  test('an unterminated `{{` is not treated as a binding', () => {
    expect(resolveDynamicValues('{{ unclosed', {})).toBe('');
  });

  test('a stray `}}` is not treated as a binding', () => {
    expect(resolveDynamicValues('closed }}', {})).toBe('');
  });

  test("`}}` before `{{` passes the callers' gate but still resolves to the empty string", () => {
    // Reachable today: this string contains both `{{` and `}}`, so the caller gate lets
    // it in, no binding matches, and the whole thing is eval'd as JS. A Text widget
    // whose text is `a }} b {{ c` renders blank.
    expect(resolveDynamicValues('a }} b {{ c', {})).toBe('');
  });

  test('a non-string input returns undefined instead of throwing', () => {
    // `code.match` / `code.startsWith` would throw on a non-string; the outer catch at
    // utils.js:120 turns that into `undefined`. Callers that pass a raw definition value
    // get `undefined`, never an exception.
    expect(resolveDynamicValues(undefined, {})).toBeUndefined();
    expect(resolveDynamicValues(42, {})).toBeUndefined();
  });
});
