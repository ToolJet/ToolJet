import { create as _create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { extractAndReplaceReferencesFromString as extractAndReplaceReferencesFromStringAst } from '@/AppBuilder/_stores/ast';
import { ACTIONS } from '@/AppBuilder/_stores/constants/actions';

var _ = require('lodash');

const resetters = [];

export function debounce(func) {
  const timers = new Map();

  return (...args) => {
    const event = args[0] || {};
    const moduleId = args[3] || 'canvas';
    const eventId = moduleId + '-' + (event?.id || uuidv4());

    const debounceTime = event?.event?.debounce || event?.debounce;
    if (debounceTime === undefined) {
      return func.apply(this, args);
    }

    clearTimeout(timers.get(eventId));

    const timer = setTimeout(() => {
      func.apply(this, args);
      timers.delete(eventId);
    }, Number(debounceTime));

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

// Slice factories hold state in closures (e.g. batch managers) that setState-based
// resetters can't reach. Slices register an explicit resetter here so resetAllStores
// clears that closure state too.
// phase 'post' runs AFTER the state replace — needed when the resetter must repair
// values inside the restored initial state (e.g. class instances that were mutated
// in place, which the captured initialState shares by reference).
const postResetters = [];
export const registerResetter = (fn, { phase = 'pre' } = {}) => {
  (phase === 'post' ? postResetters : resetters).push(fn);
};

export const resetAllStores = () => {
  for (const resetter of resetters) {
    resetter();
  }
  for (const resetter of postResetters) {
    resetter();
  }
};

export {
  resolveDynamicValues,
  resolveCode,
  getDynamicVariables,
  removeNestedDoubleCurlyBraces,
  extractAndReplaceReferencesFromString,
} from '@/AppBuilder/_engines/data/expressions';

export const checkSubstringRegex = (mainString, subString) => {
  // Optional chaining reads the same entity, so listItem?.a must match like listItem.a
  const normalizedMainString = mainString.replace(/\?\./g, '.');

  // Escape special characters in the subString
  const escapedSubString = subString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Matches `subString` used as a standalone reference.
  // - The trailing set is deliberately narrow —
  // - a property access (`.`), an index (`[`), optional chaining (`?.`), whitespace, or end of string.
  //
  // Whitespace is what a bare identifier is followed by in practice.
  // Optional chaining is matched as the two-character `?.`.
  // The cost is the unspaced ternary `listItem?a:b`; the spaced form is covered by whitespace.
  const regex = new RegExp(`(^|[^a-zA-Z0-9\\].])(${escapedSubString})($|[.\\[\\s]|\\?\\.)`);

  // Test the mainString against the regex
  return regex.test(normalizedMainString);
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
          // Skip this value only — `break` would abort scanning the object's remaining keys
          continue;
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
 * Delegates to the AST-based walker so that only genuine `components.X` / `queries.X`
 * member expressions inside {{ }} are converted — an entity name appearing as plain
 * text or inside a string literal must never be rewritten.
 *
 * @param {Object} code - The code object containing entity names.
 * @param {Object} componentNameIdMapping - A map of component names to their IDs.
 * @param {Object} queryNameIdMapping - A map of query names to their IDs.
 * @returns {Object} The code object with entity references replaced by IDs.
 */
export const replaceEntityReferencesWithIds = (code, componentNameIdMapping = {}, queryNameIdMapping = {}) =>
  replaceQueryOptionsEntityReferencesWithIds(code, componentNameIdMapping, queryNameIdMapping);

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

export function createReferencesLookup(
  currentState,
  forQueryParams = false,
  initalLoad = false,
  forWorkflowsSuggestions = false
) {
  if (forQueryParams && _.isEmpty(currentState['parameters'])) {
    return { suggestionList: [] };
  }
  const actions = ACTIONS;

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
          map.set(`${path}.${key}.reset()`, { type: 'Function' });
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
  if (!forQueryParams && !forWorkflowsSuggestions) {
    actions.forEach((action) => {
      suggestionList.push({ hint: `actions.${action}()`, type: 'method' });
    });
  }
  return suggestionList;
}

export function convertKeysToCamelCase(object) {
  if (_.isEmpty(object)) return null;

  return Object.keys(object).reduce((acc, key) => {
    acc[_.camelCase(key)] = object[key];

    return acc;
  }, {});
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

export const isProperNumber = (str) => {
  try {
    const num = Number(str);
    return !isNaN(num) && isFinite(num);
  } catch (e) {
    return false;
  }
};

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
        primary: {
          light: '#4368E3',
          dark: '#4A6DD9',
        },
        secondary: {
          light: '#6A727C',
          dark: '#CFD3D8',
        },
        tertiary: {
          light: '#1E823B',
          dark: '#318344',
        },
      },
    },
    text: {
      font: 'IBM Plex Sans',
      colors: {
        primary: {
          light: '#1B1F24',
          dark: '#CFD3D8',
        },
        placeholder: {
          light: '#6A727C',
          dark: '#858C94',
        },
      },
    },
    border: {
      radius: {
        default: 6,
        small: 0,
        large: 0,
      },
      colors: {
        default: {
          light: '#CCD1D5',
          dark: '#3C434B',
        },
        weak: {
          light: '#E4E7EB',
          dark: '#2B3036',
        },
      },
    },
    systemStatus: {
      colors: {
        success: {
          light: '#1E823B',
          dark: '#318344',
        },
        error: {
          light: '#D72D39',
          dark: '#D03F43',
        },
        warning: {
          light: '#BF4F03',
          dark: '#BA5722',
        },
      },
    },
    surface: {
      colors: {
        appBackground: {
          light: '#F6F6F6',
          dark: '#121518',
        },
        surface1: {
          light: '#FFFFFF',
          dark: '#1E2226',
        },
        surface2: {
          light: '#F6F8FA',
          dark: '#2B3036',
        },
        surface3: {
          light: '#E4E7EB',
          dark: '#3C434B',
        },
      },
    },
  },
};

export const blobToDataURL = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result);
  });
};

export const blobToBinary = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsBinaryString(blob);
    reader.onloadend = () => resolve(reader.result);
  });
};

export const formatSecondsToHHMMSS = (totalSeconds) => {
  const seconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

// Validate a go-to-app link target by looking up its correlationId in the linkedApps map populated on app load.
export function isLinkedAppValid(correlationId, linkedAppsMap) {
  if (!correlationId) return { isValid: true, errorMessage: null };

  const entry = linkedAppsMap?.[correlationId];
  if (!entry || !entry.slug) {
    return {
      isValid: false,
      errorMessage: `App ${correlationId} undefined. Check if the linked app exists and has a released version.`,
    };
  }
  if (!entry.currentVersionId) {
    return {
      isValid: false,
      errorMessage: 'Check if the linked app has a released version.',
    };
  }
  return { isValid: true, errorMessage: null };
}
