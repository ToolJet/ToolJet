import { useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useFormState } from './useFormState';
import { useFormData } from './useFormData';
import { createParamUpdatedInterceptor, createColumnMappingHandler, createJSONDataBlurHandler } from '../handlers';

export const useFormLogic = (component, paramUpdated) => {
  // Store selectors
  const resolveReferences = useStore((state) => state.resolveReferences, shallow);
  const getFormDataSectionData = useStore((state) => state.getFormDataSectionData, shallow);
  const saveFormDataSectionData = useStore((state) => state.saveFormDataSectionData, shallow);
  const componentNameIdMapping = useStore((state) => state.modules.canvas.componentNameIdMapping, shallow);
  const queryNameIdMapping = useStore((state) => state.modules.canvas.queryNameIdMapping, shallow);
  const getChildComponents = useStore((state) => state.getChildComponents, shallow);
  const runQuery = useStore((state) => state.queryPanel.runQuery, shallow);
  const getExposedValueOfQuery = useStore((state) => state.getExposedValueOfQuery, shallow);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const getComponentDefinition = useStore((state) => state.getComponentDefinition, shallow);
  const performBatchComponentOperations = useStore((state) => state.performBatchComponentOperations, shallow);

  // Custom hooks
  const formState = useFormState(component);
  const formData = useFormData(component);

  // Save data section function
  const saveDataSection = (fields) => {
    formState.savedSourceValue.current = formState.source.value;
    const newJsonData = formState.JSONData;

    if (newJsonData?.value === undefined) {
      newJsonData.value = resolveReferences('canvas', formState.source.value);
    }

    saveFormDataSectionData(
      component?.id,
      {
        generateFormFrom: formState.source,
        JSONData: formState.JSONData,
      },
      fields
    );
  };

  // Create column mapping handler
  const performColumnMapping = createColumnMappingHandler({
    component,
    isFormGenerated: formData.isFormGenerated,
    currentStatusRef: formState.currentStatusRef,
    formFields: useStore((state) => state.getFormFields(component.id), shallow),
    formFieldsWithComponentDefinition: formData.formFieldsWithComponentDefinition,
    getChildComponents,
    currentLayout,
    performBatchComponentOperations,
    saveDataSection,
    setOpenModal: formState.setOpenModal,
  });

  // Create JSON data blur handler
  const handleJSONDataBlur = createJSONDataBlurHandler({
    component,
    currentStatusRef: formState.currentStatusRef,
    resolveReferences,
    getFormDataSectionData,
    savedSourceValue: formState.savedSourceValue,
    source: formState.source,
    formFieldsWithComponentDefinition: formData.formFieldsWithComponentDefinition,
    existingResolvedJsonData: formData.existingResolvedJsonData,
    getComponentDefinition,
    performColumnMapping,
    saveDataSection,
    codeEditorView: formState.codeEditorView,
  });

  // Create parameter updated interceptor
  const paramUpdatedInterceptor = createParamUpdatedInterceptor({
    component,
    paramUpdated,
    source: formState.source,
    setSource: formState.setSource,
    setJSONData: formState.setJSONData,
    setOpenModal: formState.setOpenModal,
    shouldFocusJSONDataEditor: formState.shouldFocusJSONDataEditor,
    shouldInvokeBlurEvent: formState.shouldInvokeBlurEvent,
    savedSourceValue: formState.savedSourceValue,
    componentNameIdMapping,
    queryNameIdMapping,
    getFormDataSectionData,
    getExposedValueOfQuery,
    runQuery,
    resolveReferences,
    setLoading: formState.setLoading,
  });

  // Effect for handling JSON data blur
  useEffect(() => {
    if (formState.shouldInvokeBlurEvent.current) {
      formState.shouldInvokeBlurEvent.current = false;
      handleJSONDataBlur(formState.JSONData.value);
    }
  }, [formState.shouldInvokeBlurEvent, formState.JSONData, handleJSONDataBlur]);

  return {
    ...formState,
    ...formData,
    paramUpdatedInterceptor,
    performColumnMapping,
    handleJSONDataBlur,
    saveDataSection,
    closeModal: () => {
      formState.setOpenModal(false);
    },
  };
};
