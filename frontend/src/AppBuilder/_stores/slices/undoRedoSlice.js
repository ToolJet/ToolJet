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
    handleUndo: () => {
      if (undoStack.length === 0) {
        return;
      }

      const [patches, inversePatches] = undoStack.pop();

      try {
        redoStack.push([inversePatches, patches]);
        if (redoStack.length > MAX_HISTORY_LENGTH) {
          redoStack.shift();
        }
        get().processPatches(patches);
      } catch (error) {
        undoStack.push([patches, inversePatches]);
      }

      updateCanUndoRedo();
    },

    processPatches: (rawPatches) => {
      const patches = filterAndFormatPatches(rawPatches);
      const componentIdsToDelete = [];
      const componentLayoutsToUpdate = {};
      const componentParentToUpdate = {};
      const componentIdsToAdd = [];

      let newParentId = null;
      let updateParent = false;
      let componenetPropertiesToUpdate = {};

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
          componentIdsToAdd.push(value);
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
      });

      if (componentIdsToDelete && componentIdsToDelete.length > 0) {
        get().deleteComponents(componentIdsToDelete, undefined, { skipUndoRedo: true });
      }

      if (componentIdsToAdd && componentIdsToAdd.length > 0) {
        get().addComponentToCurrentPage(componentIdsToAdd, 'canvas', { skipUndoRedo: true });
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

    handleRedo: () => {
      if (redoStack.length === 0) {
        return;
      }

      const [patches, inversePatches] = redoStack.pop();

      try {
        undoStack.push([inversePatches, patches]);
        if (undoStack.length > MAX_HISTORY_LENGTH) {
          undoStack.shift();
        }
        get().processPatches(patches);
      } catch (error) {
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
      // if (path[6] === 'component' && path[7] === 'parent') {
      //   changeStack.push({
      //     op: 'parentUpdate',
      //     componentId: path[5],
      //     value,
      //   });
      // } else
      // path layout: [modules, moduleId, pages, pageIndex, components, componentId, 'component', 'definition', paramType, property, attr]
      //   path[8] = paramType  (styles / properties / others / ...)
      //   path[9] = property   (backgroundColor / label / ...)
      //   path[10] = attr      ('value' / 'fxActive' / ...)
      //
      // Guard: batch operations (e.g. Form field add/remove) replace the whole paramType object at once via
      // `definition[paramType] = { ...old, ...diff }`, which makes immer emit a single coarse patch that stops
      // at path[8] with no property name in path[9]. Replaying that would call setComponentProperty with
      // property=undefined, which lodash coerces to the string "undefined" and writes a phantom
      // `definition[paramType]["undefined"]` key — silently corrupting the app JSON and making the undo a no-op.
      if (path[6] === 'component' && path[7] !== 'parent' && path[9] !== undefined) {
        let attr = path[10];
        let patchValue = value;
        // Guard: if a future code path replaces a whole property wrapper object at once
        // (path stops at path[9] with no attr leaf at path[10]), replaying as-is would nest
        // the { value: X } wrapper under .value -> { value: { value: X } }. Unwrap one level
        // so the replay restores the correct { value: X } shape.
        if (attr === undefined && patchValue && typeof patchValue === 'object' && 'value' in patchValue) {
          attr = 'value';
          patchValue = patchValue.value;
        }
        changeStack.push({
          op: 'propertyUpdate',
          componentId: path[5],
          value: {
            property: path[9],
            value: patchValue,
            paramType: path[8],
            attr,
          },
        });
      }
    }
  });
  return changeStack;
};
