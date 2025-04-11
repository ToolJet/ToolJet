import { create as _create } from 'zustand';
import { devtools } from 'zustand/middleware';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { componentTypes } from '@/Editor/WidgetManager/components';
import _ from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { removeNestedDoubleCurlyBraces } from '@/_helpers/utils';
import { v4 as uuid } from 'uuid';

export const zustandDevTools = (fn, options = {}) =>
  devtools(fn, { ...options, enabled: process.env.NODE_ENV === 'production' ? false : false });

const resetters = [];

export const create = (fn) => {
  if (fn === undefined) return create;
  const store = _create(fn);
  const initialState = store.getState();
  resetters.push(() => {
    store.setState(initialState, true);
  });
  return store;
};

export const resetAllStores = () => {
  for (const resetter of resetters) {
    resetter();
  }
};

const defaultComponent = {
  name: '',
  properties: {},
  styles: {},
  validation: {},
  type: '',
  others: {
    showOnDesktop: { value: '{{true}}' },
    showOnMobile: { value: '{{false}}' },
  },
};

const updateType = Object.freeze({
  pageDefinitionChanged: 'pages',
  containerChanges: 'components/layout',
  componentAdded: 'components',
  componentDefinitionChanged: 'components',
  componentDeleted: 'components',
});

export const computeAppDiff = (appDiff, currentPageId, opts, currentLayout) => {
  try {
    const { updateDiff, type, operation, error } = updateFor(appDiff, currentPageId, opts, currentLayout);

    return { updateDiff, type, operation, error };
  } catch (error) {
    return { error, updateDiff: {}, type: null, operation: null };
  }
};

