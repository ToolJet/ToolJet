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
  events: [],
  type: '',
};

const updateType = Object.freeze({
  pageDefinitionChanged: 'pages',
  containerChanges: 'components/layout',
  componentAdded: 'components',
  componentDefinitionChanged: 'components',
  componentDeleted: 'components',
  componentsEventsChanged: 'events',
  pageEventsChanged: 'events',
});

const eventHandlerType = Object.freeze({
  componentsEventsChanged: 'components',
  pageEventsChanged: 'pages',
});

export const computeAppDiff = (appDiff, currentPageId, opts) => {
  const { updateDiff, type, operation } = updateFor(appDiff, currentPageId, opts);

  console.log('----arpit [updateFor]', { updateDiff, type, operation });
  return { updateDiff, type, operation };
};

function verifyIsEventUpdates(data, eventsObj) {
  if (!data.pages || Object.keys(data.pages).length === 0) {
    return false;
  }

  for (const pageId in data.pages) {
    const components = data.pages[pageId].components;
    for (const componentId in components) {
      if (components[componentId].component.definition.events) {
        eventsObj.components = Object.values(components[componentId].component.definition.events).map((e) => ({
          event: e,
          eventType: 'component',
          attachedTo: componentId,
        }));

        return true;
      }
    }
  }

  return false;
}

function computeEventDiff(appDiff, currentPageId, opts = []) {
  let type = 'events';
  let updateDiff;
  let operation = 'update';

  const events = {
    components: [],
    pages: [],
  };
  verifyIsEventUpdates(appDiff, events);

  updateDiff = events[eventHandlerType[opts[0]]];
  console.log('----arpit [computeEventDiff]', { events, opts });

  if (opts.includes('newEvent')) {
    operation = 'create';
    updateDiff = updateDiff[0];
  }

  return { updateDiff, type, operation };
}

const updateFor = (appDiff, currentPageId, opts) => {
  const updateTypeMappings = [
    {
      updateTypes: ['componentsEventsChanged', 'pageEventsChanged', 'eventsReOrdered', 'newEvent'],
      processingFunction: computeEventDiff,
    },
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
      updateTypes: ['globalSettings'],
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
      return processingFunction(appDiff, currentPageId, optionsTypes);
    }
  }

  // Handle case when no matching update type is found

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

const computeComponentDiff = (appDiff, currentPageId, opts) => {
  let type;
  let updateDiff;
  let operation = 'update';

  if (opts.includes('componentDeleted')) {
    const currentPageComponents = appDiff?.pages[currentPageId]?.components;

    updateDiff = _.keys(currentPageComponents);

    type = updateType.componentDeleted;

    operation = 'delete';
  } else if (
    (opts.includes('containerChanges') || opts.includes('componentDefinitionChanged')) &&
    !opts.includes('componentAdded')
  ) {
    const currentPageComponents = appDiff?.pages[currentPageId]?.components;

    updateDiff = currentPageComponents;
    type = opts.includes('containerChanges') ? updateType.containerChanges : updateType.componentDefinitionChanged;
  } else if (opts.includes('componentAdded')) {
    const currentPageComponents = appDiff?.pages[currentPageId]?.components;

    updateDiff = _.toPairs(currentPageComponents ?? []).reduce((result, [id, component]) => {
      const componentMeta = componentTypes.find((comp) => comp.component === component.component.component);

      const metaDiff = diff(componentMeta, component.component);

      result[id] = _.defaultsDeep(metaDiff, defaultComponent);

      result[id].type = componentMeta.component;
      result[id].layouts = appDiff.pages[currentPageId].components[id].layouts;
      operation = 'create';

      return result;
    }, {});

    type = updateType.componentDefinitionChanged;
  }

  return { updateDiff, type, operation };
};
