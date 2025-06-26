import React from 'react';
import { renderElement } from '../../../Utils';
import { DataSectionWrapper } from './index';

export const DataSection = ({
  component,
  componentMeta,
  paramUpdatedInterceptor,
  dataQueries,
  currentState,
  allComponents,
  darkMode,
  resolvedCustomSchema,
  source,
  JSONData,
  setCodeEditorView,
  currentStatusRef,
  saveDataSection,
  openModal,
  setParentModalState,
  performColumnMapping,
  existingResolvedJsonData,
  savedSourceValue,
  resolveReferences,
  isLoading = false,
}) => {
  return () => (
    <div className={`${resolvedCustomSchema ? 'tw-pointer-events-none opacity-60' : ''}`}>
      {componentMeta?.properties &&
        Object.keys(componentMeta.properties).map((property) => {
          if (componentMeta?.properties[property]?.section !== 'data') return null;

          // Mutating the component definition properties to set the generateFormFrom source
          component.component.definition.properties.generateFormFrom = source;
          component.component.definition.properties.JSONData = JSONData;
          const focusCodeEditor = property === 'JSONData' ? setCodeEditorView : undefined;

          return renderElement(
            component,
            componentMeta,
            paramUpdatedInterceptor,
            dataQueries,
            property,
            'properties',
            currentState,
            allComponents,
            darkMode,
            '',
            null,
            focusCodeEditor
          );
        })}
      {source.value !== 'jsonSchema' && (
        <DataSectionWrapper
          currentStatusRef={currentStatusRef}
          source={source}
          JSONData={JSONData}
          component={component}
          darkMode={darkMode}
          saveDataSection={saveDataSection}
          openModalFromParent={openModal}
          setParentModalState={setParentModalState}
          performColumnMapping={performColumnMapping}
          newResolvedJsonData={resolveReferences('canvas', JSONData.value)}
          existingResolvedJsonData={existingResolvedJsonData}
          savedSourceValue={savedSourceValue}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
