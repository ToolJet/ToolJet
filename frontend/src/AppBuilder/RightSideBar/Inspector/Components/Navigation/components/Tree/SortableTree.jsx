import React from 'react';
import { SortableTree as SharedSortableTree } from '@/_ui/SortableTree';
import { MenuItem } from '../MenuItem';
import { GroupMenuItem } from '../GroupMenuItem';
import { NavMenuItemGhost } from './NavMenuItemGhost';

const PROPERTY_NAMES = {
  isGroup: 'isGroup',
  parentId: 'parentId',
};

export function SortableTree({
  menuItems,
  onReorder,
  onDeleteItem,
  onItemChange,
  getResolvedValue,
  collapsible = true,
  indicator = true,
  indentationWidth = 15,
  darkMode,
}) {
  const renderItem = (item, props) => {
    if (!item?.isGroup) {
      return (
        <MenuItem
          darkMode={darkMode}
          item={item}
          onDeleteItem={onDeleteItem}
          onItemChange={onItemChange}
          getResolvedValue={getResolvedValue}
        />
      );
    }
    return (
      <GroupMenuItem
        darkMode={darkMode}
        item={item}
        highlight={props.isHighlighted}
        collapsed={props.collapsed}
        onCollapse={props.onCollapse}
        onDeleteItem={onDeleteItem}
        onItemChange={onItemChange}
        getResolvedValue={getResolvedValue}
      />
    );
  };

  const renderGhost = (item) => (
    <NavMenuItemGhost darkMode={darkMode} item={item} getResolvedValue={getResolvedValue} />
  );

  return (
    <SharedSortableTree
      items={menuItems}
      onReorder={onReorder}
      propertyNames={PROPERTY_NAMES}
      renderItem={renderItem}
      renderGhost={renderGhost}
      collapsible={collapsible}
      indicator={indicator}
      indentationWidth={indentationWidth}
      darkMode={darkMode}
      handlerClassName="nav-handler"
      containerElement="ul"
    />
  );
}
