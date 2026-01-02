import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { cleanupFormFields } from '@/AppBuilder/RightSideBar/Inspector/Components/Form/utils/utils';
import { set as lodashSet } from 'lodash';
import { INPUT_COMPONENTS_FOR_FORM } from '@/AppBuilder/RightSideBar/Inspector/Components/Form/constants';

const initialState = {};

export const createFormComponentSlice = (set, get) => ({
  ...initialState,

  isJsonSchemaInGenerateFormFrom: (componentId, moduleId = 'canvas') => {
    const { getComponentDefinition } = get();
    const componentDefinition = getComponentDefinition(componentId, moduleId);
    if (!componentDefinition) return false;
    const { generateFormFrom } = componentDefinition.component.definition.properties || {};
    return generateFormFrom?.value === 'jsonSchema';
  },
  getFormDataSectionData: (componentId, moduleId = 'canvas') => {
    const { getComponentDefinition } = get();
    const componentDefinition = getComponentDefinition(componentId, moduleId);
    if (!componentDefinition) return null;
    const { generateFormFrom = null, JSONData = null } = componentDefinition.component.definition.properties || {};
    return { generateFormFrom, JSONData };
  },
  saveFormDataSectionData: (componentId, data, fields, moduleId = 'canvas') => {
    const { getComponentDefinition, updateContainerAutoHeight, getCurrentPageIndex, saveComponentPropertyChanges } =
      get();
    const componentDefinition = getComponentDefinition(componentId, moduleId);
    if (!componentDefinition) return;

    const currentPageIndex = getCurrentPageIndex(moduleId);
    set(
      (state) => {
        const pageComponent = state.modules[moduleId].pages[currentPageIndex].components[componentId].component;
        lodashSet(pageComponent, ['definition', 'properties', 'generateFormFrom'], data.generateFormFrom);
        lodashSet(pageComponent, ['definition', 'properties', 'JSONData'], data.JSONData);
        lodashSet(pageComponent, ['definition', 'properties', 'fields', 'value'], cleanupFormFields(fields));
      },
      false,
      'saveFormDataSectionData'
    );

    updateContainerAutoHeight(componentId);

    saveComponentPropertyChanges(
      componentId,
      'generateFormFrom',
      data.generateFormFrom,
      'properties',
      'value',
      moduleId
    );
  },
  getFormFields: (componentId, moduleId = 'canvas') => {
    const { getComponentDefinition } = get();
    const componentDefinition = getComponentDefinition(componentId, moduleId);
    if (!componentDefinition) return [];
    return componentDefinition?.component?.definition?.properties?.fields?.value || [];
  },
  saveFormFields: (componentId, fields, moduleId = 'canvas') => {
    if (!componentId) return;

    const { getComponentDefinition, getCurrentPageIndex, saveComponentPropertyChanges } = get();
    const componentDefinition = getComponentDefinition(componentId, moduleId);
    if (!componentDefinition) return;

    const currentPageIndex = getCurrentPageIndex(moduleId);
    set(
      (state) => {
        const pageComponent = state.modules[moduleId].pages[currentPageIndex].components[componentId].component;
        lodashSet(pageComponent, ['definition', 'properties', 'fields', 'value'], cleanupFormFields(fields));
      },
      false,
      'saveFormFields'
    );

    saveComponentPropertyChanges(componentId, 'fields', fields, 'properties', 'value', moduleId);
  },

  // Check if the parent component is a Form and delete the form fields if it has the componentId
  checkIfParentIsFormAndDeleteField: (componentId, moduleId = 'canvas', skipSettingProperty = false) => {
    const { getParentComponentType, getComponentDefinition, saveFormFields, getFormFields } = get();
    const componentDefinition = getComponentDefinition(componentId, moduleId);
    const parentId = componentDefinition?.component?.parent;
    if (!parentId) return;

    if (getParentComponentType(parentId, moduleId) === 'Form') {
      if (skipSettingProperty) {
        return componentId;
      }
      const fields = getFormFields(parentId, moduleId);

      const updatedFields = fields.filter((field) => field.componentId !== componentId);

      saveFormFields(parentId, updatedFields, moduleId);
    }
  },
  // Check if the parent component is a Form and add the form fields
  checkIfParentIsFormAndAddField: (
    componentId,
    component,
    parentId,
    moduleId = 'canvas',
    skipSettingProperty = false
  ) => {
    const { getParentComponentType, getFormFields, saveFormFields } = get();
    if (!parentId) return;
    const componentType = component?.component?.component;

    if (!INPUT_COMPONENTS_FOR_FORM.includes(componentType)) return;

    if (getParentComponentType(parentId, moduleId) === 'Form') {
      const newField = {
        componentId,
        isCustomField: true,
        dataType: undefined,
        key: undefined,
      };

      if (skipSettingProperty) {
        return newField;
      }
      const fields = getFormFields(parentId, moduleId);
      saveFormFields(parentId, [...fields, newField], moduleId);
    }
  },

  // Logic is written considering that the component from different parent cannot be moved together
  checkParentAndUpdateFormFields: (componentLayouts, newParentId, moduleId = 'canvas') => {
    const {
      getParentComponentType,
      getComponentDefinition,
      checkIfParentIsFormAndAddField,
      checkIfParentIsFormAndDeleteField,
      saveFormFields,
    } = get();

    const newParentType = getParentComponentType(newParentId, moduleId);
    const firstComponentId = Object.keys(componentLayouts)[0];

    const firstComponentDefinition = getComponentDefinition(firstComponentId, moduleId);
    const currentParentId = firstComponentDefinition?.component?.parent;
    const existingParentDefinition = currentParentId ? getComponentDefinition(currentParentId, moduleId) : null;
    const currentParentType = existingParentDefinition?.component?.component;

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
      const newField = checkIfParentIsFormAndAddField(componentId, componentDefinition, newParentId, moduleId, true);
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
    saveFormFields(newParentId, [...newParentFields, ...addedFields], moduleId);
    saveFormFields(currentParentId, updatedFields, moduleId);
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
      getCurrentPageIndex,
      getResolvedComponent,
      getComponentDefinition,
    } = get();

    let diff = {};
    const currentPageIndex = getCurrentPageIndex(moduleId);

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
  performBatchComponentOperations: async (operations = {}, moduleId = 'canvas', options = {}) => {
    const {
      getCurrentPageId,
      addComponentToCurrentPage,
      setComponentPropertyByComponentIds,
      deleteComponents,
      saveComponentChanges,
      buildComponentDefinition,
    } = get();
    const currentPageId = getCurrentPageId(moduleId);

    const { skipUndoRedo = false, saveAfterAction = true } = options;
    let upatedDiff = {};

    // Process create operations
    const handleCreate = async () => {
      if (!operations.added || Object.keys(operations.added).length === 0) return {};

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
        skipUndoRedo: false,
        saveAfterAction: false,
        skipFormUpdate: true,
      });
    };

    // Process update operations
    const handleUpdate = () => {
      if (!operations.updated || Object.keys(operations.updated).length === 0) return;

      // Use existing setComponentPropertyByComponentIds function
      upatedDiff = setComponentPropertyByComponentIds(operations.updated, moduleId, {
        skipUndoRedo: false,
        saveAfterAction: false, // We'll save all changes together at the end
      });
    };

    // Process delete operations
    const handleDelete = () => {
      if (!operations.deleted || operations.deleted.length === 0) return;

      // Use existing deleteComponents function but with saveAfterAction=false
      deleteComponents(operations.deleted, moduleId, {
        skipUndoRedo: false,
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
      const diff = await handleCreate();

      // Save all changes together if requested
      if (saveAfterAction) {
        let combinedDiff = {
          create: {
            diff: diff,
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
