import React from 'react';
import { renderElement } from '../../Utils';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { TreeSelectOptionsList } from './components';
import { useTreeSelectItemsManager } from './hooks';
import './treeSelect.scss';

export const TreeSelect = ({ componentMeta, darkMode, ...restProps }) => {
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

  // Use the custom hook for tree items management
  const {
    treeItems,
    hoveredItemIndex,
    setHoveredItemIndex,
    expandedItems,
    toggleItemExpanded,
    handleItemChange,
    handleDeleteItem,
    handleAddItem,
    handleAddNestedItem,
    handleReorder,
    getResolvedValue,
  } = useTreeSelectItemsManager(component, paramUpdated);

  // Property organization
  let properties = [];
  let additionalActions = [];
  let optionsProperties = [];
  let dataProperties = [];

  for (const [key] of Object.entries(componentMeta?.properties || {})) {
    const prop = componentMeta?.properties[key];
    if (prop?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (prop?.accordian === 'Options') {
      optionsProperties.push(key);
    } else if (prop?.accordian === 'Data') {
      dataProperties.push(key);
    } else {
      properties.push(key);
    }
  }

  // Render tree items list
  const _renderTreeItems = () => {
    return (
      <TreeSelectOptionsList
        treeItems={treeItems}
        darkMode={darkMode}
        hoveredItemIndex={hoveredItemIndex}
        onMouseEnter={setHoveredItemIndex}
        onMouseLeave={() => setHoveredItemIndex(null)}
        onDeleteItem={handleDeleteItem}
        onItemChange={handleItemChange}
        onAddItem={handleAddItem}
        onAddNestedItem={handleAddNestedItem}
        onReorder={handleReorder}
        getResolvedValue={getResolvedValue}
        expandedItems={expandedItems}
        onToggleExpand={toggleItemExpanded}
        {...restProps}
      />
    );
  };

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

  // Check if dynamic options is enabled
  const isAdvanced = getResolvedValue(component?.component?.definition?.properties?.advanced?.value);

  // Section configurations
  const sections = [
    {
      title: 'Data',
      type: 'properties',
      properties: dataProperties,
    },
    {
      title: 'Options',
      custom: () => (
        <>
          {createRenderElement('advanced')}
          {isAdvanced && createRenderElement('data')}
          {!isAdvanced && _renderTreeItems()}
          {createRenderElement('allowIndependentSelection')}
          {createRenderElement('checkedData')}
          {createRenderElement('expandedData')}
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
      title: 'Validation',
      custom: () => (
        <>
          {Object.keys(componentMeta?.validation || {}).map((property) => createRenderElement(property, 'validation'))}
        </>
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
      return createAccordionItem(section.title, section.custom(), section.isOpen);
    }

    const children = section.properties.map((property) => {
      const extraProps = section.extraProps ? section.extraProps(property) : {};
      return createRenderElement(property, section.type, extraProps);
    });

    return createAccordionItem(section.title, children);
  });

  return <Accordion items={items} />;
};
