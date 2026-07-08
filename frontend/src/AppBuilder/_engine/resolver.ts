/**
 * Resolution Engine — pure expression resolver (Phase 2, first extraction).
 *
 * MOVED verbatim from `_stores/utils.js` so the engine owns the single source
 * of truth for `{{ }}` resolution; `_stores/utils.js` re-exports from here for
 * backward compatibility. No behavior change intended.
 *
 * Purity contract (worker-hostable):
 *   - No React, no DOM, no `window`, no Zustand.
 *   - State arrives as arguments; diffs/values are returned.
 *   - The only module deps are moment/lodash and the two Phase 0 utilities
 *     (compiled-fn cache, file-handle materialization), all worker-safe.
 *
 * NOTE: two more resolver copies still exist (`_helpers/utils.js:93`,
 * `CodeEditor/utils.js:139`). They unify onto this module later in Phase 2 —
 * each needs its own shadow-verification because their param lists differ.
 */
import moment from 'moment';
import { getCompiledFn } from '@/AppBuilder/_utils/resolverCache';
import { materializeFileHandleRefs } from '@/AppBuilder/_utils/fileHandleRegistry';

// babel-plugin-import (configured for lodash in webpack.config.js) assumes
// every usage of a default-imported lodash object is a `_.method()` member
// access it can rewrite to a `lodash/method` import, and unconditionally
// strips the original `import ... from 'lodash'` statement on that
// assumption. This file hands the WHOLE lodash object to arbitrary user
// `{{ }}` code (any method might be called), so there's no static
// member-access site for the plugin to see — it drops the import anyway,
// leaving a bare unbound `_` reference that throws at runtime. A plain
// require() isn't an `import` AST node, so the plugin's rewriter never
// touches it.
declare const require: (id: string) => any;
const _lodash = require('lodash');

/* eslint-disable @typescript-eslint/no-explicit-any */
type ResolverState = Record<string, any>;

// Returns an array of dynamic variables in the text like {{variable}} or %%variable%%
// Eg, input: "Hello, {{name}}! Welcome to {{city}}."
//     output: ["{{name}}", "{{city}}"]
export const getDynamicVariables = (text: string): string[] | null => {
  /* eslint-disable no-useless-escape */
  const matchedParams = text.match(/\{\{(.*?)\}\}/g) || text.match(/\%\%(.*?)\%\%/g);
  return matchedParams;
};

const queryHasStringOtherThanVariable = (query: string): boolean => {
  const startsWithDoubleCurly = query.startsWith('{{');
  const endsWithDoubleCurly = query.endsWith('}}');

  if (startsWithDoubleCurly && endsWithDoubleCurly) {
    const content = query.slice(2, -2).trim();

    if (content.includes(' ')) {
      return true;
    }

    //* Check if the content includes a template literal
    //!Note: Do not delete this regex, it is used to check if the content includes a template literal
    //used for cases like {{queries.runjs1.data[0][`${components.textinput1.value}`]}}
    const templateLiteralRegex = /\$\{[^}]+\}/;
    return templateLiteralRegex.test(content);
  }

  return false;
};

export const removeNestedDoubleCurlyBraces = (str: string): string => {
  const transformedInput: string[] = str.split('');
  let iter = 0;
  const stack: number[] = [];

  while (iter < str.length - 1) {
    if (transformedInput[iter] === '{' && transformedInput[iter + 1] === '{') {
      transformedInput[iter] = 'le';
      transformedInput[iter + 1] = 'le';
      stack.push(2);
      iter += 2;
    } else if (transformedInput[iter] === '{') {
      stack.push(1);
      iter++;
    } else if (transformedInput[iter] === '}' && stack.length > 0 && stack[stack.length - 1] === 1) {
      stack.pop();
      iter++;
    } else if (
      transformedInput[iter] === '}' &&
      stack.length > 0 &&
      transformedInput[iter + 1] === '}' &&
      stack[stack.length - 1] === 2
    ) {
      stack.pop();
      transformedInput[iter] = 'ri';
      transformedInput[iter + 1] = 'ri';
      iter += 2;
    } else {
      iter++;
    }
  }

  iter = 0;
  let shouldRemoveSpace = true;
  while (iter < str.length) {
    if (shouldRemoveSpace && [' ', '\n', '\t'].includes(transformedInput[iter])) {
      transformedInput[iter] = '';
    } else if (transformedInput[iter] === 'le') {
      shouldRemoveSpace = true;
      transformedInput[iter] = '';
    } else {
      shouldRemoveSpace = false;
    }
    iter++;
  }

  iter = str.length - 1;
  shouldRemoveSpace = true;
  while (iter >= 0) {
    if (shouldRemoveSpace && [' ', '\n', '\t'].includes(transformedInput[iter])) {
      transformedInput[iter] = '';
    } else if (transformedInput[iter] === 'ri') {
      shouldRemoveSpace = true;
      transformedInput[iter] = '';
    } else {
      shouldRemoveSpace = false;
    }
    iter--;
  }

  return transformedInput.join('');
};

