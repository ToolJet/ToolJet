import React, { useMemo, useRef, useCallback } from 'react';
import _ from 'lodash';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { SortableTree as SharedSortableTree, buildTree, flattenTree } from '@/_ui/SortableTree';
import { PageMenuItemGhost } from '../PageMenuItemGhost';
import { PageMenuItem } from '../PageMenuItem';
import { PageGroupItem } from '../PageGroupItem';

const PROPERTY_NAMES = {
  isGroup: 'isPageGroup',
  parentId: 'pageGroupId',
};

export function SortableTree({ collapsible, indicator = false, indentationWidth = 15, darkMode, treeRef }) {
  const reorderPages = useStore((state) => state.reorderPages);
  const debouncedReorderPages = useRef(_.debounce(reorderPages, 500)).current;

  const allpages = useStore((state) => _.get(state, 'modules.canvas.pages', []), shallow);

  // Convert flat store data to tree form for the shared component
  const treeItems = useMemo(() => buildTree(allpages, PROPERTY_NAMES), [allpages]);

  // When reorder happens, flatten and persist via debounced store action
  const handleReorder = useCallback((newTreeItems) => {
    const flatItems = flattenTree(newTreeItems, PROPERTY_NAMES);
    debouncedReorderPages(flatItems);
  }, [debouncedReorderPages]);

  const renderItem = useCallback((item, props) => {
    if (!item?.isPageGroup) {
      return (
        <PageMenuItem darkMode={darkMode} page={item} treeRef={treeRef} />
      );
    }
    return (
      <PageGroupItem
        darkMode={darkMode}
        highlight={props.isHighlighted}
        collapsed={props.collapsed}
        onCollapse={props.onCollapse}
        page={item}
        treeRef={treeRef}
      />
    );
  }, [darkMode, treeRef]);

  const renderGhost = useCallback((item) => (
    <PageMenuItemGhost darkMode={darkMode} page={item} />
  ), [darkMode]);

  return (
    <SharedSortableTree
      items={treeItems}
      onReorder={handleReorder}
      propertyNames={PROPERTY_NAMES}
      renderItem={renderItem}
      renderGhost={renderGhost}
      collapsible={collapsible}
      indicator={indicator}
      indentationWidth={indentationWidth}
      darkMode={darkMode}
      handlerClassName="page-handler"
      nestedStyle={{
        borderLeft: '1px dashed var(--icon-weak)',
        padding: '0 0 0 15px',
      }}
    />
  );
}
