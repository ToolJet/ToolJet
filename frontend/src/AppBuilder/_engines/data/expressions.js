import moment from 'moment';
import _ from 'lodash';
import { materializeFileHandleRefs } from '@/AppBuilder/_utils/fileHandleRegistry';
import { extractAndReplaceReferencesFromString as referencesWithIds } from '@/AppBuilder/_stores/ast';
import { isFeatureEnabled } from '../features';

/**
 * `{{ }}` templates: how one is read (which `{{ }}` parts it has, whether it is JavaScript), and each expression
 * compiled to a function, once per text instead of on every resolution — a Table re-resolved four templates per cell
 * per render, each a fresh `Function(...)` compile. Everything that depends on the app's state (evaluating, replacing
 * the parts, errors and their logging) runs on every resolution, as before; only what depends on the text alone is
 * remembered. A text that fails to compile isn't remembered, so its error is raised every time, as before.
 */

// Texts remembered per cache; the oldest is forgotten past this.
const CACHE_LIMIT = 20000;

const remember = (cache, key, make) => {
  if (!isFeatureEnabled('expressions')) return make();
  if (cache.has(key)) return cache.get(key);
  const value = make();
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
  cache.set(key, value);
  return value;
};

// Returns an array of dynamic variables in the text like {{variable}} or %%variable%%
// Eg, input: "Hello, {{name}}! Welcome to {{city}}."
//     output: ["{{name}}", "{{city}}"]
export const getDynamicVariables = (text) => {
  const matchedParams = text.match(/\{\{(.*?)\}\}/gs) || text.match(/%%(.*?)%%/gs);
  return matchedParams;
};

const queryHasStringOtherThanVariable = (query) => {
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

export const removeNestedDoubleCurlyBraces = (str) => {
  const transformedInput = str.split('');
  let iter = 0;
  const stack = [];

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

const plans = new Map();

/**
 * How a template is resolved, read from its text alone: every `{{ }}` part (with its expression), whether the
 * template is resolved part by part (text around the parts, several parts) or as one expression (`whole`). Throws
 * what reading the text throws (a template that isn't a string).
 */
const planOf = (code) =>
  remember(plans, code, () => {
    const allDynamicVariables = getDynamicVariables(code) || [];
    const queryHasJSCode = queryHasStringOtherThanVariable(code);
    let useJSResolvers = queryHasJSCode || allDynamicVariables.length > 1;
    if (
      !queryHasJSCode &&
      allDynamicVariables.length === 1 &&
      (!code.startsWith('{{') || !code.endsWith('}}')) &&
      code.includes('{{')
    ) {
      useJSResolvers = true;
    }
    const isJSCodeResolver =
      useJSResolvers && queryHasJSCode && (allDynamicVariables.length === 1 || allDynamicVariables.length === 0);
    return {
      useJSResolvers,
      isJSCodeResolver,
      parts:
        useJSResolvers && !isJSCodeResolver
          ? allDynamicVariables.map((part) => [part, removeNestedDoubleCurlyBraces(part)])
          : null,
      whole: useJSResolvers && !isJSCodeResolver ? null : removeNestedDoubleCurlyBraces(code),
    };
  });

// The following function will be resposible to convert dynamic values like `Hello {{components.compId.value}} {{components.compId2.value}}` to `Hello 123 456  `
// {{components.compId.value}} -> 123
// {{components.compId2.value}} -> 456
export const resolveDynamicValues = (
  code,
  state = {},
  customObjects = {},
  withError = false,
  reservedKeyword = [],
  isJsCode = true
) => {
  try {
    const plan = planOf(code);

    if (plan.useJSResolvers) {
      try {
        let resolvedValue = code;

        if (!plan.isJSCodeResolver) {
          plan.parts.forEach(([variable, variableToResolve]) => {
            const resolvedCode = resolveCode(
              variableToResolve,
              state,
              customObjects,
              withError,
              reservedKeyword,
              isJsCode
            );
            resolvedValue = resolvedValue.replace(variable, resolvedCode ?? '');
          });
        } else {
          const resolvedCode = resolveCode(plan.whole, state, customObjects, withError, reservedKeyword, isJsCode);
          resolvedValue = typeof resolvedCode === 'string' ? resolvedValue.replace(code, resolvedCode) : resolvedCode;
        }
        return resolvedValue;
      } catch (error) {
        console.error('Error resolving code', error);
      }
    } else {
      return resolveCode(plan.whole, state, customObjects, withError, reservedKeyword, isJsCode);
    }
  } catch (error) {
    console.log(error);
  }
};

const compiled = new Map();

// The function `return ${code}` with the template's arguments, compiled once per text and custom-variable names.
const compile = (code, customNames, reservedKeyword) => {
  const params = [
    'variables',
    'components',
    'queries',
    'globals',
    'page',
    'input',
    'client',
    'server',
    'constants',
    'parameters',
    'moment',
    '_',
    ...customNames,
    reservedKeyword,
  ];
  return remember(compiled, `${code}\u0000${customNames.join('\u0001')}\u0000${String(reservedKeyword)}`, () =>
    Function(params, `return ${code}`)
  );
};

// The following function will convert components["compId"].value to actual value
export const resolveCode = (
  code,
  state = {},
  customObjects = {},
  withError = false,
  reservedKeyword = [],
  isJsCode = true
) => {
  let result = '';
  let error;

  if (code === '_' || code.includes('this._')) {
    error = `Cannot resolve circular reference ${code}`;
  } else if (code.startsWith('queries.') && code.endsWith('run()')) {
    //! dont resolve if code starts with "queries." and ends with "run()"
    error = `Cannot resolve function call ${code}`;
  } else {
    try {
      const evalFunction = compile(code, Object.keys(customObjects), reservedKeyword);
      result = evalFunction(
        isJsCode ? state?.variables : undefined,
        isJsCode ? state?.components : undefined,
        isJsCode ? state?.queries : undefined,
        isJsCode ? state?.globals : undefined,
        isJsCode ? state?.page : undefined,
        isJsCode ? state?.input : undefined,
        isJsCode ? undefined : state?.client,
        isJsCode ? undefined : state?.server,
        state?.constants, // Passing constants as an argument allows the evaluated code to access and utilize the constants value correctly.
        state?.parameters,
        moment,
        _,
        ...Object.values(customObjects),
        null
      );
    } catch (err) {
      error = err;
    }
  }

  result = materializeFileHandleRefs(result);
  if (withError) return [result, error];
  return result;
};

/**
 * Extracts and replaces references in a string with their corresponding IDs.
 *
 * @param {string} str - The string containing references to be replaced.
 * @param {Object} componentIdMap - A map of component IDs to their names.
 * @param {Object} queryIdMap - A map of query IDs to their names.
 * @returns {Object} An object containing the formatted string with IDs, all references, and the original string without brackets.
 */
export const extractAndReplaceReferencesFromString = (str = '', componentIdMap = {}, queryIdMap = {}) => {
  // Regex to match the format: components.compId.value or queries.queryId.value[0]
  const regex = /(components|queries|globals)\.([^.\s|}]+)\.([^\s|},]+)/g;
  const allRefs = [];
  let endsWithParenthesis = false;

  let valueWithBrackets = str.replace(regex, (match, entityType, entityName, entityKey) => {
    let entityId = entityName; // Assume entityName is already an ID

    if (entityType === 'components' && componentIdMap[entityName]) {
      entityId = componentIdMap[entityName];
    } else if (entityType === 'queries' && queryIdMap[entityName]) {
      entityId = queryIdMap[entityName];
    }

    // Remove leading dot from entityKey if it exists
    if (entityKey.startsWith('.')) {
      entityKey = entityKey.substring(1);
    }

    // Added to support cases like {{JSON.stringify(components.table1.selectedRow)}}
    if (entityKey.endsWith(')')) {
      entityKey = entityKey.slice(0, -1);
      endsWithParenthesis = true;
    }

    allRefs.push({ entityType, entityNameOrId: entityId, entityKey });
    return `${entityType}["${entityId}"].${entityKey}`;
  });

  if (endsWithParenthesis) valueWithBrackets = valueWithBrackets + ')';

  const varRegex = /(variables|constants|page)\.([^\s|})\]]+)/g;
  if (varRegex.test(valueWithBrackets)) {
    valueWithBrackets = valueWithBrackets.replace(varRegex, (match, entityType, entityKey) => {
      allRefs.push({ entityType, entityKey });
      return `${entityType}.${entityKey}`;
    });
  }

  const pageRegex = /(page)\.(variables)\.([^\s|})\]]+)/g;
  if (pageRegex.test(valueWithBrackets)) {
    valueWithBrackets = valueWithBrackets.replace(pageRegex, (match, entityType, entityName, entityKey) => {
      allRefs.push({ entityType, entityNameOrId: entityName, entityKey });
      return `${entityType}["${entityName}"].${entityKey}`;
    });
  }

  // Create the formatted string without square brackets
  const valueWithId = valueWithBrackets.replace(/\["([^"]+)"\]/g, '.$1');

  return { valueWithId, allRefs, valueWithBrackets: valueWithBrackets };
};