/**
 * Shared eval core — the ONE place expressions are compiled and executed.
 * The three legacy resolveCode copies differ only in their parameter lists and
 * error formatting; each becomes a thin adapter over this function.
 */
export const evaluateCode = (
  code: string,
  params: [name: string, value: unknown][],
  withError = false,
  reservedKeyword: string[] = []
): unknown => {
  let result: unknown = '';
  let error: unknown;

  if (code === '_' || code.includes('this._')) {
    error = `Cannot resolve circular reference ${code}`;
  } else if (code.startsWith('queries.') && code.endsWith('run()')) {
    //! dont resolve if code starts with "queries." and ends with "run()"
    error = `Cannot resolve function call ${code}`;
  } else {
    try {
      // Compiled once per (params, code) and reused across rows/cascades —
      // state arrives as call arguments, so the function is state-independent.
      const evalFunction = getCompiledFn([...params.map(([name]) => name), reservedKeyword], code);
      result = evalFunction(...params.map(([, value]) => value), null);
    } catch (err) {
      error = err;
    }
  }

  // File fields are exposed as lightweight handle refs to keep the store lean;
  // hydrate them to real strings before the resolved value leaves the resolver.
  // No-op (same reference back) unless file handles are registered.
  result = materializeFileHandleRefs(result);

  if (withError) return [result, error];
  return result;
};

// The following function will convert components["compId"].value to actual value
export const resolveCode = (
  code: string,
  state: ResolverState = {},
  customObjects: Record<string, unknown> = {},
  withError = false,
  reservedKeyword: string[] = [],
  isJsCode = true
): unknown => {
  return evaluateCode(
    code,
    [
      ['variables', isJsCode ? state?.variables : undefined],
      ['components', isJsCode ? state?.components : undefined],
      ['queries', isJsCode ? state?.queries : undefined],
      ['globals', isJsCode ? state?.globals : undefined],
      ['page', isJsCode ? state?.page : undefined],
      ['input', isJsCode ? state?.input : undefined],
      ['client', isJsCode ? undefined : state?.client],
      ['server', isJsCode ? undefined : state?.server],
      // Passing constants as an argument allows the evaluated code to access and utilize the constants value correctly.
      ['constants', state?.constants],
      ['parameters', state?.parameters],
      ['moment', moment],
      ['_', _lodash],
      ...Object.entries(customObjects),
    ],
    withError,
    reservedKeyword
  );
};

// The following function will be resposible to convert dynamic values like `Hello {{components.compId.value}} {{components.compId2.value}}` to `Hello 123 456  `
// {{components.compId.value}} -> 123
// {{components.compId2.value}} -> 456
export const resolveDynamicValues = (
  code: string,
  state: ResolverState = {},
  customObjects: Record<string, unknown> = {},
  withError = false,
  reservedKeyword: string[] = [],
  isJsCode = true
): unknown => {
  try {
    const allDynamicVariables = getDynamicVariables(code) || [];

    const queryHasJSCode = queryHasStringOtherThanVariable(code);
    let useJSResolvers = queryHasJSCode || (getDynamicVariables(code)?.length ?? 0) > 1;

    if (
      !queryHasJSCode &&
      allDynamicVariables.length === 1 &&
      (!code.startsWith('{{') || !code.endsWith('}}')) &&
      code.includes('{{')
    ) {
      useJSResolvers = true;
    }

    if (useJSResolvers) {
      try {
        let resolvedValue: unknown = code;
        const isJSCodeResolver = queryHasJSCode && (allDynamicVariables.length === 1 || allDynamicVariables.length === 0);

        if (!isJSCodeResolver) {
          allDynamicVariables.forEach((variable) => {
            const variableToResolve = removeNestedDoubleCurlyBraces(variable);
            const resolvedCode = resolveCode(variableToResolve, state, customObjects, withError, reservedKeyword, isJsCode);
            resolvedValue = (resolvedValue as string).replace(variable, (resolvedCode as string) ?? '');
          });
        } else {
          const variableToResolve = removeNestedDoubleCurlyBraces(code);
          const resolvedCode = resolveCode(variableToResolve, state, customObjects, withError, reservedKeyword, isJsCode);
          resolvedValue =
            typeof resolvedCode === 'string' ? (resolvedValue as string).replace(code, resolvedCode) : resolvedCode;
        }
        return resolvedValue;
      } catch (error) {
        console.error('Error resolving code', error);
      }
    } else {
      const value = removeNestedDoubleCurlyBraces(code);
      const resolvedCode = resolveCode(value, state, customObjects, withError, reservedKeyword, isJsCode);
      return resolvedCode;
    }
  } catch (error) {
    console.log(error);
  }
};
