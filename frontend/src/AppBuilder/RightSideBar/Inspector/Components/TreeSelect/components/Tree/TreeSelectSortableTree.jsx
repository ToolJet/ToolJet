import React from 'react';
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
  const renderItem = (item) => {
    return (
      <TreeSelectItem
        darkMode={darkMode}
        item={item}
        onDeleteItem={onDeleteItem}
        onItemChange={onItemChange}
        onAddNestedItem={onAddNestedItem}
        getResolvedValue={getResolvedValue}
      />
    );
  };

  const renderGhost = (item) => <TreeSelectItemGhost darkMode={darkMode} item={item} />;

  // Transform items to add hasChildren flag for SortableTree
  const transformedItems = treeItems.map((item) => ({
    ...item,
    id: item.value,
    hasChildren: item.children && item.children.length > 0,
    children: item.children
      ? item.children.map((child) => ({
          ...child,
          id: child.value,
          hasChildren: child.children && child.children.length > 0,
          children: child.children
            ? child.children.map((grandchild) => ({
                ...grandchild,
                id: grandchild.value,
                hasChildren: false,
              }))
            : undefined,
        }))
      : undefined,
  }));

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
      darkMode={darkMode}
      handlerClassName="treeselect-handler"
      containerElement="ul"
    />
  );
}
