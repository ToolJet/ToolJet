import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  isTrueValue,
  isPropertyFxControlled,
  parseDataAndBuildFields,
  analyzeJsonDifferences,
  mergeFieldsWithComponentDefinition,
  mergeFormFieldsWithNewData,
  mergeArrays,
} from '../../utils/utils';
import { FORM_STATUS } from '../../constants';
import { merge } from 'lodash';

// Constants for section order preference
const SECTION_ORDER = ['isNew', 'isRemoved', 'existing', 'isCustomField'];

/**
 * Custom hook for managing column building logic
 */
export const useColumnBuilder = (
  component,
  currentStatus,
  newResolvedJsonData,
  existingResolvedJsonData,
  refreshedColumns,
  getFormFields,
  getComponentDefinition
) => {
  return useMemo(() => {
    const formFields = getFormFields(component.id);
    const formFieldsWithComponentDefinition = mergeFieldsWithComponentDefinition(formFields, getComponentDefinition);

    if (currentStatus === FORM_STATUS.MANAGE_FIELDS) {
      const allColumnsFromJsonData = parseDataAndBuildFields(newResolvedJsonData);
      return mergeArrays(allColumnsFromJsonData, formFieldsWithComponentDefinition);
    } else if (currentStatus === FORM_STATUS.REFRESH_FIELDS) {
      const jsonDifferences = analyzeJsonDifferences(refreshedColumns, existingResolvedJsonData);
      const mergedJsonData = merge({}, existingResolvedJsonData, refreshedColumns);
      const parsedFields = parseDataAndBuildFields(mergedJsonData, jsonDifferences);
      const mergedFields = mergeFormFieldsWithNewData(formFieldsWithComponentDefinition, parsedFields);
      const enhancedFieldsWithComponentDefinition = mergeFieldsWithComponentDefinition(
        mergedFields,
        getComponentDefinition
      );
      return [
        ...enhancedFieldsWithComponentDefinition,
        ...formFieldsWithComponentDefinition.filter((f) => f.isCustomField),
      ];
    }
    return parseDataAndBuildFields(newResolvedJsonData || []);
  }, [
    component.id,
    currentStatus,
    newResolvedJsonData,
    existingResolvedJsonData,
    refreshedColumns,
    getFormFields,
    getComponentDefinition,
  ]);
};

/**
 * Custom hook for managing grouped columns state
 */
export const useGroupedColumns = (columnsToUse, currentStatus) => {
  const [groupedColumns, setGroupedColumns] = useState({});
  const [sectionTypes, setSectionTypes] = useState([]);

  useEffect(() => {
    const grouped = {};
    const isGenerateFieldsMode = currentStatus === FORM_STATUS.GENERATE_FIELDS;
    const isRefreshFormMode = currentStatus === FORM_STATUS.REFRESH_FIELDS;
    const shouldSelectByDefault = isGenerateFieldsMode || isRefreshFormMode;

    columnsToUse.forEach((col) => {
      let sectionType = 'existing';

      if (col.isNew) {
        sectionType = 'isNew';
      } else if (col.isRemoved) {
        sectionType = 'isRemoved';
      } else if (col.isCustomField) {
        sectionType = 'isCustomField';
      }

      if (!grouped[sectionType]) {
        grouped[sectionType] = [];
      }

      // Auto-select columns based on mode
      if (
        shouldSelectByDefault &&
        sectionType !== 'isRemoved' &&
        (isGenerateFieldsMode || (isRefreshFormMode && sectionType === 'isNew'))
      ) {
        grouped[sectionType].push({ ...col, selected: true });
      } else {
        grouped[sectionType].push(col);
      }
    });

    const types = SECTION_ORDER.filter((type) => grouped[type] && grouped[type].length > 0);

    setGroupedColumns(grouped);
    setSectionTypes(types);
  }, [columnsToUse, currentStatus]);

  const updateSectionColumns = useCallback((sectionType, updatedColumns) => {
    setGroupedColumns((prev) => ({
      ...prev,
      [sectionType]: updatedColumns,
    }));
  }, []);

  return { groupedColumns, sectionTypes, updateSectionColumns };
};

/**
 * Hook for checkbox state calculations
 */
export const useCheckboxStates = (columnsArray) => {
  return useMemo(() => {
    const mandatorySettableColumns = columnsArray.filter((col) => !isPropertyFxControlled(col.mandatory));

    const isAllSelected = columnsArray.length > 0 ? columnsArray.every((col) => col.selected) : false;
    const isIntermediateSelected = !isAllSelected && columnsArray.some((col) => col.selected);

    const isAllSelectedMandatory =
      mandatorySettableColumns.length > 0
        ? mandatorySettableColumns.every((col) => isTrueValue(col.mandatory.value))
        : false;

    const isIntermediateMandatory =
      !isAllSelectedMandatory && mandatorySettableColumns.some((col) => isTrueValue(col.mandatory.value));

    return {
      isAllSelected,
      isIntermediateSelected,
      isAllSelectedMandatory,
      isIntermediateMandatory,
      mandatorySettableColumns,
    };
  }, [columnsArray]);
};
