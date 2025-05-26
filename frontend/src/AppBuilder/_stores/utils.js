import { create as _create } from 'zustand';
import { devtools } from 'zustand/middleware';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { dfs } from '@/_stores/handleReferenceTransactions';
import { extractAndReplaceReferencesFromString as extractAndReplaceReferencesFromStringAst } from '@/AppBuilder/_stores/ast';

import _ from 'lodash';

const resetters = [];

export function debounce(func) {
  const timers = new Map();

  return (...args) => {
    const event = args[0] || {};
    const eventId = uuidv4();

    if (event.debounce === undefined) {
      return func.apply(this, args);
    }

    clearTimeout(timers.get(eventId));

    const timer = setTimeout(() => {
      func.apply(this, args);
      timers.delete(eventId);
    }, Number(event.debounce));

    timers.set(eventId, timer);
  };
}

export const zustandDevTools = (fn, options = {}) =>
  devtools(fn, { ...options, enabled: process.env.NODE_ENV === 'production' ? false : true });

export const create = (fn) => {
  if (fn === undefined) return create;
  const store = _create(fn);
  const initialState = store.getState();

  resetters.push(() => {
    store.setState(initialState, true, 'resetAllStores');
  });
  return store;
};

export const resetAllStores = () => {
  for (const resetter of resetters) {
    resetter();
  }
};

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

  if (withError) return [result, error];
  return result;
};