// for table column diffs, we need to compute the diff for each column separately and send the the entire column data
function generatePath(obj, targetKey, currentPath = '') {
  for (const key in obj) {
    const newPath = currentPath ? currentPath + '.' + key : key;

    if (key === targetKey) {
      return newPath;
    }

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = generatePath(obj[key], targetKey, newPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function getValueFromJson(json, path) {
  if (!path || typeof path !== 'string') return null;

  let value = json;
  path.split('.').forEach((key) => {
    value = value[key];
  });
  return value;
}

function updateValueInJson(json, path, value) {
  let obj = json;
  const keys = path?.split('.');

  if (!keys) {
    return null;
  }

  const lastKey = keys.pop();
  keys.forEach((key) => {
    obj = obj[key];
  });
  obj[lastKey] = value;
  return json;
}

export function isParamFromTableColumn(appDiff, definition) {
  const path =
    generatePath(appDiff, 'columns') || generatePath(appDiff, 'actions') || generatePath(appDiff, 'columnSizes');
  if (!path) {
    return false;
  }

  const value2 = getValueFromJson(definition, path);

  return value2 !== undefined;
}

export const computeComponentPropertyDiff = (appDiff, definition, opts) => {
  if (!opts?.isParamFromTableColumn && !opts?.isParamFromDropdownOptions) {
    return appDiff;
  }
  const columnsPath = generatePath(appDiff, 'columns');
  const actionsPath = generatePath(appDiff, 'actions');
  const deletionHistoryPath = generatePath(appDiff, 'columnDeletionHistory');
  const optionsPath = generatePath(appDiff, 'options');

  let _diff = deepClone(appDiff);

  if (columnsPath) {
    const columnsValue = getValueFromJson(definition, columnsPath);
    _diff = updateValueInJson(_diff, columnsPath, columnsValue);
  }

  if (actionsPath) {
    const actionsValue = getValueFromJson(definition, actionsPath);
    _diff = updateValueInJson(_diff, actionsPath, actionsValue);
  }

  if (deletionHistoryPath) {
    const deletionHistoryValue = getValueFromJson(definition, deletionHistoryPath);
    _diff = updateValueInJson(_diff, deletionHistoryPath, deletionHistoryValue);
  }

  if (optionsPath) {
    const optionsValue = getValueFromJson(definition, optionsPath);
    _diff = updateValueInJson(_diff, optionsPath, optionsValue);
  }
  return _diff;
};

const updateFor = (appDiff, currentPageId, opts, currentLayout) => {
  const updateTypeMappings = [
    {
      updateTypes: ['componentAdded', 'componentDefinitionChanged', 'componentDeleted', 'containerChanges'],
      processingFunction: computeComponentDiff,
    },
    {
      updateTypes: ['pageDefinitionChanged', 'pageSortingChanged', 'deletePageRequest', 'addNewPage'],
      processingFunction: computePageUpdate,
    },
    {
      updateTypes: ['homePageChanged'],
      processingFunction: () => ({
        updateDiff: appDiff,
        type: null,
        operation: 'update',
      }),
    },
    {
      updateTypes: ['globalSettings', 'generalAppDefinitionChanged'],
      processingFunction: () => ({
        updateDiff: appDiff,
        type: 'global_settings',
        operation: 'update',
      }),
    },
  ];

  const options = _.keys(opts);

  for (const { updateTypes, processingFunction } of updateTypeMappings) {
    const optionsTypes = _.intersection(options, updateTypes);

    if (optionsTypes.length > 0) {
      try {
        return processingFunction(appDiff, currentPageId, optionsTypes, currentLayout);
      } catch (error) {
        console.error('Error processing diff for update type: ', updateTypes, appDiff, error);
        return { error, updateDiff: {}, type: null, operation: null };
      }
    }
  }

  return null;
};

const computePageUpdate = (appDiff, currentPageId, opts) => {
  let type;
  let updateDiff;
  let operation = 'update';

  try {
    if (opts.includes('deletePageRequest')) {
      const deletePageId = _.keys(appDiff?.pages).map((pageId) => {
        if (appDiff?.pages[pageId]?.pageId === undefined) {
          return pageId;
        }
      })[0];

      updateDiff = {
        pageId: deletePageId,
      };

      type = updateType.pageDefinitionChanged;
      operation = 'delete';
    } else if (opts.includes('pageSortingChanged')) {
      updateDiff = appDiff?.pages;

      type = updateType.pageDefinitionChanged;
    } else if (opts.includes('pageDefinitionChanged')) {
      updateDiff = appDiff?.pages[currentPageId];

      //remove invalid diffs that are added to pageDiff
      delete updateDiff.components;

      type = updateType.pageDefinitionChanged;

      if (opts.includes('addNewPage')) {
        operation = 'create';
      }
    }

    return { updateDiff, type, operation };
  } catch (error) {
    return { error, updateDiff: {}, type: null, operation: null };
  }
};

const computeComponentDiff = (appDiff, currentPageId, opts, currentLayout) => {
  let type;
  let updateDiff;
  let operation = 'update';

  try {
    if (opts.includes('componentDeleted')) {
      const currentPageComponents = appDiff?.pages[currentPageId]?.components;

      updateDiff = _.keys(currentPageComponents);

      type = updateType.componentDeleted;

      operation = 'delete';
    } else if (opts.includes('componentAdded')) {
      const currentPageComponents = appDiff?.pages[currentPageId]?.components;

      updateDiff = _.toPairs(currentPageComponents ?? []).reduce((result, [id, component]) => {
        if (_.keys(component).length === 1 && component.withDefaultChildren !== undefined) {
          return result;
        }

        const componentMeta = deepClone(
          componentTypes.find((comp) => comp.component === component.component.component)
        );

        if (!componentMeta) {
          return result;
        }

        const metaDiff = diff(componentMeta, component.component);

        result[id] = _.defaultsDeep(metaDiff, defaultComponent);

        if (metaDiff.definition && !_.isEmpty(metaDiff.definition)) {
          const metaAttributes = _.keys(metaDiff.definition);

          metaAttributes.forEach((attribute) => {
            const doesActionsExist =
              metaDiff.definition[attribute]?.actions && !_.isEmpty(metaDiff.definition[attribute]?.actions?.value);
            const doesColumnsExist =
              metaDiff.definition[attribute]?.columns && !_.isEmpty(metaDiff.definition[attribute]?.columns?.value);

            if (doesActionsExist || doesColumnsExist) {
              const actions = _.toArray(metaDiff.definition[attribute]?.actions?.value) || [];
              // const columns = _.toArray(metaDiff.definition[attribute]?.columns?.value) || [];

              metaDiff.definition = {
                ...metaDiff.definition,
                [attribute]: {
                  ...metaDiff.definition[attribute],
                  actions: {
                    value: actions,
                  },
                  columns: {
                    value: component.component?.definition?.properties?.columns?.value,
                  },
                },
              };
            }
            result[id][attribute] = metaDiff.definition[attribute];
          });
        }

        const currentDisplayPreference = currentLayout;

        if (currentDisplayPreference === 'mobile') {
          result[id].others.showOnMobile = { value: '{{true}}' };
          result[id].others.showOnDesktop = { value: '{{false}}' };
        }

        if (result[id]?.definition) {
          delete result[id].definition;
        }

        result[id].type = componentMeta.component;
        result[id].parent = component.component.parent ?? null;
        result[id].layouts = appDiff.pages[currentPageId].components[id].layouts;

        operation = 'create';

        return result;
      }, {});

      type = updateType.componentDefinitionChanged;
    } else if (
      (opts.includes('containerChanges') || opts.includes('componentDefinitionChanged')) &&
      !opts.includes('componentAdded')
    ) {
      const currentPageComponents = appDiff?.pages[currentPageId]?.components;

      updateDiff = toRemoveExposedvariablesFromComponentDiff(currentPageComponents);

      type = opts.includes('containerChanges') ? updateType.containerChanges : updateType.componentDefinitionChanged;
    }

    return { updateDiff, type, operation };
  } catch (error) {
    return { error, updateDiff: {}, type: null, operation: null };
  }
};

function toRemoveExposedvariablesFromComponentDiff(object) {
  const copy = deepClone(object);
  const componentIds = _.keys(copy);

  componentIds.forEach((componentId) => {
    const { component } = copy[componentId];

    if (component?.exposedVariables) {
      delete component.exposedVariables;
    }
  });

  return copy;
}

export function createReferencesLookup(refState, forQueryParams = false, initalLoad = false) {
  if (forQueryParams && _.isEmpty(refState['parameters'])) {
    return { suggestionList: [] };
  }

  const getCurrentNodeType = (node) => Object.prototype.toString.call(node).slice(8, -1);

  const state = deepClone(refState);
  const queries = forQueryParams ? {} : state['queries'];
  const actions = initalLoad
    ? [
        'runQuery',
        'setVariable',
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
        'unsetPageVariable',
        'switchPage',
      ]
    : [];

  if (!forQueryParams) {
    // eslint-disable-next-line no-unused-vars
    _.forIn(queries, (query, key) => {
      if (!query.hasOwnProperty('run')) {
        query.run = true;
      }
    });
  }

  const currentState = !forQueryParams && initalLoad ? _.merge(state, { queries }) : state;
  const suggestionList = [];
  const map = new Map();

  const hintsMap = new Map();
  const resolvedRefs = new Map();
  const resolvedRefTypes = new Map();

  const buildMap = (data, path = '') => {
    const keys = Object.keys(data);
    keys.forEach((key, index) => {
      const uniqueId = uuid();
      const value = data[key];
      const _type = Object.prototype.toString.call(value).slice(8, -1);
      const prevType = map.get(path)?.type;

      let newPath = '';
      if (path === '') {
        newPath = key;
      } else if (prevType === 'Array') {
        newPath = `${path}[${index}]`;
      } else {
        newPath = `${path}.${key}`;
      }

      if (_type === 'Object') {
        map.set(newPath, { type: _type });
        buildMap(value, newPath);
      }
      if (_type === 'Array') {
        map.set(newPath, { type: _type });

        if (path.startsWith('queries') && key === 'data' && value.length > 30000) {
          // do nothing
        } else {
          buildMap(value, newPath);
        }
      } else {
        map.set(newPath, { type: _type });
      }

      // Populate hints and refs

      hintsMap.set(newPath, uniqueId);
      resolvedRefs.set(uniqueId, value);
      const resolveRefType = getCurrentNodeType(value);
      resolvedRefTypes.set(uniqueId, resolveRefType);
    });
  };

  buildMap(currentState, '');

  map.forEach((__, key) => {
    if (key.endsWith('run') && key.startsWith('queries')) {
      return suggestionList.push({ hint: `${key}()`, type: 'Function' });
    }
    return suggestionList.push({ hint: key, type: resolvedRefTypes.get(hintsMap.get(key)) });
  });
  if (!forQueryParams && initalLoad) {
    actions.forEach((action) => {
      suggestionList.push({ hint: `actions.${action}()`, type: 'method' });
    });
  }

  return { suggestionList, hintsMap, resolvedRefs };
}

function containsBracketNotation(queryString) {
  const bracketNotationRegex = /\[\s*['"][^'"]+['"]\s*\]/;
  return bracketNotationRegex.test(queryString);
}

export function findAllEntityReferences(node, allRefs) {
  const extractReferencesFromString = (str) => {
    const regex = /{{(components|queries)\.[^{}]*}}/g;
    const matches = str.match(regex);
    if (matches) {
      matches.forEach((match) => {
        const ref = match.replace('{{', '').replace('}}', '');
        const entityName = ref.split('.')[1];
        allRefs.push(entityName);
      });
    }
  };

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

export function findEntityId(entityName, map, reverseMap) {
  for (const [key, value] of map.entries()) {
    const lookupid = value;
    const reverseValue = reverseMap.get(lookupid);

    if (reverseValue === entityName) {
      return key;
    }
  }
}
