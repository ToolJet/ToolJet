import React from 'react';
import { renderElement } from '../../Utils';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { OptionsList } from './components';
import { useOptionsManager } from './hooks/useOptionsManager';
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
  } = useOptionsManager(component, paramUpdated);

  // ===== PROPERTY ORGANIZATION =====
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
  const sections = [
    {
      title: 'Menu',
      type: 'properties',
      properties: properties.filter((property) => !optionsProperties.includes(property)),
    },
    {
      title: 'Options',
      custom: () => (
        <>
          {createRenderElement('advanced')}
          {isDynamicOptionsEnabled ? createRenderElement('schema') : _renderOptions()}
          {createRenderElement('optionsLoadingState')}
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
    {
      title: 'Additional Actions',
      type: 'properties',
      properties: additionalActions,
      extraProps: (property) => ({
        placeholder: componentMeta.properties?.[property]?.placeholder,
      }),
    },
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
