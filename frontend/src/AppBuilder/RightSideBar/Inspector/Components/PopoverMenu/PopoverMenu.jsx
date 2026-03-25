import React from 'react';
import { renderElement } from '../../Utils';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { OptionsList } from './components';
import { useOptionsManager } from './hooks/useOptionsManager';
import { COMPONENT_INSPECTOR_CONFIG, DEFAULT_CONFIG } from './constants';
import './styles.scss';

export const PopoverMenu = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    dataQueries,
    paramUpdated,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    pages,
  } = restProps;

  const componentType = component?.component?.component;
  const config = { ...DEFAULT_CONFIG, ...COMPONENT_INSPECTOR_CONFIG[componentType] };

  // Use the custom hook for options management
  const {
    options,
    hoveredOptionIndex,
    setHoveredOptionIndex,
    handleOptionChange,
    handleDeleteOption,
    handleAddOption,
    onDragEnd,
    getItemStyle,
    getResolvedValue,
    isDynamicOptionsEnabled,
    handleDefaultChange,
  } = useOptionsManager(component, paramUpdated, config.optionLabelPrefix);

  // ===== PROPERTY ORGANIZATION =====
  const validations = Object.keys(componentMeta.validation || {});
  let properties = [];
  let additionalActions = [];
  let optionsProperties = [];

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.accordian === 'Options') {
      optionsProperties.push(key);
    } else {
      properties.push(key);
    }
  }

  // ===== RENDER FUNCTIONS =====
  const _renderOptions = () => {
    return (
      <OptionsList
        options={options}
        darkMode={darkMode}
        hoveredOptionIndex={hoveredOptionIndex}
        onMouseEnter={setHoveredOptionIndex}
        onMouseLeave={() => setHoveredOptionIndex(null)}
        onDeleteOption={handleDeleteOption}
        onOptionChange={handleOptionChange}
        onAddOption={handleAddOption}
        onDragEnd={onDragEnd}
        getResolvedValue={getResolvedValue}
        getItemStyle={getItemStyle}
        dataCyPrefix={config.dataCy}
        popoverFields={config.popoverFields}
        onDefaultChange={handleDefaultChange}
        {...restProps}
      />
    );
  };

  // ===== MAIN RENDER =====
  // Helper function to create renderElement with common parameters
  const createRenderElement = (property, type = 'properties', extraProps = {}) => {
    return renderElement(
      component,
      componentMeta,
      extraProps.paramUpdated || paramUpdated,
      dataQueries,
      property,
      type,
      currentState,
      allComponents,
      extraProps.darkMode || darkMode,
      extraProps.placeholder || ''
    );
  };

  // Helper function to create accordion items
  const createAccordionItem = (title, children, isOpen = true) => ({
    title,
    isOpen,
    children,
  });

  // Section configurations
  const mainProperties = properties.filter((property) => !optionsProperties.includes(property));

  const sections = [
    ...(!config.singleDataSection && mainProperties.length > 0
      ? [
          {
            title: config.propertiesAccordionTitle,
            type: 'properties',
            properties: mainProperties,
          },
        ]
      : []),
    {
      title: !config.singleDataSection ? config.optionsAccordionTitle || 'Options' : config.propertiesAccordionTitle,
      custom: () => (
        <>
          {createRenderElement('advanced')}
          {isDynamicOptionsEnabled ? (
            <>
              {createRenderElement('schema')}{' '}
              {optionsProperties.includes('optionsLoadingState') && createRenderElement('optionsLoadingState')}
            </>
          ) : (
            _renderOptions()
          )}
          {optionsProperties.includes('multiSelection') && createRenderElement('multiSelection')}
          {optionsProperties.includes('layout') && createRenderElement('layout')}
        </>
      ),
    },
    {
      title: 'Events',
      custom: () => (
        <EventManager
          sourceId={component?.id}
          eventSourceType="component"
          eventMetaDefinition={componentMeta}
          dataQueries={dataQueries}
          components={allComponents}
          eventsChanged={eventsChanged}
          apps={apps}
          darkMode={darkMode}
          pages={pages}
        />
      ),
    },
    ...(validations.length > 0
      ? [
          {
            title: 'Validation',
            type: 'validation',
            properties: validations,
            extraProps: (property) => ({
              placeholder: componentMeta.validation?.[property]?.placeholder,
            }),
          },
        ]
      : []),
    ...(additionalActions.length > 0
      ? [
          {
            title: 'Additional Actions',
            type: 'properties',
            properties: additionalActions,
            extraProps: (property) => ({
              placeholder: componentMeta.properties?.[property]?.placeholder,
            }),
          },
        ]
      : []),
    {
      title: 'Devices',
      type: 'others',
      properties: ['showOnDesktop', 'showOnMobile'],
      extraProps: () => ({ paramUpdated: layoutPropertyChanged }),
    },
  ];

  // Build accordion items
  const items = sections.map((section) => {
    if (section.custom) {
      return createAccordionItem(section.title, section.custom());
    }

    const children = section.properties.map((property) => {
      const extraProps = section.extraProps ? section.extraProps(property) : {};
      return createRenderElement(property, section.type, extraProps);
    });

    return createAccordionItem(section.title, children);
  });

  return <Accordion items={items} />;
};
