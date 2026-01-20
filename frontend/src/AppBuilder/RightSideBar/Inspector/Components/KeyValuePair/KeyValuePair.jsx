import React, { useCallback, useMemo } from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../../Utils';
import { resolveReferences } from '@/_helpers/utils';
import Popover from 'react-bootstrap/Popover';
import { EventManager } from '../../EventManager';
import { useTranslation } from 'react-i18next';
import { FieldPopoverContent, FieldsList } from './FieldManager';
import { useFieldManager, usePopoverState } from './hooks';

// Constants
const ADDITIONAL_ACTIONS = ['loadingState', 'visibility', 'disabledState', 'tooltip'];

export const KeyValuePair = (props) => {
  const {
    dataQueries,
    component,
    paramUpdated,
    componentMeta,
    components,
    currentState,
    darkMode,
    eventsChanged,
    apps,
    pages,
    layoutPropertyChanged,
  } = props;

  const { t } = useTranslation();

  // Custom hooks for state management
  const {
    fields,
    filteredFields,
    isAllFieldsEditable,
    addField,
    removeField,
    duplicateField,
    reorderFields,
    updateFieldProperty,
    updateFieldEvents,
    setAllFieldsEditable,
  } = useFieldManager({ component, paramUpdated, currentState });

  const {
    activeIndex: activeFieldPopoverIndex,
    isRootCloseEnabled,
    togglePopover,
    setRootCloseBlocker,
  } = usePopoverState();

  // Derived state
  const useDynamicField = useMemo(() => {
    const value = component.component.definition.properties.useDynamicField?.value;
    return value ? resolveReferences(value) ?? false : false;
  }, [component.component.definition.properties.useDynamicField?.value]);

  // Event handlers
  const handleDragEnd = useCallback(
    ({ source, destination }) => {
      if (!destination || source?.index === destination?.index) return;
      reorderFields(source.index, destination.index);
    },
    [reorderFields]
  );

  const handleFieldEventChange = useCallback(
    (field, events) => updateFieldEvents(field.id, events),
    [updateFieldEvents]
  );

  const getPopoverFieldSource = useCallback(
    (field, fieldName) => `component/${component.component.name}/${field ?? 'default'}::${fieldName}`,
    [component.component.name]
  );

  // Render helpers
  const renderCustomElement = useCallback(
    (param, paramType = 'properties') =>
      renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType),
    [component, componentMeta, paramUpdated, dataQueries]
  );

  const renderFieldPopover = useCallback(
    (field, index) => (
      <Popover
        id="popover-basic-2"
        className={`${darkMode && 'dark-theme'} shadow table-column-popover`}
        style={{
          width: '280px',
          maxHeight: resolveReferences(field.isEditable) ? '100vh' : 'inherit',
          zIndex: '9999',
        }}
      >
        <FieldPopoverContent
          field={field}
          index={index}
          darkMode={darkMode}
          currentState={currentState}
          onFieldItemChange={updateFieldProperty}
          getPopoverFieldSource={getPopoverFieldSource}
          setFieldPopoverRootCloseBlocker={setRootCloseBlocker}
          component={component}
          props={props}
          fieldEventChanged={handleFieldEventChange}
        />
      </Popover>
    ),
    [
      darkMode,
      currentState,
      updateFieldProperty,
      getPopoverFieldSource,
      setRootCloseBlocker,
      component,
      props,
      handleFieldEventChange,
    ]
  );

  // Accordion sections
  const accordionItems = useMemo(
    () => [
      // Data section
      {
        title: 'Data',
        children: (
          <>
            {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'dataSourceSelector',
              'properties',
              currentState,
              components,
              darkMode,
              false
            )}
            {/* {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'fieldDynamicData',
              'properties',
              currentState,
              components,
              darkMode,
              false
            )} */}
            {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'data',
              'properties',
              currentState,
              components,
              darkMode,
              false
            )}
          </>
        ),
      },
      // Fields section
      {
        title: 'Fields',
        children: (
          <div>
            <div>{renderCustomElement('useDynamicField')}</div>
            {useDynamicField && <div>{renderCustomElement('fieldDynamicData')}</div>}
            {!useDynamicField && (
              <FieldsList
                filteredFields={filteredFields}
                fields={fields}
                activeFieldPopoverIndex={activeFieldPopoverIndex}
                isRootCloseEnabled={isRootCloseEnabled}
                isAllFieldsEditable={isAllFieldsEditable}
                darkMode={darkMode}
                currentState={currentState}
                component={component}
                onDragEnd={handleDragEnd}
                onRemove={removeField}
                onDuplicate={duplicateField}
                onAdd={addField}
                onTogglePopover={togglePopover}
                onSetAllEditable={setAllFieldsEditable}
                renderFieldPopover={renderFieldPopover}
                t={t}
              />
            )}
          </div>
        ),
      },
      // Events section
      {
        title: 'Events',
        isOpen: true,
        children: (
          <EventManager
            component={component}
            sourceId={component?.id}
            eventSourceType="component"
            eventMetaDefinition={componentMeta}
            currentState={currentState}
            dataQueries={dataQueries}
            components={components}
            eventsChanged={eventsChanged}
            apps={apps}
            pages={pages}
          />
        ),
      },
      // Additional actions section
      {
        title: 'Additional actions',
        children: ADDITIONAL_ACTIONS.map((option) => renderCustomElement(option)),
      },
      // Devices section
      {
        title: 'Devices',
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
              components
            )}
            {renderElement(
              component,
              componentMeta,
              layoutPropertyChanged,
              dataQueries,
              'showOnMobile',
              'others',
              currentState,
              components
            )}
          </>
        ),
      },
    ],
    [
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      currentState,
      components,
      darkMode,
      renderCustomElement,
      useDynamicField,
      filteredFields,
      fields,
      activeFieldPopoverIndex,
      isRootCloseEnabled,
      isAllFieldsEditable,
      handleDragEnd,
      removeField,
      duplicateField,
      addField,
      togglePopover,
      setAllFieldsEditable,
      renderFieldPopover,
      t,
      eventsChanged,
      apps,
      pages,
      layoutPropertyChanged,
    ]
  );

  return <Accordion items={accordionItems} />;
};
