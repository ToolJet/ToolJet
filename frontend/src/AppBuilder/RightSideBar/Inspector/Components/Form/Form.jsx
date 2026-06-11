import React from 'react';
import Accordion from '@/_ui/Accordion';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useFormLogic } from './_hooks';
import { processComponentMeta } from './utils/componentMetaUtils';
import { createAccordionItems } from './config/accordionConfig';
import { DataSection } from './_components';
import './styles.scss';

export const Form = ({
  componentMeta,
  darkMode,
  layoutPropertyChanged,
  component,
  paramUpdated,
  dataQueries,
  currentState,
  eventsChanged,
  apps,
  allComponents,
  pages,
}) => {
  const resolveReferences = useStore((state) => state.resolveReferences, shallow);

  // Use the combined form logic hook
  const formLogic = useFormLogic(component, paramUpdated);

  // Get resolved custom schema
  const resolvedCustomSchema = resolveReferences('canvas', component.component.definition.properties.advanced.value);

  // Process component metadata
  const { tempComponentMeta, properties, additionalActions, deprecatedProperties, events, validations } =
    processComponentMeta(componentMeta, component, allComponents, resolvedCustomSchema);

  // Create render data element function
  const renderDataElement = DataSection({
    component,
    componentMeta,
    paramUpdatedInterceptor: formLogic.paramUpdatedInterceptor,
    dataQueries,
    currentState,
    allComponents,
    darkMode,
    resolvedCustomSchema,
    source: formLogic.source,
    JSONData: formLogic.JSONData,
    setCodeEditorView: formLogic.setCodeEditorView,
    currentStatusRef: formLogic.currentStatusRef,
    saveDataSection: formLogic.saveDataSection,
    openModal: formLogic.openModal,
    setParentModalState: formLogic.setOpenModal,
    performColumnMapping: formLogic.performColumnMapping,
    existingResolvedJsonData: formLogic.existingResolvedJsonData,
    savedSourceValue: formLogic.savedSourceValue.current,
    resolveReferences,
    isLoading: formLogic.isLoading,
  });

  // Create accordion items
  const accordionItems = createAccordionItems({
    properties,
    events,
    component,
    componentMeta: tempComponentMeta,
    layoutPropertyChanged,
    paramUpdated: formLogic.paramUpdatedInterceptor,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    validations,
    darkMode,
    pages,
    additionalActions,
    deprecatedProperties,
    renderDataElement,
  });

  return (
    <>
      <Accordion items={accordionItems} />
    </>
  );
};
