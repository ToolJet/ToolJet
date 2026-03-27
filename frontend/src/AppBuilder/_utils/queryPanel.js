import { getDynamicVariables, resolveReferences } from '@/_helpers/utils';
import { resolveDynamicValues } from '@/AppBuilder/_stores/utils';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { allOperations } from '@tooljet/plugins/client';

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
 * filtering to only the active mode/operation for multi-mode queries:
 * - TJDB: options.operation (sql_execution vs list_rows/create_row/etc.)
 * - PostgreSQL/MySQL/MSSQL/OracleDB: options.mode ('sql' vs 'gui')
 * - Operation-based plugins (CouchDB, MongoDB, etc.): options.operation via schema
 */
export function extractQueryReferences(kind, options) {
  const effectiveOptions = getEffectiveOptions(kind, options);
  return extractRefsFromValue(effectiveOptions);
}

// Plugins that support dual SQL/GUI mode via options.mode
const SQL_GUI_PLUGINS = new Set(['postgresql', 'mysql', 'mssql', 'oracledb']);

function getEffectiveOptions(kind, options) {
  if (kind === 'tooljetdb') {
    const operation = options?.operation;
    if (operation === 'sql_execution') {
      return { sql_execution: options?.sql_execution };
    }
    // GUI mode — scan only the active operation's data
    return operation ? { [operation]: options?.[operation] } : {};
  }

  // SQL/GUI plugins (PostgreSQL, MySQL, MSSQL, OracleDB):
  // options.mode = 'sql' -> scan only query + query_params
  // options.mode = 'gui' -> scan only table, operation, primary_key_column, records
  if (SQL_GUI_PLUGINS.has(kind)) {
    if (options?.mode === 'sql') {
      return { query: options?.query, query_params: options?.query_params };
    }
    if (options?.mode === 'gui') {
      return {
        table: options?.table,
        operation: options?.operation,
        primary_key_column: options?.primary_key_column,
        records: options?.records,
      };
    }
  }

  // Schema-driven filtering for plugins using dropdown-component-flip
  // (operation, resource, method, data_type, etc.)
  // Scans only the fields belonging to the active selection.
  const schemaFiltered = getSchemaFilteredOptions(kind, options);
  if (schemaFiltered) return schemaFiltered;

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

/**
 * For plugins using dropdown-component-flip, extract only the fields
 * belonging to the active selection using the schema.
 * Handles all flip key names: operation, resource, method, mode, data_type, etc.
 * Returns null if the plugin doesn't use this pattern.
 */
function getSchemaFilteredOptions(kind, options) {
  const schemaKey = kind.charAt(0).toUpperCase() + kind.slice(1);
  const schema = allOperations[schemaKey];
  if (!schema?.properties) return null;

  // Find the dropdown-component-flip field in the schema
  const flipEntry = Object.entries(schema.properties).find(([, value]) => value?.type === 'dropdown-component-flip');
  if (!flipEntry) return null;

  const [flipKey, flipField] = flipEntry;
  const activeValue = options?.[flipKey];
  if (!activeValue) return null;

  // Get fields defined for the active selection
  const activeFields = schema.properties[activeValue];
  if (!activeFields) return null;

  // Extract only the fields defined for the active selection + common fields
  const result = {};
  const fieldKeys = Object.keys(activeFields);
  if (flipField.commonFields) {
    fieldKeys.push(...Object.keys(flipField.commonFields));
  }
  fieldKeys.forEach((fieldKey) => {
    if (options[fieldKey] !== undefined) {
      result[fieldKey] = options[fieldKey];
    }
  });
  return result;
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
