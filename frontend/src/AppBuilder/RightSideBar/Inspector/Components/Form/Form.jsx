import React, { useEffect, useState, useRef, useCallback } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { renderElement } from '../../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import DataSectionWrapper from './_components/DataSectionWrapper';
import './styles.scss';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { isEqual, merge } from 'lodash';
import {
  parseDataAndBuildFields,
  findNextElementTop,
  analyzeJsonDifferences,
  mergeFieldsWithComponentDefinition,
  mergeFormFieldsWithNewData,
  cleanupFormFields,
  findFirstKeyValuePairWithPath,
} from './utils/utils';
import { updateFormFieldComponent } from './utils/fieldOperations';
import { INPUT_COMPONENTS_FOR_FORM, FORM_STATUS, COMPONENT_LAYOUT_DETAILS } from './constants';

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
  const getFormDataSectionData = useStore((state) => state.getFormDataSectionData, shallow);
  const saveFormDataSectionData = useStore((state) => state.saveFormDataSectionData, shallow);
  const componentNameIdMapping = useStore((state) => state.modules.canvas.componentNameIdMapping, shallow);
  const queryNameIdMapping = useStore((state) => state.modules.canvas.queryNameIdMapping, shallow);
  const getChildComponents = useStore((state) => state.getChildComponents, shallow);
  const saveFormFields = useStore((state) => state.saveFormFields, shallow);
  const runQuery = useStore((state) => state.queryPanel.runQuery, shallow);
  const getExposedValueOfQuery = useStore((state) => state.getExposedValueOfQuery, shallow);

  // Additional store selectors needed for performColumnMapping
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const getComponentDefinition = useStore((state) => state.getComponentDefinition, shallow);
  const performBatchComponentOperations = useStore((state) => state.performBatchComponentOperations, shallow);
  const formFields = useStore((state) => state.getFormFields(component.id), shallow);

  const [source, setSource] = useState({
    value: component.component.definition.properties?.generateFormFrom?.value,
    fxActive: component.component.definition.properties?.generateFormFrom?.fxActive,
  });

  const fields = component.component.definition.properties?.fields;

  // Added this to backfill fields if not present
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
    saveFormFields(component.id, newFields);
  }

  const resolvedSource = resolveReferences(
    'canvas',
    component.component.definition.properties?.generateFormFrom?.value
  );

  const [JSONData, setJSONData] = useState({
    value: resolvedSource === 'rawJson' ? component.component.definition.properties?.JSONData?.value : resolvedSource,
  });
  const [openModal, setOpenModal] = useState(false);
  const [codeEditorView, setCodeEditorView] = useState(null);
  const shouldFocusJSONDataEditor = useRef(false);
  const currentStatusRef = useRef(null);
  const shouldInvokeBlurEvent = useRef(false);
  const savedSourceValue = useRef(component.component.definition.properties?.generateFormFrom?.value);

  useEffect(() => {
    if (codeEditorView && shouldFocusJSONDataEditor.current) {
      // Focus the codehinter only when the user changes the generateForm dropdown to rawJson
      codeEditorView.focus();
    }
  }, [codeEditorView, shouldFocusJSONDataEditor]);

  useEffect(() => {
    if (shouldInvokeBlurEvent.current) {
      shouldInvokeBlurEvent.current = false;
      handleJSONDataBlur(JSONData.value);
    }
  }, [shouldInvokeBlurEvent, JSONData]);

  // Get form data and process it
  const existingData = getFormDataSectionData(component?.id);
  let isFormGenerated = existingData?.generateFormFrom?.value ?? false;
  isFormGenerated = isFormGenerated !== 'jsonSchema';

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

  // Perform column mapping function
  const performColumnMapping = (columns, isSingleUpdate = false) => {
    const newColumns = isSingleUpdate ? formFields.filter((field) => field.componentId !== columns[0].componentId) : [];
    let operations = {
        updated: {},
        added: {},
        deleted: [],
      },
      componentsToBeRemoved = [];

    const isFormRegeneration = isFormGenerated && currentStatusRef.current === FORM_STATUS.GENERATE_FIELDS;

    if (isFormRegeneration) {
      formFields.forEach((field) => {
        if (!field.isCustomField) {
          componentsToBeRemoved.push(field.componentId);
          operations.deleted.push(field.componentId);
        } else {
          newColumns.push(field);
        }
      });
    } else if (currentStatusRef.current === FORM_STATUS.GENERATE_FIELDS) {
      newColumns.push(...formFields);
    } else {
      if (currentStatusRef.current === FORM_STATUS.REFRESH_FIELDS) {
        formFields.forEach((field) => {
          if (field.isCustomField) {
            newColumns.push(field);
          }
        });
      }
      columns.forEach((column) => {
        if (column.isRemoved) {
          componentsToBeRemoved.push(column.componentId);
        }
      });
    }

    const childComponents = getChildComponents(component?.id);
    // Get the last position of the child components
    const nextElementsTop = findNextElementTop(childComponents, currentLayout, componentsToBeRemoved);
    // Create form field components from columns

    if (columns && Array.isArray(columns) && columns.length > 0) {
      let nextTop = nextElementsTop + COMPONENT_LAYOUT_DETAILS.spacing;

      columns.forEach((column, index) => {
        if (column.isRemoved) return operations.deleted.push(column.componentId);

        if (currentStatusRef.current === FORM_STATUS.REFRESH_FIELDS) {
          delete column.isRemoved;
          delete column.isNew;
          delete column.isExisting;
          if (
            isEqual(
              column,
              formFieldsWithComponentDefinition.find((field) => field.componentId === column.componentId)
            )
          ) {
            return newColumns.push(column);
          }
        }

        if (
          currentStatusRef.current === FORM_STATUS.MANAGE_FIELDS &&
          isEqual(
            column,
            formFieldsWithComponentDefinition.find((field) => field.componentId === column.componentId)
          )
        ) {
          return newColumns.push(column);
        }

        const {
          added = {},
          updated = {},
          deleted = false,
        } = updateFormFieldComponent(column, {}, component.id, nextTop);

        if (Object.keys(updated).length !== 0) {
          operations.updated[column.componentId] = updated;
          newColumns.push(column);
        }
        if (Object.keys(added).length !== 0) {
          operations.added[added.id] = added;
          if (added.component.component === 'Checkbox') {
            nextTop = nextTop + added.layouts['desktop'].height + 10;
          } else {
            nextTop = nextTop + added.layouts['desktop'].height + COMPONENT_LAYOUT_DETAILS.spacing;
          }

          // Create simplified column structure with only the required fields
          const simplifiedColumn = {
            componentId: added.id,
            isCustomField: column.isCustomField ?? false,
            dataType: column.dataType,
            key: column.key || column.name,
          };

          columns[index] = simplifiedColumn; // Replace with simplified structure
          newColumns.push(simplifiedColumn);
        }
        if (deleted) {
          operations.deleted.push(column.componentId);
        }
      });

      if (
        Object.keys(operations.updated).length > 0 ||
        Object.keys(operations.added).length > 0 ||
        operations.deleted.length > 0
      ) {
        performBatchComponentOperations(operations);
        saveDataSection(cleanupFormFields(newColumns));
        if (openModal) setOpenModal(false);
      }
    }
  };

  const tempComponentMeta = deepClone(componentMeta);

  let properties = [];
  let additionalActions = [];
  let dataProperties = [];
  let deprecatedProperties = [];

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  const resolvedCustomSchema = resolveReferences('canvas', component.component.definition.properties.advanced.value);

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'data') {
      dataProperties.push(key);
    } else if (componentMeta?.properties[key]?.section === 'deprecated') {
      deprecatedProperties.push(key);
    } else {
      // Skip the fields property as it is handled separately
      if (key === 'fields') continue;
      properties.push(key);
    }
  }

  const { id } = component;
  const newOptions = [{ name: 'None', value: 'none' }];

  Object.entries(allComponents).forEach(([componentId, _component]) => {
    const validParent =
      _component.component.parent === id ||
      _component.component.parent === `${id}-footer` ||
      _component.component.parent === `${id}-header`;
    if (validParent && _component?.component?.component === 'Button') {
      newOptions.push({ name: _component.component.name, value: componentId });
    }
  });

  tempComponentMeta.properties.buttonToSubmit.options = newOptions;

  // Hide header footer if custom schema is turned on

  if (resolvedCustomSchema) {
    component.component.properties.showHeader = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
    component.component.properties.showFooter = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
  }

  const paramUpdatedInterceptor = async (param, attr, value, paramType, ...restArgs) => {
    // Need not to auto save if the param is JSONData and generateFormFrom is rawJson
    // Saving will happen when they either click the Generate Form button or Refresh data button
    if (param?.name === 'generateFormFrom') {
      shouldFocusJSONDataEditor.current = false;
      if (attr === 'value') {
        const res = extractAndReplaceReferencesFromString(value, componentNameIdMapping, queryNameIdMapping);
        let { valueWithId: selectedQuery, allRefs, valueWithBrackets } = res;
        const { generateFormFrom, JSONData } = getFormDataSectionData(component?.id);
        if (value === generateFormFrom?.value) {
          return setJSONData({ value: JSONData.value });
        }
        if (value === 'jsonSchema') {
          setSource({ value: 'jsonSchema' });
          savedSourceValue.current = 'jsonSchema';
          return paramUpdated(param, attr, value, paramType, ...restArgs);
        }
        if (value !== 'rawJson' && value !== 'jsonSchema') {
          const queryId = allRefs[0]?.entityNameOrId;
          const resolvedValueofQuery = getExposedValueOfQuery(queryId, 'canvas');

          const hasMetadata =
            resolvedValueofQuery && typeof resolvedValueofQuery === 'object' && 'metadata' in resolvedValueofQuery;

          // Set the source value to the selected query until the query is run
          setSource((prev) => ({ ...prev, value: selectedQuery }));

          let resolvedValue;

          if (!hasMetadata && queryId && runQuery) {
            await runQuery(queryId, '', false, 'edit');
          }
          resolvedValue = resolveReferences('canvas', valueWithBrackets);
          // debugger;

          if (!source?.fxActive) {
            const transformedData = findFirstKeyValuePairWithPath(resolvedValue, selectedQuery);
            setJSONData({ value: transformedData.value });
            setOpenModal(true);
            return setSource((prev) => ({ ...prev, value: transformedData.path }));
          }
          setJSONData({ value: resolvedValue });
          setOpenModal(true);
        } else if (value === 'rawJson') {
          shouldFocusJSONDataEditor.current = true;
          // setJSONData({
          //   value:
          //     "{{{ 'name': 'John Doe', 'age': 35, 'isActive': true, 'dob': '01-01-1990', 'hobbies': ['reading', 'gaming', 'cycling'], 'address': { 'street': '123 Main Street', 'city': 'New York' } }}}",
          // });
          setJSONData({
            value: "{{{ 'name': 'John Doe', 'age': 35 }}}",
          });
          return setSource((prev) => ({ ...prev, value }));
        }
        setSource((prev) => ({ ...prev, value: selectedQuery }));
      } else if (attr === 'fxActive') {
        setSource((prev) => ({ ...prev, fxActive: value }));
      }
      return;
    }
    if (param.name === 'JSONData') {
      if (attr === 'value') {
        if (source.value === 'rawJson') {
          shouldInvokeBlurEvent.current = true;
        }
        setJSONData({ value });
      }
      return;
    }

    paramUpdated(param, attr, value, paramType, ...restArgs);
  };

  const saveDataSection = (fields) => {
    savedSourceValue.current = source.value;
    saveFormDataSectionData(
      component?.id,
      {
        generateFormFrom: source,
        JSONData: JSONData,
      },
      fields
    );
  };

  // Add function to handle JSONData blur for rawJson mode
  const handleJSONDataBlur = async (newJSONValue = null) => {
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
      const jsonDifferences = analyzeJsonDifferences(resolvedNewJSONValue, existingResolvedJsonData);

      const mergedJsonData = merge({}, existingResolvedJsonData, resolvedNewJSONValue);
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

  const renderDataElement = () => {
    return (
      <div className={`${resolvedCustomSchema ? 'tw-pointer-events-none opacity-60' : ''}`}>
        {dataProperties?.map((property) => {
          // Mutating the component definition properties to set the generateFormFrom source as we're not saving it to DB unless the user clicks the Generate Form/Refersh data button
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
            performColumnMapping={performColumnMapping}
            // refreshData={refreshData}
            newResolvedJsonData={resolveReferences('canvas', JSONData.value)}
            existingResolvedJsonData={existingResolvedJsonData}
            savedSourceValue={savedSourceValue.current}
          />
        )}
      </div>
    );
  };

  const accordionItems = baseComponentProperties(
    properties,
    events,
    component,
    tempComponentMeta,
    layoutPropertyChanged,
    paramUpdated,
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
    resolvedCustomSchema,
    renderDataElement
  );

  return (
    <>
      <Accordion items={accordionItems} />
    </>
  );
};

export const baseComponentProperties = (
  properties,
  events,
  component,
  componentMeta,
  layoutPropertyChanged,
  paramUpdated,
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
  resolvedCustomSchema,
  renderDataElement
) => {
  let items = [];

  if (properties.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.structure', 'Structure')}`,
      children: properties.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'properties',
          currentState,
          allComponents,
          darkMode
        )
      ),
    });
  }

  // if (!resolvedCustomSchema) {
  items.push({
    title: 'Data',
    isOpen: true,
    children: renderDataElement(),
  });
  // }

  if (events.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.events', 'Events')}`,
      isOpen: true,
      children: (
        <EventManager
          sourceId={component?.id}
          eventSourceType="component"
          eventMetaDefinition={componentMeta}
          currentState={currentState}
          dataQueries={dataQueries}
          components={allComponents}
          eventsChanged={eventsChanged}
          apps={apps}
          darkMode={darkMode}
          pages={pages}
        />
      ),
    });
  }

  items.push({
    title: 'Additional actions',
    isOpen: true,
    children: additionalActions?.map((property) =>
      renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        property,
        'properties',
        currentState,
        allComponents,
        darkMode
      )
    ),
  });

  if (validations.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.validation', 'Validation')}`,
      children: validations.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'validation',
          currentState,
          allComponents,
          darkMode
        )
      ),
    });
  }

  items.push({
    title: `${i18next.t('widget.common.devices', 'Devices')}`,
    isOpen: true,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnDesktop',
          'others',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnMobile',
          'others',
          currentState,
          allComponents
        )}
      </>
    ),
  });

  items.push({
    title: 'Deprecated',
    isOpen: true,
    children: deprecatedProperties?.map((property) =>
      renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        property,
        'properties',
        currentState,
        allComponents,
        darkMode
      )
    ),
  });

  return items;
};
