import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { set as lodashSet } from 'lodash';

const initialState = {};

export const createFormComponentSlice = (set, get) => ({
  ...initialState,

  getFormFields: (componentId, moduleId = 'canvas') => {
    const { getComponentDefinition } = get();
    const componentDefinition = getComponentDefinition(componentId, moduleId);
    if (!componentDefinition) return [];
    return componentDefinition?.component?.definition?.properties?.fields?.value || [];
  },
  setFormFields: async (componentId, fields, moduleId = 'canvas') => {
    const { getComponentDefinition, withUndoRedo, currentPageIndex, saveComponentChanges } = get();
    const { component } = getComponentDefinition(componentId, moduleId);
    if (!component) return;

    set(
      (state) => {
        state.modules[moduleId].pages[currentPageIndex].components[
          componentId
        ].component.definition.properties.fields.value = fields;
      },
      false,
      'setFormFields'
    );

    // set(
    //   withUndoRedo((state) => {
    //     state.modules[moduleId].pages[currentPageIndex].components[
    //       componentId
    //     ].component.definition.properties.fields.value = fields;
    //     // const pageComponent = state.modules[moduleId].pages[currentPageIndex].components[componentId].component;
    //     // lodashSet(pageComponent, ['definition', 'properties', 'fields', 'value'], fields);
    //   }),
    //   false,
    //   'setFormFields'
    // );

    const oldComponent = get().modules[moduleId].pages[currentPageIndex].components[componentId].component;
    const { events, exposedVariables, ...filteredDefinition } = oldComponent.definition || {};

    const diff = {
      [componentId]: {
        component: {
          ...oldComponent,
          definition: filteredDefinition,
        },
      },
    };

    const currentMode = get().currentMode;
    if (currentMode !== 'view') await saveComponentChanges(diff, 'components', 'update');

    get().multiplayer.broadcastUpdates(
      { componentId, property: 'fields', value: fields, paramType: 'properties', attr: 'value' },
      'components',
      'update'
    );
  },

  // Check if the parent component is a Form and delete the form fields if it has the componentId
  checkIfParentIsFormAndDeleteField: (componentId, moduleId = 'canvas', skipSettingProperty = false) => {
    const { getParentComponentType, getComponentDefinition, setFormFields } = get();
    const componentDefinition = getComponentDefinition(componentId, moduleId);
    const parentId = componentDefinition?.component?.parent;
    if (!parentId) return;

    if (getParentComponentType(parentId, moduleId) === 'Form') {
      if (skipSettingProperty) {
        return componentId;
      }
      const componentDefinition = getComponentDefinition(parentId, moduleId);
      const fields = componentDefinition?.component?.definition?.properties?.fields?.value || [];
      const updatedFields = fields.filter((field) => field.componentId !== componentId);

      setFormFields(parentId, updatedFields, moduleId);
    }
  },
  // Check if the parent component is a Form and add the form fields
  checkIfParentIsFormAndAddField: (component, parentId, moduleId = 'canvas', skipSettingProperty = false) => {
    const { getParentComponentType, getComponentDefinition, setFormFields } = get();
    if (!parentId) return;
    const componentType = component?.component?.component;

    const inputComponents = [
      'TextInput',
      'NumberInput',
      'PasswordInput',
      'TextArea',
      'DaterangePicker',
      'DatePickerV2',
      'Checkbox',
      'DropdownV2',
      'MultiselectV2',
      'RadioButtonV2',
      'ToggleSwitchV2',
    ];

    if (!inputComponents.includes(componentType)) return;

    if (getParentComponentType(parentId, moduleId) === 'Form') {
      const newField = {
        componentId: component.id,
        isCustomField: true,
        dataType: undefined,
        key: undefined,
      };

      if (skipSettingProperty) {
        return newField;
      }
      const componentDefinition = getComponentDefinition(parentId, moduleId);
      const fields = componentDefinition?.component?.definition?.properties?.fields?.value || [];
      setFormFields(parentId, [...fields, newField], moduleId);
    }
  },

  // Logic is written considering that the component from different parent cannot be moved together
  checkParentAndUpdateFormFields: (componentLayouts, newParentId, moduleId = 'canvas') => {
    const {
      getParentComponentType,
      getComponentDefinition,
      checkIfParentIsFormAndAddField,
      checkIfParentIsFormAndDeleteField,
      setFormFields,
    } = get();

    const newParentType = getParentComponentType(newParentId, moduleId);
    const currentParentType = getParentComponentType(currentParentId, moduleId);
    const firstComponentId = Object.keys(componentLayouts)[0];
    const existingParentDefinition = getComponentDefinition(firstComponentId, moduleId);
    const currentParentId = existingParentDefinition?.component?.parent;

    /* There are three scenarios:
      1. If both newParentId and currentParentId are same, then return
      2. If newParentId is a Form, then add the fields to the form
      3. If currentParentId is a Form, then remove the fields from the form
    */

    // Case 1: If both newParentId and currentParentId are same, then return
    if (newParentId === currentParentId) return;
    // Return if neither newParentId nor currentParentId is a Form
    if (newParentType !== 'Form' && currentParentType !== 'Form') return;

    const addedFields = [],
      removedComponentIds = [];

    Object.keys(componentLayouts).forEach((componentId) => {
      const componentDefinition = getComponentDefinition(componentId, moduleId);
      // Case 2: If newParentId is a Form, then add the fields to the form
      const newField = checkIfParentIsFormAndAddField(componentDefinition, newParentId, moduleId, true);
      if (newField) {
        addedFields.push(newField);
      }
      // Case 3: If currentParentId is a Form, then remove the fields from the form
      const deletedField = checkIfParentIsFormAndDeleteField(componentId, moduleId, true);
      if (deletedField) {
        removedComponentIds.push(deletedField);
      }
    });
    const fields = existingParentDefinition?.component?.definition?.properties?.fields?.value || [];
    const updatedFields = fields.filter((field) => !removedComponentIds.includes(field.componentId));
    const newParentComponentDefinition = getComponentDefinition(newParentId, moduleId);
    const newParentFields = newParentComponentDefinition?.component?.definition?.properties?.fields?.value || [];
    setFormFields(newParentId, [...newParentFields, ...addedFields], moduleId);
    setFormFields(currentParentId, updatedFields, moduleId);
  },
  setComponentPropertyByComponentIds: (
    componentDiffs,
    moduleId = 'canvas',
    { skipUndoRedo = false, saveAfterAction = true } = {}
  ) => {
    const {
      addToDependencyGraph,
      setResolvedComponent,
      currentMode,
      saveComponentChanges,
      withUndoRedo,
      currentPageIndex,
      getResolvedComponent,
      getComponentDefinition,
    } = get();

    let diff = {};

    // Process resolved values for each component diff before state update
    Object.entries(componentDiffs).forEach(([componentId, componentDiff]) => {
      // Get existing component definition for backend saving
      const currentComponent = getComponentDefinition(componentId);
      if (!currentComponent) return;

      // Get existing resolved values to merge with new ones
      const existingResolvedValues = getResolvedComponent(componentId) || {};

      // Process only the diff through dependency graph
      const resolvedDiffValues = addToDependencyGraph(moduleId, componentId, componentDiff.component);

      // Merge the resolved diff values with existing resolved values
      const mergedResolvedValues = deepClone(existingResolvedValues);

      // Merge at each property type level (properties, styles, validation, etc.)
      ['properties', 'general', 'generalStyles', 'others', 'styles', 'validation'].forEach((propType) => {
        if (resolvedDiffValues[propType]) {
          mergedResolvedValues[propType] = {
            ...(mergedResolvedValues[propType] || {}),
            ...resolvedDiffValues[propType],
          };
        }
      });

      // Update the resolved component in store with merged values
      setResolvedComponent(componentId, mergedResolvedValues, moduleId);

      // Prepare diff for backend saving by merging with current component
      const { events, exposedVariables, ...filteredDefinition } = currentComponent.component.definition || {};

      // Prepare diff for backend saving
      diff[componentId] = {
        component: {
          ...currentComponent.component,
          ...componentDiff.component,
          definition: {
            ...filteredDefinition,
            // If the componentDiff has definition, merge it with the filtered definition
            ...(componentDiff.component?.definition || {}),
          },
        },
      };
    });

    // Update all component state changes in a single batch with one undo/redo operation
    set(
      withUndoRedo((state) => {
        // Process all components in one batch
        Object.entries(componentDiffs).forEach(([componentId, componentDiff]) => {
          if (state.modules[moduleId]?.pages?.[currentPageIndex]?.components?.[componentId]) {
            // Merge component changes into state
            const pageComponent = state.modules[moduleId].pages[currentPageIndex].components[componentId];

            // Handle component definition updates
            if (componentDiff.component?.definition) {
              for (const [defType, defValues] of Object.entries(componentDiff.component.definition)) {
                if (!pageComponent.component.definition[defType]) {
                  pageComponent.component.definition[defType] = {};
                }
                // Correctly merge the new values from diff into the existing definition
                pageComponent.component.definition[defType] = {
                  ...pageComponent.component.definition[defType],
                  ...defValues,
                };
              }
            }
          }
        });
      }),
      skipUndoRedo,
      'setComponentPropertiesByDiff'
    );

    // Save changes to backend if needed
    if (currentMode !== 'view' && Object.keys(diff).length > 0 && saveAfterAction) {
      saveComponentChanges(diff, 'components', 'update');
    }

    // Broadcast updates for multiplayer
    get().multiplayer.broadcastUpdates({ componentDiffs }, 'components', 'update');
    return diff;
  },

  /**
   * Performs batch operations on components (create, update, delete)
   * @param {Object} operations - Object containing the operations to perform
   * @param {Object} operations.added - Components to create { [componentId]: componentDefinition }
   * @param {Object} operations.updated - Components to update { [componentId]: componentDiff }
   * @param {Array} operations.deleted - Array of component IDs to delete
   * @param {string} moduleId - Module ID (default: 'canvas')
   * @param {Object} options - Additional options { skipUndoRedo, saveAfterAction }
   * @returns {Promise} - Promise that resolves when all operations are complete
   */
  performBatchComponentOperations: (operations = {}, moduleId = 'canvas', options = {}) => {
    const {
      currentPageId,
      addComponentToCurrentPage,
      setComponentPropertyByComponentIds,
      deleteComponents,
      saveComponentChanges,
    } = get();

    const { skipUndoRedo = false, saveAfterAction = true } = options;
    let upatedDiff = {};

    // Process create operations
    const handleCreate = async () => {
      if (!operations.added || Object.keys(operations.added).length === 0) return null;

      // Convert create operations format to match addComponentToCurrentPage expectations
      const componentsToCreate = Object.entries(operations.added).map(([id, component]) => ({
        id,
        name: component.name,
        component: component.component,
        layouts: component.layouts,
      }));

      // Use existing addComponentToCurrentPage but with saveAfterAction=false
      // We'll save all changes together at the end
      return addComponentToCurrentPage(componentsToCreate, moduleId, {
        skipUndoRedo: false, // We'll handle undo/redo for the entire batch
        saveAfterAction: false,
      });
    };

    // Process update operations
    const handleUpdate = () => {
      if (!operations.updated || Object.keys(operations.updated).length === 0) return;

      // Use existing setComponentPropertyByComponentIds function
      upatedDiff = setComponentPropertyByComponentIds(operations.updated, moduleId, {
        skipUndoRedo: false, // We'll handle undo/redo for the entire batch
        saveAfterAction: false, // We'll save all changes together at the end
      });
    };

    // Process delete operations
    const handleDelete = () => {
      if (!operations.deleted || operations.deleted.length === 0) return;

      // Use existing deleteComponents function but with saveAfterAction=false
      deleteComponents(operations.deleted, moduleId, {
        skipUndoRedo: false, // We'll handle undo/redo for the entire batch
        saveAfterAction: false,
        isCut: false,
        skipFormUpdate: true, // Skip form updates to avoid conflicts
      });
    };

    try {
      // Process the operations in the correct order: delete -> update -> create -> replace
      // This avoids potential conflicts
      handleDelete();
      handleUpdate();
      handleCreate();

      // Save all changes together if requested
      if (saveAfterAction) {
        // Construct a combined diff for backend saving
        let combinedDiff = {
          create: {
            diff: operations.added || {},
            pageId: currentPageId,
          },
          update: {
            diff: upatedDiff || {},
          },
          delete: {
            diff: operations.deleted || [],
          },
        };

        saveComponentChanges(combinedDiff, 'components/batch', 'update');

        // Broadcast updates for multiplayer
        get().multiplayer.broadcastUpdates({ operations }, 'components', 'update');
      }
    } catch (error) {
      console.error('Error performing batch component operations:', error);
    }
  },
});
