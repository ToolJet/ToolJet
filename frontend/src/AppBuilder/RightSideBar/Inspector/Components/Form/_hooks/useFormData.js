import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { mergeFieldsWithComponentDefinition } from '../utils/utils';

export const useFormData = (component) => {
  const resolveReferences = useStore((state) => state.resolveReferences, shallow);
  const getFormDataSectionData = useStore((state) => state.getFormDataSectionData, shallow);
  const getComponentDefinition = useStore((state) => state.getComponentDefinition, shallow);
  const formFields = useStore((state) => state.getFormFields(component.id), shallow);

  // Get form data and process it
  const existingData = getFormDataSectionData(component?.id);
  let isFormGenerated = existingData?.generateFormFrom?.value ?? false;

  // Memoized form fields with component definition
  const formFieldsWithComponentDefinition = React.useMemo(
    () => mergeFieldsWithComponentDefinition(formFields, getComponentDefinition),
    [formFields, getComponentDefinition]
  );

  // Process JSON data
  let existingResolvedJsonData = existingData?.JSONData?.value;
  existingResolvedJsonData = resolveReferences('canvas', existingResolvedJsonData);

  const newJSONValue = component.component.definition.properties['JSONData']?.value;
  const newResolvedJsonData = resolveReferences('canvas', newJSONValue);

  return {
    existingData,
    isFormGenerated,
    formFieldsWithComponentDefinition,
    existingResolvedJsonData,
    newJSONValue,
    newResolvedJsonData,
  };
};
