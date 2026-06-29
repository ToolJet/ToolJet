import React from 'react';
import { renderElement } from '../../Utils';
import Accordion from '@/AppBuilder/RightSideBar/Inspector/InspectorAccordion';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '../../inspectorConstants';
import { EventManager } from '../../EventManager';
import { TreeSelectOptionsList } from '../TreeSelect/components';
import { useTreeSelectItemsManager } from '../TreeSelect/hooks';
import '../TreeSelect/treeSelect.scss';

export const Cascader = ({ componentMeta, darkMode, ...restProps }) => {
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

  // Reuse the Tree Select nested-options editor (selection-state fields hidden).
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
  let additionalActions = [];
  let dataProperties = [];

  for (const [key] of Object.entries(componentMeta?.properties || {})) {
    const prop = componentMeta?.properties[key];
    if (prop?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (prop?.accordian === 'Data') {
      dataProperties.push(key);
    }
  }

  const _renderTreeItems = () => (
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
      showSelectionFields={false}
      {...restProps}
    />
  );

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

  const createAccordionItem = (title, children, isOpen = true, id) => ({ id, title, isOpen, children });

  const isAdvanced = getResolvedValue(component?.component?.definition?.properties?.advanced?.value);

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
          {isAdvanced ? createRenderElement('data') : _renderTreeItems()}
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
      title: 'Validation',
      custom: () => (
        <>
          {Object.keys(componentMeta?.validation || {}).map((property) => createRenderElement(property, 'validation'))}
        </>
      ),
    },
    {
      id: ADDITIONAL_ACTIONS_ACCORDION_ID,
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

  const items = sections.map((section) => {
    if (section.custom) {
      return createAccordionItem(section.title, section.custom(), section.isOpen, section.id);
    }
    const children = section.properties.map((property) => {
      const extraProps = section.extraProps ? section.extraProps(property) : {};
      return createRenderElement(property, section.type, extraProps);
    });
    return createAccordionItem(section.title, children, section.isOpen, section.id);
  });

  return <Accordion items={items} />;
};
