import React, { useState } from 'react';
import { SortableTree as SharedSortableTree } from '@/_ui/SortableTree';
import { TreeSelectItem } from '../TreeSelectItem';
import { TreeSelectItemGhost } from './TreeSelectItemGhost';

const PROPERTY_NAMES = {
  isGroup: 'hasChildren',
  parentId: 'parentValue',
};

export function TreeSelectSortableTree({
  treeItems,
  onReorder,
  onDeleteItem,
  onItemChange,
  onAddNestedItem,
  getResolvedValue,
  collapsible = true,
  indicator = true,
  indentationWidth = 15,
  darkMode,
}) {
  // Shared popover state: { id, type } or null
  const [activePopover, setActivePopover] = useState(null);

  const renderItem = (item) => {
    return (
      <TreeSelectItem
        darkMode={darkMode}
        item={item}
        onDeleteItem={onDeleteItem}
        onItemChange={onItemChange}
        onAddNestedItem={onAddNestedItem}
        getResolvedValue={getResolvedValue}
        activePopover={activePopover}
        setActivePopover={setActivePopover}
      />
    );
  };

  const renderGhost = (item) => <TreeSelectItemGhost darkMode={darkMode} item={item} />;

  // Recursively transform items to add hasChildren flag and id for SortableTree
  const transformItem = (item) => ({
    ...item,
    id: item.value,
    hasChildren: item.children && item.children.length > 0,
    children: item.children ? item.children.map(transformItem) : undefined,
  });

  const transformedItems = treeItems.map(transformItem);

  return (
    <SharedSortableTree
      items={transformedItems}
      onReorder={onReorder}
      propertyNames={PROPERTY_NAMES}
      renderItem={renderItem}
      renderGhost={renderGhost}
      collapsible={collapsible}
      indicator={indicator}
      indentationWidth={indentationWidth}
      maxDepth={Infinity}
      darkMode={darkMode}
      handlerClassName="treeselect-handler"
      containerElement="ul"
    />
  );
}
