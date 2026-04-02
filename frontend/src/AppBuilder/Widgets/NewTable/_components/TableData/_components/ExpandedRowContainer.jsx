import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const DEFAULT_EXPANSION_HEIGHT = 250;

export const ExpandedRowContainer = ({
  tableId,
  rowIndex,
  top,
  darkMode,
  canvasWidth,
  expansionHeight = DEFAULT_EXPANSION_HEIGHT,
  dynamicHeightForExpansion,
  measureElement,
  virtualItemIndex,
}) => {
  const parentContext = useSubcontainerContext();

  const contextValue = useMemo(
    () => ({
      contextPath: [...parentContext.contextPath, { containerId: tableId, index: rowIndex }],
    }),
    [parentContext.contextPath, tableId, rowIndex]
  );

  // When dynamic height is enabled, read temporaryLayouts for this row's children from the main store.
  // Updated heights of inner widgets with dynamicHeightd is saved under temporaryLayouts[childId-rowIndex]
  // We select the max bottom across all updated children and derive the needed height for the expansion row.
  const computedHeight = useStore((state) => {
    if (!dynamicHeightForExpansion) return expansionHeight;
    const children = state.containerChildrenMapping[tableId] || [];
    let maxBottom = 0;
    for (const childId of children) {
      const layout = state.temporaryLayouts[`${childId}-${rowIndex}`];
      if (layout) maxBottom = Math.max(maxBottom, layout.top + layout.height);
    }
    return maxBottom > 0 ? Math.max(maxBottom + 50, expansionHeight) : expansionHeight;
  }, shallow);

  // Hold the DOM node so we can re-register it with TanStack when the virtual index shifts (indices shift when rows above are expanded / collapsed)
  // ResizeObserver only fires on size change, not on data-index attribute change,
  // so after measure() clears itemSizeCache the stale old-index entry would cause overlap.
  // Calling measureElement(node) again forces TanStack to read the new data-index and call resizeItem(newIndex, actualHeight) → correct positions.
  const nodeRef = useRef(null);

  const trRef = useCallback(
    (node) => {
      nodeRef.current = node;
      if (measureElement) measureElement(node); // null on unmount → TanStack cleanup
    },
    [measureElement]
  );

  useEffect(() => {
    if (nodeRef.current && measureElement) {
      measureElement(nodeRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualItemIndex, measureElement]);

  return (
    <SubcontainerContext.Provider value={contextValue}>
      <tr
        className="table-expanded-row-container"
        ref={trRef}
        data-index={virtualItemIndex}
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: 0,
          width: '100%',
        }}
      >
        <div
          className="table-expanded-row-content"
          style={
            dynamicHeightForExpansion
              ? { width: `${canvasWidth}px`, height: `${computedHeight}px`, minHeight: `${expansionHeight}px` }
              : { width: `${canvasWidth}px`, height: `${expansionHeight}px` }
          }
        >
          <SubContainer
            id={tableId}
            index={rowIndex}
            canvasWidth={canvasWidth}
            darkMode={darkMode}
            componentType="Table"
          />
        </div>
      </tr>
    </SubcontainerContext.Provider>
  );
};
