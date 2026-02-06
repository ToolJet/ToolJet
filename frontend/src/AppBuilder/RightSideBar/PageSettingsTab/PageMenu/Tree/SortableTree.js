import React from 'react';
import _ from 'lodash';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { SortableTree as BaseSortableTree, flattenTree } from '@/_ui/SortableTree';
import { PageMenuItemGhost } from '../PageMenuItemGhost';
import { PageMenuItem } from '../PageMenuItem';
import { PageGroupItem } from '../PageGroupItem';

// Property names used by PageMenu
const PROPERTY_NAMES = {
  isGroup: 'isPageGroup',
  parentId: 'pageGroupId',
};

/**
 * PageMenu's SortableTree wrapper
 * Uses the shared SortableTree library with PageMenu-specific rendering
 */
export function SortableTree({ collapsible = true, indicator = false, indentationWidth = 15, darkMode, treeRef }) {
  const reorderPages = useStore((state) => state.reorderPages);
  const debouncedReorderPages = React.useMemo(() => _.debounce(reorderPages, 500), [reorderPages]);

  const allpages = useStore((state) => _.get(state, 'modules.canvas.pages', []), shallow);

  // Handle reorder - convert tree items back to flat format for the store
  const handleReorder = React.useCallback(
    (treeItems) => {
      const flatItems = flattenTree(treeItems, PROPERTY_NAMES);
      debouncedReorderPages(flatItems);
    },
    [debouncedReorderPages]
  );

  // Render function for tree items
  const renderItem = React.useCallback(
    (page, itemProps) => {
      const { isHighlighted, collapsed, onCollapse, ...restProps } = itemProps;

      if (page?.isPageGroup) {
        return (
          <PageGroupItem
            page={page}
            darkMode={darkMode}
            highlight={isHighlighted}
            collapsed={collapsed}
            onCollapse={onCollapse}
            treeRef={treeRef}
            {...restProps}
          />
        );
      }

      return <PageMenuItem page={page} darkMode={darkMode} treeRef={treeRef} {...restProps} />;
    },
    [darkMode, treeRef]
  );

  // Render function for drag ghost
  const renderGhost = React.useCallback(
    (page) => {
      return <PageMenuItemGhost page={page} darkMode={darkMode} />;
    },
    [darkMode]
  );

  return (
    <BaseSortableTree
      items={allpages}
      onReorder={handleReorder}
      renderItem={renderItem}
      renderGhost={renderGhost}
      propertyNames={PROPERTY_NAMES}
      collapsible={collapsible}
      indicator={indicator}
      indentationWidth={indentationWidth}
      darkMode={darkMode}
    />
  );
}
