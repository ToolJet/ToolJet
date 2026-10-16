import React, { useState } from 'react';
import { SortableTree as SharedSortableTree } from '@/_ui/SortableTree';
import { TreeSelectItem } from '../TreeSelectItem';
import { TreeSelectItemGhost } from './TreeSelectItemGhost';

const PROPERTY_NAMES = {
  isGroup: 'hasChildren',
  parentId: 'parentValue',
};

// The node with this value and its ancestors, outermost first; null if it's not in the tree.
const findPath = (items = [], value, path = []) => {
  for (const item of items) {
    if (String(item.value) === value) return [...path, item];
    const found = findPath(item.children, value, [...path, item]);
    if (found) return found;
  }
  return null;
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
  showSelectionFields = true,
  componentId,
}) {
  // Shared popover state: { id, type } or null
  const [activePopover, setActivePopover] = useState(null);
  // Ancestors of the node whose popover is open stay expanded, so its row is rendered to anchor it.
  const openPath = activePopover ? findPath(treeItems, String(activePopover.id)) : null;
  const openAncestors = new Set((openPath ?? []).slice(0, -1).map((item) => item.value));

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
        showSelectionFields={showSelectionFields}
      />
    );
  };

  const renderGhost = (item) => <TreeSelectItemGhost darkMode={darkMode} item={item} />;

  // Recursively transform items to add hasChildren flag and id for SortableTree
  const transformItem = (item) => ({
    ...item,
    id: item.value,
    ...(openAncestors.has(item.value) && { collapsed: false }),
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
