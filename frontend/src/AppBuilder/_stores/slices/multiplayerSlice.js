import { componentTypes } from '../../WidgetManager';
import { find } from 'lodash';

const initialState = {
  ymap: undefined,
};

export const createMultiplayerSlice = (set, get) => ({
  multiplayer: {
    ...initialState,

    setYMap: (ymap) =>
      set((state) => {
        state.multiplayer.ymap = ymap;
      }),

    broadcastUpdates: (diff, type, operation) => {
      const ymap = get().multiplayer.ymap;
      if (ymap) {
        ymap?.set('updates', {
          diff,
          type,
          operation,
          pageId: get().getCurrentPageId('canvas'),
          versionId: get().selectedVersion?.id,
        });
      }
    },

    processUpdate: ({ diff, type, operation, pageId, versionId }) => {
      const currentPageId = get().getCurrentPageId('canvas');
      const currentVersionId = get().selectedVersion?.id;

      if (currentPageId === pageId && currentVersionId === versionId)
        switch (type) {
          case 'components/layout': {
            const { setComponentLayout } = get();
            let parentId;
            let updateParent = false;
            const componentLayouts = Object.fromEntries(
              // TODO: Do this for mobile view
              Object.entries(diff).map(([componentId, layoutsObject]) => {
                if (layoutsObject?.component && 'parent' in layoutsObject.component) {
                  updateParent = true;
                  parentId = layoutsObject.component?.parent;
                }
                parentId = layoutsObject.component?.parent;
                return [componentId, layoutsObject.layouts['desktop']];
              })
            );

            setComponentLayout(componentLayouts, parentId, 'canvas', {
              saveAfterAction: false,
              updateParent,
              skipUndoRedo: true,
            });
            break;
          }

          case 'events': {
            switch (operation) {
              case 'create': {
                get().eventsSlice.addEvent(diff, 'canvas', false);
                break;
              }
              case 'update': {
                const { events, updateType, param } = diff;
                get().eventsSlice.updateAppVersionEventHandlers(events, updateType, param, 'canvas', false);
                break;
              }
              case 'delete': {
                get().eventsSlice.removeEvent(diff, 'canvas', false);
                break;
              }
            }
            break;
          }

          case 'queries': {
            switch (operation) {
              case 'create': {
                const moduleId = 'canvas';
                const dataQueries = get().dataQuery.queries.modules[moduleId];
                set((state) => {
                  state.dataQuery.queries.modules[moduleId] = [...dataQueries, diff];
                });
                get().addNewQueryMapping(diff.id, diff.name, moduleId);
                //! we need default value in store so that query can be resolved if referenced from other entity
                get().setResolvedQuery(
                  diff.id,
                  {
                    isLoading: false,
                    data: [],
                    rawData: [],
                    id: diff.id,
                  },
                  moduleId
                );
                break;
              }
              case 'update': {
                const moduleId = 'canvas';
                set((state) => {
                  state.dataQuery.isUpdatingQueryInProcess = false;
                  state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) => {
                    if (query.id === diff.id) {
                      return {
                        ...diff,
                      };
                    }
                    return query;
                  });
                });
                break;
              }
              case 'delete': {
                const moduleId = 'canvas';
                const dataQueries = get().dataQuery.queries.modules[moduleId];
                // const deletedQueryName = dataQueries.find((query) => query.id === queryId).name;
                const newSelectedQuery = dataQueries.find((query) => query.id !== diff);
                const setSelectedQuery = get().queryPanel.setSelectedQuery;
                const setSelectedDataSource = get().queryPanel.setSelectedDataSource;
                const selectedQuery = get().queryPanel.selectedQuery;
                setSelectedQuery(newSelectedQuery?.id || null);
                get().deleteQueryMapping(selectedQuery?.name, selectedQuery?.id, moduleId);

                if (!newSelectedQuery?.id) {
                  setSelectedDataSource(null);
                }
                set((state) => {
                  state.dataQuery.isDeletingQueryInProcess = false;
                  state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].filter(
                    (query) => query.id !== diff
                  );
                  delete state.resolvedStore.modules[moduleId].exposedValues.queries[diff];
                });

                get().removeNode(`queries.${diff}`, moduleId);
                get().updateDependencyValues(`queries.${diff}`, moduleId);
                break;
              }
            }
            break;
          }

          case 'components': {
            switch (operation) {
              case 'create': {
                // const componentDefinitions = Object.entries(diff).map(([componentId, componentDetails]) => {
                //   const componentType = find(componentTypes, { component: componentDetails.type });

                //   return {
                //     id: componentId,
                //     layouts: componentDetails.layouts,
                //     withDefaultChildren: (componentType.defaultChildren?.length ?? 0) > 0,
                //     component: {
                //       parent: componentDetails.parent,
                //       ...componentType,
                //     },
                //   };
                // });

                get().addComponentToCurrentPage(diff, 'canvas', {
                  saveAfterAction: false,
                  skipUndoRedo: true,
                });
                break;
              }

              case 'update': {
                const { componentId, property, value, paramType, attr } = diff;
                get().setComponentProperty(componentId, property, value, paramType, attr, 'canvas', {
                  saveAfterAction: false,
                  skipUndoRedo: true,
                });
                break;
              }

              case 'parent': {
                const { componentId, newParentId } = diff;
                get().setParentComponent(componentId, newParentId, 'canvas', {
                  saveAfterAction: false,
                  skipUndoRedo: true,
                });
                break;
              }

              case 'delete': {
                const { selectedComponents } = diff;
                get().deleteComponents(selectedComponents, 'canvas', {
                  saveAfterAction: false,
                  skipUndoRedo: true,
                });
                break;
              }

              case 'batch': {
                const { operations } = diff;
                get().performBatchComponentOperations(operations, 'canvas', {
                  saveAfterAction: false,
                  skipUndoRedo: true,
                });
                break;
              }
            }

            break;
          }
        }
    },
  },
});
