/* eslint-disable */
// The template resolution as it was before the expressions engine (origin/main), kept verbatim as the reference the
// engine's results are compared with.
import moment from 'moment';
import { materializeFileHandleRefs } from '@/AppBuilder/_utils/fileHandleRegistry';
var _ = require('lodash');

export const resolveDynamicValues = (
  code,
  state = {},
  customObjects = {},
  withError = false,
  reservedKeyword = [],
  isJsCode = true
) => {
  try {
    const allDynamicVariables = getDynamicVariables(code) || [];

    const queryHasJSCode = queryHasStringOtherThanVariable(code);
    let useJSResolvers = queryHasJSCode || getDynamicVariables(code)?.length > 1;

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
        let resolvedValue = code;
        let isJSCodeResolver = queryHasJSCode && (allDynamicVariables.length === 1 || allDynamicVariables.length === 0);

        if (!isJSCodeResolver) {
          allDynamicVariables.forEach((variable) => {
            const variableToResolve = removeNestedDoubleCurlyBraces(variable);
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
          const variableToResolve = removeNestedDoubleCurlyBraces(code);
          const resolvedCode = resolveCode(
            variableToResolve,
            state,
            customObjects,
            withError,
            reservedKeyword,
            isJsCode
          );
          resolvedValue = typeof resolvedCode === 'string' ? resolvedValue.replace(code, resolvedCode) : resolvedCode;
        }
        return resolvedValue;
      } catch (error) {
        console.error('Error resolving code', error);
      }
    } else {
      let value = removeNestedDoubleCurlyBraces(code);
      const resolvedCode = resolveCode(value, state, customObjects, withError, reservedKeyword, isJsCode);
      return resolvedCode;
    }
  } catch (error) {
    console.log(error);
  }
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
      const evalFunction = Function(
        [
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
          ...Object.keys(customObjects),
          reservedKeyword,
        ],
        `return ${code}`
      );
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
