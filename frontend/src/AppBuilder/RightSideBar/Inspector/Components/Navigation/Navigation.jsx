import React from 'react';
import { renderElement } from '../../Utils';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { NavItemsList } from './components';
import { useMenuItemsManager } from './hooks';
import './styles.scss';

export const Navigation = ({ componentMeta, darkMode, ...restProps }) => {
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

  // Use the custom hook for menu items management
  const {
    menuItems,
    hoveredItemIndex,
    setHoveredItemIndex,
    expandedGroups,
    toggleGroupExpanded,
    handleItemChange,
    handleDeleteItem,
    handleAddItem,
    handleAddGroup,
    handleAddItemToGroup,
    handleReorder,
    getResolvedValue,
  } = useMenuItemsManager(component, paramUpdated);

  // Property organization
  let properties = [];
  let additionalActions = [];

  for (const [key] of Object.entries(componentMeta?.properties || {})) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else {
      properties.push(key);
    }
  }

  // Render menu items list
  const _renderMenuItems = () => {
    return (
      <NavItemsList
        menuItems={menuItems}
        darkMode={darkMode}
        hoveredItemIndex={hoveredItemIndex}
        onMouseEnter={setHoveredItemIndex}
        onMouseLeave={() => setHoveredItemIndex(null)}
        onDeleteItem={handleDeleteItem}
        onItemChange={handleItemChange}
        onAddItem={handleAddItem}
        onAddGroup={handleAddGroup}
        onAddItemToGroup={handleAddItemToGroup}
        onReorder={handleReorder}
        getResolvedValue={getResolvedValue}
        expandedGroups={expandedGroups}
        onToggleExpand={toggleGroupExpanded}
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

  // Section configurations
  const sections = [
    {
      title: 'Content',
      custom: () => (
        <>
          {_renderMenuItems()}
          {createRenderElement('orientation')}
          {createRenderElement('displayStyle')}
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
