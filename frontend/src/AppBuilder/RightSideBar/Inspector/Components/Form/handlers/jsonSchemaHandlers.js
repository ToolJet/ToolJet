import { FORM_STATUS } from '../constants';
import { generateUIComponents } from '@/Editor/Components/Form/FormUtils';
import { v4 as uuidv4 } from 'uuid';
import { cleanupFormFields } from '../utils/utils';
import { isEqual } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';

export const createJSONSchemaBlurHandler = ({
  component,
  currentStatusRef,
  resolveReferences,
  savedSourceValue,
  source,
  getFormDataSectionData,
  performBatchComponentOperations,
  saveDataSection,
  codeEditorView,
  getChildComponents,
}) => {
  return async (newJSONValue = null) => {
    if (!newJSONValue?.startsWith('{{') && !newJSONValue?.endsWith('}}')) return;

    if (codeEditorView.dom && codeEditorView.dom.parentNode) {
      codeEditorView.dom.parentNode.classList.remove('focused');
    }

    const existingData = getFormDataSectionData(component?.id);
    const resolvedNewJSONValue = resolveReferences('canvas', newJSONValue);
    const existingResolvedValue = existingData?.newJsonSchema?.value
      ? resolveReferences('canvas', existingData.newJsonSchema.value)
      : null;

    const hasDataChanged = !isEqual(resolvedNewJSONValue, existingResolvedValue);
    const sourceChanged = !isEqual(savedSourceValue.current, source?.value);

    if (!resolvedNewJSONValue || !newJSONValue) {
      return;
    }

    if (hasDataChanged || sourceChanged) {
      currentStatusRef.current = FORM_STATUS.GENERATE_FIELDS;

      const uiComponentsDraft = generateUIComponents(resolvedNewJSONValue, true, component.name);
      if (!uiComponentsDraft || uiComponentsDraft.length === 0) return;

      const childComponents = getChildComponents(component?.id);
      
      let operations = {
        updated: {},
        added: {},
        deleted: Object.keys(childComponents || {}),
      };

      let nextTop = 0;
      const newColumns = [];

      uiComponentsDraft.forEach((uiComp) => {
        const fieldId = uuidv4();
        const baseName = uiComp.formKey || uiComp.component;
        const componentName = useStore.getState().generateUniqueComponentNameFromBaseName(baseName);

        const newComponent = {
          id: fieldId,
          name: componentName,
          component: {
            ...uiComp,
            type: uiComp.component,
            name: componentName,
            parent: component.id,
            formKey: uiComp.formKey,
          },
          layouts: {
            desktop: {
              top: nextTop,
              left: 3,
              width: 37,
              height: uiComp.defaultSize?.height || 30,
            },
            mobile: {
              top: nextTop,
              left: 3,
              width: 37,
              height: uiComp.defaultSize?.height || 30,
            },
          },
        };

        operations.added[fieldId] = newComponent;
        nextTop += (uiComp.defaultSize?.height || 30) + 10;

        newColumns.push({
          componentId: fieldId,
          isCustomField: false,
          dataType: 'string', // Default for schema fields
          key: uiComp.formKey || componentName,
        });
      });

      performBatchComponentOperations(operations);
      saveDataSection(cleanupFormFields(newColumns));
    } else if (savedSourceValue.current === 'jsonSchema') {
      // Just save if no changes
      // We don't have formFieldsWithComponentDefinition readily available here, but we can pass existing fields if needed.
    }
  };
};
