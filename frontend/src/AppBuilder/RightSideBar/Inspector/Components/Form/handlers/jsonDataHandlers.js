import { isEqual, merge } from 'lodash';
import { FORM_STATUS } from '../constants';
import {
  parseDataAndBuildFields,
  analyzeJsonDifferences,
  mergeFormFieldsWithNewData,
  mergeFieldsWithComponentDefinition,
} from '../utils/utils';

export const createJSONDataBlurHandler = ({
  component,
  currentStatusRef,
  resolveReferences,
  getFormDataSectionData,
  savedSourceValue,
  source,
  formFieldsWithComponentDefinition,
  existingResolvedJsonData,
  getComponentDefinition,
  performColumnMapping,
  saveDataSection,
  codeEditorView,
}) => {
  return async (newJSONValue = null) => {
    if (!newJSONValue?.startsWith('{{') && !newJSONValue?.endsWith('}}')) return;

    if (codeEditorView.dom && codeEditorView.dom.parentNode) {
      codeEditorView.dom.parentNode.classList.remove('focused');
    }

    const existingData = getFormDataSectionData(component?.id);
    const isFormGenerated = existingData && existingData.generateFormFrom && existingData.JSONData;

    // Resolve both values to compare actual data, not just string comparison
    const resolvedNewJSONValue = resolveReferences('canvas', newJSONValue);
    const existingResolvedValue = existingData?.JSONData?.value
      ? resolveReferences('canvas', existingData.JSONData.value)
      : null;

    // Use deep comparison to check if there's actual content change
    const hasDataChanged = !isEqual(resolvedNewJSONValue, existingResolvedValue);

    // Only proceed if there's actual data and changes
    if (!resolvedNewJSONValue || !newJSONValue) {
      return;
    }

    if (!isFormGenerated) {
      currentStatusRef.current = FORM_STATUS.GENERATE_FIELDS;
      const columns = parseDataAndBuildFields(resolvedNewJSONValue);

      if (columns && columns.length > 0) {
        performColumnMapping(columns);
      }
      return;
    }

    if (hasDataChanged) {
      const sourceChanged = !isEqual(savedSourceValue.current, source?.value);
      currentStatusRef.current = sourceChanged ? FORM_STATUS.GENERATE_FIELDS : FORM_STATUS.REFRESH_FIELDS;
      const jsonDifferences = analyzeJsonDifferences(
        resolvedNewJSONValue,
        sourceChanged ? null : existingResolvedJsonData
      );

      const mergedJsonData = merge({}, sourceChanged ? {} : existingResolvedJsonData, resolvedNewJSONValue);
      const parsedFields = parseDataAndBuildFields(mergedJsonData, jsonDifferences);
      const mergedFields = mergeFormFieldsWithNewData(formFieldsWithComponentDefinition, parsedFields);
      const enhancedFieldsWithComponentDefinition = mergeFieldsWithComponentDefinition(
        mergedFields,
        getComponentDefinition
      );

      if (enhancedFieldsWithComponentDefinition && enhancedFieldsWithComponentDefinition.length > 0) {
        performColumnMapping(enhancedFieldsWithComponentDefinition);
      }
    } else if (savedSourceValue.current === 'jsonSchema') {
      return saveDataSection(formFieldsWithComponentDefinition);
    }
  };
};
