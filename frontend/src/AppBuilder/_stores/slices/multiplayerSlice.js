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
            const layoutsByType = {};
            Object.entries(diff).forEach(([componentId, layoutsObject]) => {
              if (layoutsObject?.component && 'parent' in layoutsObject.component) {
                updateParent = true;
                parentId = layoutsObject.component?.parent;
              }
              parentId = layoutsObject.component?.parent;
              Object.entries(layoutsObject.layouts ?? {}).forEach(([layoutType, layout]) => {
                (layoutsByType[layoutType] ??= {})[componentId] = layout;
              });
            });

            // Each diff goes to the layout it was made in, whichever view this editor has on screen.
            Object.entries(layoutsByType).forEach(([layoutType, componentLayouts]) => {
              setComponentLayout(componentLayouts, parentId, 'canvas', {
                saveAfterAction: false,
                updateParent,
                skipUndoRedo: true,
                targetLayout: layoutType,
              });
            });
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
                const { componentId, property, value, paramType, attr, updates } = diff;
                // Older peers still send a single property
                const propertyUpdates = updates ?? [{ property, value, paramType, attr }];
                propertyUpdates.forEach((update) => {
                  get().setComponentProperty(
                    componentId,
                    update.property,
                    update.value,
                    update.paramType,
                    update.attr,
                    false,
                    'canvas',
                    {
                      saveAfterAction: false,
                      skipUndoRedo: true,
                    }
                  );
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
            }

            break;
          }
        }
    },
  },
});
