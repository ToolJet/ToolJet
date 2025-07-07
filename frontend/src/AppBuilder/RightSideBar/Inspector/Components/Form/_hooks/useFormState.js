import { useState, useRef, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { INPUT_COMPONENTS_FOR_FORM } from '../constants';

export const useFormState = (component) => {
  const getChildComponents = useStore((state) => state.getChildComponents, shallow);
  const saveFormFields = useStore((state) => state.saveFormFields, shallow);
  const resolveReferences = useStore((state) => state.resolveReferences, shallow);

  const [source, setSource] = useState({
    value: component.component.definition.properties?.generateFormFrom?.value,
    fxActive: component.component.definition.properties?.generateFormFrom?.fxActive,
  });

  const resolvedSource = resolveReferences(
    'canvas',
    component.component.definition.properties?.generateFormFrom?.value
  );

  const [JSONData, setJSONData] = useState({
    value: resolvedSource === 'rawJson' ? component.component.definition.properties?.JSONData?.value : resolvedSource,
  });

  const [openModal, setOpenModal] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [codeEditorView, setCodeEditorView] = useState(null);

  // Refs for managing component state
  const shouldFocusJSONDataEditor = useRef(false);
  const currentStatusRef = useRef(null);
  const shouldInvokeBlurEvent = useRef(false);
  const savedSourceValue = useRef(component.component.definition.properties?.generateFormFrom?.value);

  // Backfill fields if not present
  const fields = component.component.definition.properties?.fields;
  if (fields === undefined) {
    const newFields = [];
    const childComponents = getChildComponents(component.id);
    Object.keys(childComponents).forEach((childId) => {
      if (INPUT_COMPONENTS_FOR_FORM.includes(childComponents[childId].component.component.component)) {
        newFields.push({
          componentId: childId,
          isCustomField: true,
        });
      }
    });
    saveFormFields(component.id, newFields, 'canvas');
  }

  // Focus management effect
  useEffect(() => {
    if (codeEditorView && shouldFocusJSONDataEditor.current) {
      codeEditorView.focus();
      // Add 'focused' class to the parent of codeEditorView.dom
      if (codeEditorView.dom && codeEditorView.dom.parentNode) {
        codeEditorView.dom.parentNode.classList.add('focused');
      }
    }
  }, [codeEditorView, shouldFocusJSONDataEditor]);

  return {
    source,
    setSource,
    JSONData,
    setJSONData,
    openModal,
    setOpenModal,
    codeEditorView,
    setCodeEditorView,
    shouldFocusJSONDataEditor,
    currentStatusRef,
    shouldInvokeBlurEvent,
    savedSourceValue,
    isLoading,
    setLoading,
  };
};
