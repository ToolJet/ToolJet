import { create as _create } from 'zustand';
import { devtools } from 'zustand/middleware';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { componentTypes } from '@/Editor/WidgetManager/components';
import _ from 'lodash';

export const zustandDevTools = (fn, options = {}) =>
  devtools(fn, { ...options, enabled: process.env.NODE_ENV === 'production' ? false : true });

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
  const { updateDiff, type, operation, error } = updateFor(appDiff, currentPageId, opts, currentLayout);

  return { updateDiff, type, operation, error };
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
  if (!opts?.isParamFromTableColumn) {
    return appDiff;
  }
  const columnsPath = generatePath(appDiff, 'columns');
  const actionsPath = generatePath(appDiff, 'actions');
  const deletionHistoryPath = generatePath(appDiff, 'columnDeletionHistory');

  let _diff = _.cloneDeep(appDiff);

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

    type = updateType.pageDefinitionChanged;

    if (opts.includes('addNewPage')) {
      operation = 'create';
    }
  }

  return { updateDiff, type, operation };
};

const computeComponentDiff = (appDiff, currentPageId, opts, currentLayout) => {
  let type;
  let updateDiff;
  let operation = 'update';

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

      const componentMeta = _.cloneDeep(
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
            const columns = _.toArray(metaDiff.definition[attribute]?.columns?.value) || [];

            metaDiff.definition = {
              ...metaDiff.definition,
              [attribute]: {
                ...metaDiff.definition[attribute],
                actions: {
                  value: actions,
                },
                columns: {
                  value: columns,
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
};

function toRemoveExposedvariablesFromComponentDiff(object) {
  const copy = _.cloneDeep(object);
  const componentIds = _.keys(copy);

  componentIds.forEach((componentId) => {
    const { component } = copy[componentId];

    if (component?.exposedVariables) {
      delete component.exposedVariables;
    }
  });

  return copy;
}

export function isPDFSupported() {
  const browser = getBrowserUserAgent();

  if (!browser) {
    return true;
  }

  const isChrome = browser.name === 'Chrome' && browser.major >= 92;
  const isEdge = browser.name === 'Edge' && browser.major >= 92;
  const isSafari = browser.name === 'Safari' && browser.major >= 15 && browser.minor >= 4; // Handle minor version check for Safari
  const isFirefox = browser.name === 'Firefox' && browser.major >= 90;

  console.log('browser--', browser, isChrome || isEdge || isSafari || isFirefox);

  return isChrome || isEdge || isSafari || isFirefox;
}

export function getBrowserUserAgent(userAgent) {
  var regexps = {
      Chrome: [/Chrome\/(\S+)/],
      Firefox: [/Firefox\/(\S+)/],
      MSIE: [/MSIE (\S+);/],
      Opera: [/Opera\/.*?Version\/(\S+)/ /* Opera 10 */, /Opera\/(\S+)/ /* Opera 9 and older */],
      Safari: [/Version\/(\S+).*?Safari\//],
    },
    re,
    m,
    browser,
    version;

  if (userAgent === undefined) userAgent = navigator.userAgent;

  for (browser in regexps)
    while ((re = regexps[browser].shift()))
      if ((m = userAgent.match(re))) {
        version = m[1].match(new RegExp('[^.]+(?:.[^.]+){0,1}'))[0];
        const { major, minor } = extractVersion(version);
        return {
          name: browser,
          major,
          minor,
        };
      }

  return null;
}

function extractVersion(versionStr) {
  // Split the string by "."
  const parts = versionStr.split('.');

  // Check for valid input
  if (parts.length === 0 || parts.some((part) => isNaN(part))) {
    return { major: null, minor: null };
  }

  // Extract major version
  const major = parseInt(parts[0], 10);

  // Handle minor version (default to 0)
  const minor = parts.length > 1 ? parseInt(parts[1], 10) : 0;

  return { major, minor };
}