// Returns an array of dynamic variables in the text like {{variable}} or %%variable%%
// Eg, input: "Hello, {{name}}! Welcome to {{city}}."
//     output: ["{{name}}", "{{city}}"]
export const getDynamicVariables = (text) => {
  /* eslint-disable no-useless-escape */
  const matchedParams = text.match(/\{\{(.*?)\}\}/g) || text.match(/\%\%(.*?)\%\%/g);
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

export const checkSubstringRegex = (mainString, subString) => {
  // Escape special characters in the subString
  const escapedSubString = subString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create a regular expression
  const regex = new RegExp(`(^|[^a-zA-Z0-9\\].])(${escapedSubString})($|[.\\[])`);

  // Test the mainString against the regex
  return regex.test(mainString);
};

export const normalizePattern = (pattern) => {
  // Remove any optional chaining operators and replace them with a placeholder
  let normalized = pattern.replace(/\?\./g, '.');

  // Convert bracket notation to dot notation
  normalized = normalized.replace(/\[(['"]?)(.*?)\1\]/g, '.$2');

  // Handle cases where the pattern starts with a dot
  if (normalized.startsWith('.')) {
    normalized = normalized.slice(1);
  }

  return normalized;
};

export function findAllEntityReferences(node, allRefs) {
  const extractReferencesFromString = (str) => {
    const regex = /{{.*?(components|queries)\.[^{}]*}}/g;
    const matches = str.match(regex);
    if (matches) {
      matches.forEach((match) => {
        const ref = match.replace('{{', '').replace('}}', '');
        const extractionRegex = /(components|queries)\.[^{}]*/g;
        const extractedRef = ref.match(extractionRegex)?.[0] || ref;
        const entityName = extractedRef.split('.')[1];
        allRefs.push(entityName);
      });
    }
  };

  function containsBracketNotation(queryString) {
    const bracketNotationRegex = /\[\s*['"][^'"]+['"]\s*\]/;
    return bracketNotationRegex.test(queryString);
  }

  if (typeof node === 'object') {
    for (let key in node) {
      const value = node[key];

      if (typeof value === 'string') {
        if (containsBracketNotation(value)) {
          // Skip if the value is a bracket notation
          break;
        }

        if (
          value.includes('{{') &&
          value.includes('}}') &&
          (value.startsWith('{{components') || value.startsWith('{{queries'))
        ) {
          extractReferencesFromString(value);
        } else {
          // Handle cases where references are embedded within strings
          extractReferencesFromString(value);
        }
      } else if (typeof value === 'object') {
        findAllEntityReferences(value, allRefs);
      }
    }
  }
  return allRefs;
}

/**
 * Replaces entity names with their corresponding IDs in the given code.
 *
 * @param {Object} code - The code object containing entity names.
 * @param {Object} componentNameIdMapping - A map of component IDs to their names.
 * @param {Object} queryNameIdMapping - A map of query IDs to their names.
 * @returns {Object} The code object with entity references replaced by IDs.
 */
export const replaceEntityReferencesWithIds = (code, componentNameIdMapping = {}, queryNameIdMapping = {}) => {
  const entityNameReferences = findAllEntityReferences(code, []);

  let diffObj = deepClone(code);
  entityNameReferences.forEach((entityName) => {
    //! TODO revisit this
    const entityId = componentNameIdMapping[entityName]
      ? componentNameIdMapping[entityName]
      : queryNameIdMapping[entityName]
      ? queryNameIdMapping[entityName]
      : entityName;
    diffObj = dfs(diffObj, entityName, entityId);
  });
  return diffObj;
};

export function replaceQueryOptionsEntityReferencesWithIds(
  options,
  componentNameIdMapping = {},
  queryNameIdMapping = {}
) {
  if (typeof options === 'string') {
    if (options.includes('{{') && options.includes('}}')) {
      return extractAndReplaceReferencesFromStringAst(options, componentNameIdMapping, queryNameIdMapping).valueWithId;
    }
    return options;
  }

  if (Array.isArray(options)) {
    return options.map((item) =>
      replaceQueryOptionsEntityReferencesWithIds(item, componentNameIdMapping, queryNameIdMapping)
    );
  }

  if (typeof options === 'object' && options !== null) {
    const result = {};
    for (const [key, value] of Object.entries(options)) {
      result[key] = replaceQueryOptionsEntityReferencesWithIds(value, componentNameIdMapping, queryNameIdMapping);
    }

    return result;
  }

  return options;
}

export function createReferencesLookup(currentState, forQueryParams = false, initalLoad = false) {
  if (forQueryParams && _.isEmpty(currentState['parameters'])) {
    return { suggestionList: [] };
  }
  const actions = [
    'runQuery',
    'setVariable',
    'unsetAllVariables',
    'unSetVariable',
    'showAlert',
    'logout',
    'showModal',
    'closeModal',
    'setLocalStorage',
    'copyToClipboard',
    'goToApp',
    'generateFile',
    'setPageVariable',
    'unsetAllPageVariables',
    'unsetPageVariable',
    'switchPage',
    'logInfo',
    'log',
    'logError',
    'toggleAppMode',
  ];

  const suggestionList = [];
  const map = new Map();

  const buildMap = (data, path = '') => {
    const keys = Object.keys(data);
    keys.forEach((key, index) => {
      const value = data[key];
      const _type = Object.prototype.toString.call(value).slice(8, -1);
      const prevType = map.get(path)?.type;

      let newPath = '';
      if (path === '') {
        newPath = key;
      } else if (prevType === 'Array') {
        newPath = `${path}[${index}]`;
      } else {
        if (path === 'queries') {
          map.set(`${path}.${key}.run()`, { type: 'Function' });
        }
        newPath = `${path}.${key}`;
      }

      if (_type === 'Object') {
        map.set(newPath, { type: _type });
        buildMap(value, newPath);
      }
      if (_type === 'Array') {
        map.set(newPath, { type: _type });
        if (value.length >= 10) {
          buildMap(value[0], newPath);
        } else {
          buildMap(value, newPath);
        }
      } else {
        map.set(newPath, { type: _type });
      }
    });
  };

  buildMap(currentState, '');

  map.forEach((__, key) => {
    return suggestionList.push({ hint: key, type: __.type });
  });
  if (!forQueryParams) {
    actions.forEach((action) => {
      suggestionList.push({ hint: `actions.${action}()`, type: 'method' });
    });
  }
  return suggestionList;
}

export function convertAllKeysToSnakeCase(o) {
  if (Array.isArray(o)) {
    return o.map(function (value) {
      if (typeof value === 'object' && value !== null) {
        value = convertAllKeysToSnakeCase(value);
      }
      return value;
    });
  } else if (typeof o === 'object' && o !== null) {
    const newO = {};
    for (const origKey in o) {
      if (Object.prototype.hasOwnProperty.call(o, origKey)) {
        if (!['pages', 'events'].includes(origKey)) {
          const newKey = origKey
            .split(/(?=[A-Z])/)
            .join('_')
            .toLowerCase();
          let value = o[origKey];
          if (typeof value === 'object' && value !== null) {
            value = convertAllKeysToSnakeCase(value);
          }
          newO[newKey] = value;
        } else {
          newO[origKey] = o[origKey];
        }
      }
    }
    return newO;
  }
  return o;
}

// export function createReferencesLookup(refState, forQueryParams = false, initalLoad = false) {
//   if (forQueryParams && _.isEmpty(refState['parameters'])) {
//     return { suggestionList: [] };
//   }

//   const getCurrentNodeType = (node) => Object.prototype.toString.call(node).slice(8, -1);

//   const state = deepClone(refState);
//   const queries = forQueryParams ? {} : state['queries'];
//   const actions = initalLoad
//     ? [
//         'runQuery',
//         'setVariable',
//         'unSetVariable',
//         'showAlert',
//         'logout',
//         'showModal',
//         'closeModal',
//         'setLocalStorage',
//         'copyToClipboard',
//         'goToApp',
//         'generateFile',
//         'setPageVariable',
//         'unsetPageVariable',
//         'switchPage',
//       ]
//     : [];

//   if (!forQueryParams) {
//     // eslint-disable-next-line no-unused-vars
//     _.forIn(queries, (query, key) => {
//       if (!query.hasOwnProperty('run')) {
//         query.run = true;
//       }
//     });
//   }

//   const currentState = !forQueryParams && initalLoad ? _.merge(state, { queries }) : state;
//   const suggestionList = [];
//   const map = new Map();

//   const hintsMap = new Map();
//   const resolvedRefs = new Map();
//   const resolvedRefTypes = new Map();

//   const buildMap = (data, path = '') => {
//     const keys = Object.keys(data);
//     keys.forEach((key, index) => {
//       const uniqueId = uuidv4();
//       const value = data[key];
//       const _type = Object.prototype.toString.call(value).slice(8, -1);
//       const prevType = map.get(path)?.type;

//       let newPath = '';
//       if (path === '') {
//         newPath = key;
//       } else if (prevType === 'Array') {
//         newPath = `${path}[${index}]`;
//       } else {
//         newPath = `${path}.${key}`;
//       }

//       if (_type === 'Object') {
//         map.set(newPath, { type: _type });
//         buildMap(value, newPath);
//       }
//       if (_type === 'Array') {
//         map.set(newPath, { type: _type });

//         if (path.startsWith('queries') && key === 'data' && value.length > 10) {
//           // do nothing
//         } else {
//           buildMap(value, newPath);
//         }
//       } else {
//         map.set(newPath, { type: _type });
//       }

//       // Populate hints and refs

//       hintsMap.set(newPath, uniqueId);
//       resolvedRefs.set(uniqueId, value);
//       const resolveRefType = getCurrentNodeType(value);
//       resolvedRefTypes.set(uniqueId, resolveRefType);
//     });
//   };

//   buildMap(currentState, '');

//   map.forEach((__, key) => {
//     if (key.endsWith('run') && key.startsWith('queries')) {
//       return suggestionList.push({ hint: `${key}()`, type: 'Function' });
//     }
//     return suggestionList.push({ hint: key, type: resolvedRefTypes.get(hintsMap.get(key)) });
//   });
//   if (!forQueryParams && initalLoad) {
//     actions.forEach((action) => {
//       suggestionList.push({ hint: `actions.${action}()`, type: 'method' });
//     });
//   }

//   return { suggestionList, hintsMap, resolvedRefs };
// }

export const hasArrayNotation = (property) => {
  // Regular expression to match array notation pattern
  const arrayPattern = /\[\d+\]/;
  return arrayPattern.test(property);
};

export const parsePropertyPath = (property) => {
  // Split the property path into segments
  const segments = property.split('.');
  const result = [];

  for (const segment of segments) {
    // Check if segment contains array notation
    if (hasArrayNotation(segment)) {
      // Extract the property name and array index
      const [name, ...rest] = segment.split('[');
      if (name) result.push(name);

      // Extract and clean up array indices
      for (const item of rest) {
        const index = parseInt(item.replace(']', ''));
        result.push(index);
      }
    } else {
      result.push(segment);
    }
  }

  return result;
};

export const baseTheme = {
  definition: {
    brand: {
      colors: {
        primary: { light: '#4368E3', dark: '#4A6DD9' },
        secondary: { light: '#6A727C', dark: '#CFD3D8' },
        tertiary: { light: '#1E823B', dark: '#318344' },
      },
    },
  },
};
