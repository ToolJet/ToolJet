import { getDynamicVariables, resolveReferences } from '@/_helpers/utils';
import { resolveDynamicValues } from '@/AppBuilder/_stores/utils';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';

import _ from 'lodash';

export function getQueryVariables(options, state, mappings) {
  let queryVariables = {};
  const optionsType = typeof options;
  switch (optionsType) {
    case 'string': {
      options = options.replace(/\n/g, ' ');
      if (options.match(/\{\{(.*?)\}\}/g)?.length >= 1 && options.includes('{{constants.')) {
        const constantVariables = options.match(/\{\{(constants.*?)\}\}/g);

        constantVariables.forEach((constant) => {
          options = options.replace(constant, 'HiddenOrganizationConstant');
        });
      }

      if (options.includes('{{') && options.includes('%%')) {
        if (options.includes('{{constants.') && !options.includes('%%')) {
          const vars = 'HiddenOrganizationConstant';
          queryVariables[options] = vars;
        } else {
          const { valueWithBrackets } = extractAndReplaceReferencesFromString(
            options,
            mappings.components,
            mappings.queries
          );
          queryVariables[options] = resolveReferences(valueWithBrackets, state);
        }
      } else {
        const dynamicVariables = getDynamicVariables(options) || [];
        dynamicVariables.forEach((variable) => {
          const { valueWithBrackets } = extractAndReplaceReferencesFromString(
            variable,
            mappings.components,
            mappings.queries
          );
          queryVariables[variable] = resolveDynamicValues(valueWithBrackets, state);
        });
      }

      break;
    }

    case 'object': {
      if (Array.isArray(options)) {
        options.forEach((element) => {
          _.merge(queryVariables, getQueryVariables(element, state, mappings));
        });
      } else {
        Object.keys(options || {}).forEach((key) => {
          _.merge(queryVariables, getQueryVariables(options[key], state, mappings));
        });
      }
      break;
    }

    default:
      break;
  }

  return queryVariables;
}

/**
 * Extracts all {{...}} reference expressions from a query's options,
 * filtering to only the active mode for dual-mode queries (e.g., TJDB GUI/SQL).
 */
export function extractQueryReferences(kind, options) {
  const effectiveOptions = getEffectiveOptions(kind, options);
  return extractRefsFromValue(effectiveOptions);
}

function getEffectiveOptions(kind, options) {
  if (kind === 'tooljetdb') {
    const operation = options?.operation;
    if (operation === 'sql_execution') {
      return { sql_execution: options?.sql_execution };
    }
    // GUI mode — scan only the active operation's data
    return operation ? { [operation]: options?.[operation] } : {};
  }

  // For all other query types: shallow copy and strip non-expression metadata
  const filtered = { ...options };
  if (!options?.enableTransformation) {
    delete filtered.transformations;
  }
  delete filtered.runOnPageLoad;
  delete filtered.runOnDependencyChange;
  delete filtered.requestConfirmation;
  delete filtered.showSuccessNotification;
  delete filtered.notificationDuration;
  delete filtered.successMessage;
  return filtered;
}

function extractRefsFromValue(obj) {
  const refs = new Set();
  const walk = (value) => {
    if (typeof value === 'string') {
      const matches = value.match(/\{\{(.*?)\}\}/g);
      if (matches) matches.forEach((m) => refs.add(m));
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };
  walk(obj);
  return [...refs];
}

export const convertMapSet = (obj) => {
  if (obj instanceof Map) {
    return Object.fromEntries(Array.from(obj, ([key, value]) => [key, convertMapSet(value)]));
  } else if (obj instanceof Set) {
    return Array.from(obj).map(convertMapSet);
  } else if (Array.isArray(obj)) {
    return obj.map(convertMapSet);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, convertMapSet(value)]));
  } else {
    return obj;
  }
};