// A template with its names replaced by IDs (the AST rewrite in _stores/ast.js), per pair of name→ID maps: store
// objects, replaced — never changed in place — when a name is added or renamed.
const withIdsByMaps = new WeakMap();

/** `extractAndReplaceReferencesFromString(value, componentIdMap, queryIdMap).valueWithBrackets` (ast.js), remembered. */
export const valueWithIds = (value, componentIdMap, queryIdMap) => {
  const rewrite = () => referencesWithIds(value, componentIdMap, queryIdMap).valueWithBrackets;
  if (!componentIdMap || !queryIdMap || typeof componentIdMap !== 'object' || typeof queryIdMap !== 'object') {
    return rewrite();
  }
  let byQueryMap = withIdsByMaps.get(componentIdMap);
  if (!byQueryMap) withIdsByMaps.set(componentIdMap, (byQueryMap = new WeakMap()));
  let texts = byQueryMap.get(queryIdMap);
  if (!texts) byQueryMap.set(queryIdMap, (texts = new Map()));
  return remember(texts, value, rewrite);
};

/**
 * Whether a ListView/Kanban child's property is the same on every row: its template names none of the row's own
 * values (`listItem`, `cardData`…, `rowKeys`), touches no component inside the list (`descendantIds`, whose values
 * differ per row), and can't do anything that differs between evaluations (no calls, assignments, `new`, `this`…). Then
 * evaluating it for each row gives each row the same value.
 */
export const readsNothingRowScoped = (template, rowKeys, descendantIds) => {
  if (typeof template !== 'string') return false;
  if (/[()]|(^|[^=!<>])=(?!=)|\+\+|--|\b(new|delete|this|arguments|await|yield|import)\b/.test(template)) return false;
  const named = (name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(template);
  if (rowKeys.some(named)) return false;
  if (descendantIds) for (const id of descendantIds) if (template.includes(id)) return false;
  return true;
};
