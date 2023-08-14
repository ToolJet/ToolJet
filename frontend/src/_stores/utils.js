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
});

export const computeAppDiff = (appDiff, currentPageId, opts) => {
  let type;
  let updateDiff;
  let operation = 'update';

  if (opts?.deletePageRequest) {
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
  } else if (opts?.pageSortingChanged) {
    updateDiff = appDiff?.pages;

    type = updateType.pageDefinitionChanged;
  } else if (opts?.pageDefinitionChanged) {
    updateDiff = appDiff?.pages[currentPageId];

    type = updateType.pageDefinitionChanged;

    if (opts?.addNewPage) {
      operation = 'create';
    }
  } else if (opts?.componentDeleted) {
    const currentPageComponents = appDiff?.pages[currentPageId]?.components;

    updateDiff = _.keys(currentPageComponents);

    type = updateType.componentDeleted;

    operation = 'delete';
  } else if ((opts?.containerChanges || opts?.componentDefinitionChanged) && !opts?.componentAdded) {
    const currentPageComponents = appDiff?.pages[currentPageId]?.components;

    updateDiff = currentPageComponents;
    type = opts?.componentDefinitionChanged ? updateType.componentDefinitionChanged : updateType.containerChanges;
  } else if (opts?.componentAdded) {
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
