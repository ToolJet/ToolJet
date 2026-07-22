// eslint-disable-next-line import/no-unresolved
import { produceWithPatches, enablePatches, applyPatches } from 'immer';
import { isEmpty } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
enablePatches();

const MAX_HISTORY_LENGTH = 100;

export const createUndoRedoSlice = (set, get) => {
  const undoStack = [];
  const redoStack = [];

  set({ canUndo: false, canRedo: false }, false, 'initializeUndoRedo');

  const updateCanUndoRedo = () => {
    set(
      {
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
      },
      false,
      'updateCanUndoRedo'
    );
  };

  return {
    handleUndo: async () => {
      if (undoStack.length === 0) {
        return;
      }

      const [patches, inversePatches] = undoStack.pop();

      try {
        redoStack.push([inversePatches, patches]);
        if (redoStack.length > MAX_HISTORY_LENGTH) {
          redoStack.shift();
        }
        await get().processPatches(patches);
      } catch (error) {
        redoStack.pop();
        undoStack.push([patches, inversePatches]);
      }

      updateCanUndoRedo();
    },

    processPatches: async (rawPatches) => {
      const patches = filterAndFormatPatches(rawPatches);
      const componentIdsToDelete = [];
      const componentLayoutsToUpdate = {};
      const componentParentToUpdate = {};
      const componentsToAdd = [];

      let newParentId = null;
      let updateParent = false;
      let componenetPropertiesToUpdate = {};
      let componentEventsToUpdate = null;

      const hasMoreThanOnePatchWithPropertyUpdate = patches.filter((patch) => patch.op === 'propertyUpdate').length > 1;

      patches?.map((patch) => {
        const { op, componentId, value } = patch;
        if (op === 'delete') {
          componentIdsToDelete.push(componentId);
        }

        if (op === 'layoutUpdate') {
          componentLayoutsToUpdate[componentId] = value.layouts;
          newParentId = value.parentId;
          updateParent = value.updateParent;
        }

        if (op === 'add') {
          componentsToAdd.push(value);
        }

        if (op === 'parentUpdate') {
          get().setParentComponent(componentId, value, undefined, true);
        }

        if (op === 'propertyUpdate') {
          if (hasMoreThanOnePatchWithPropertyUpdate)
            get().setComponentProperty(
              componentId,
              value.property,
              value.value,
              value.paramType,
              value.attr,
              undefined,
              undefined,
              {
                skipUndoRedo: true,
              }
            );
          else
            componenetPropertiesToUpdate = {
              componentId,
              property: value.property,
              value: value.value,
              paramType: value.paramType,
              attr: value.attr,
            };
        }

        if (op === 'restoreEvents') {
          componentEventsToUpdate = value;
        }
      });

      if (componentIdsToDelete && componentIdsToDelete.length > 0) {
        get().deleteComponents(componentIdsToDelete, undefined, { skipUndoRedo: true });
      }

      if (componentsToAdd && componentsToAdd.length > 0) {
        const addedComponents = await get().addComponentToCurrentPage(componentsToAdd, 'canvas', {
          saveAfterAction: false,
          skipFormUpdate: true,
          skipUndoRedo: true,
        });

        const addedComponentIds = new Set(Object.keys(addedComponents || {}));
        const eventHandlersToCreate = (componentEventsToUpdate || [])
          .filter((event) => addedComponentIds.has(event.sourceId))
          .filter((event) => event?.event && event?.target && event?.sourceId != null && event?.index != null)
          .map((event) => ({
            name: event.name,
            event: { ...event.event },
            eventType: event.target,
            attachedTo: event.sourceId,
            index: event.index,
          }));

        const batchDiff = {
          create: {
            diff: addedComponents,
            pageId: get().getCurrentPageId('canvas'),
          },
          ...(eventHandlersToCreate.length > 0 ? { events: eventHandlersToCreate } : {}),
        };

        try {
          const response = await get().saveComponentChanges(batchDiff, 'components/batch', 'update', 'canvas');
          response?.events?.forEach((event) => get().eventsSlice.addEvent(event, 'canvas'));
        } catch (error) {
          console.error('Error restoring components and event handlers on undo:', error);
        }
      }

      if (!isEmpty(componentLayoutsToUpdate)) {
        get().setComponentLayout(componentLayoutsToUpdate, newParentId, 'canvas', { skipUndoRedo: true, updateParent });
      }

      if (!isEmpty(componenetPropertiesToUpdate)) {
        get().setComponentProperty(
          componenetPropertiesToUpdate.componentId,
          componenetPropertiesToUpdate.property,
          componenetPropertiesToUpdate.value,
          componenetPropertiesToUpdate.paramType,
          componenetPropertiesToUpdate.attr,
          undefined,
          undefined,
          { skipUndoRedo: true }
        );
      }
    },

    handleRedo: async () => {
      if (redoStack.length === 0) {
        return;
      }

      const [patches, inversePatches] = redoStack.pop();

      try {
        undoStack.push([inversePatches, patches]);
        if (undoStack.length > MAX_HISTORY_LENGTH) {
          undoStack.shift();
        }
        await get().processPatches(patches);
      } catch (error) {
        undoStack.pop();
        redoStack.push([patches, inversePatches]);
      }

      updateCanUndoRedo();
    },

    resetUndoRedoStack: () => {
      undoStack.length = 0;
      redoStack.length = 0;
      updateCanUndoRedo();
    },

    withUndoRedo: (fn, skipUndoRedo = false) => {
      if (skipUndoRedo) {
        return fn;
      }
      return (state) => {
        const [newState, patches, inversePatches] = produceWithPatches(fn)(state);
        redoStack.length = 0;
        undoStack.push([inversePatches, patches]);

        if (undoStack.length > MAX_HISTORY_LENGTH) {
          undoStack.shift();
        }

        updateCanUndoRedo();
        return newState;
      };
    },
  };
};

const filterAndFormatPatches = (patches) => {
  const changeStack = [];
  patches?.map((patch) => {
    const { op, path, value } = patch;
    const joinedPath = path.slice(0, 3).join('.');

    if (op === 'remove' && /^modules\.\w+\.pages$/.test(joinedPath)) {
      // componentIdsToDelete.push(path[path.length - 1]);
      changeStack.push({
        op: 'delete',
        componentId: path[path.length - 1],
      });
    }

    if (op === 'add' && /^modules\.\w+\.pages$/.test(joinedPath)) {
      const id = path[path.length - 1];
      changeStack.push({
        op: 'add',
        value: { ...value, id },
      });
    }

    if (op === 'replace' && /^modules\.canvas\.pages(\.\w+)*$/.test(joinedPath)) {
      if (path[6] === 'layouts') {
        const parentUpdatePatch = patches.find((patch) => {
          return patch.op === 'replace' && patch.path[7] === 'parent';
        });
        changeStack.push({
          op: 'layoutUpdate',
          componentId: path[5],
          value: {
            layouts: value,
            parentId: parentUpdatePatch?.value,
            updateParent: !!parentUpdatePatch,
          },
        });
      }

      if (path[6] === 'component' && path[7] !== 'parent') {
        changeStack.push({
          op: 'propertyUpdate',
          componentId: path[5],
          value: {
            property: path[9],
            value: value,
            paramType: path[8],
            attr: path[10],
          },
        });
      }
    }

    if (op === 'replace' && path[0] === 'eventsSlice' && path[1] === 'module' && path[3] === 'events') {
      changeStack.push({
        op: 'restoreEvents',
        value,
      });
    }
  });
  return changeStack;
};
