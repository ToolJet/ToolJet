import React, { useEffect, useMemo } from 'react';
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
  virtualizer,
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
  // We select the max bottom edge across all direct children and derive the needed height for the expansion row.
  // Falls back to the widget's configured canvas layout when temporaryLayouts has no entry yet
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

  // Single effect that covers every scenario requiring a virtualizer slot update
  useEffect(() => {
    virtualizer.resizeItem(virtualItemIndex, dynamicHeightForExpansion ? computedHeight : expansionHeight);
  }, [computedHeight, dynamicHeightForExpansion, expansionHeight, virtualizer, virtualItemIndex]);

  return (
    <SubcontainerContext.Provider value={contextValue}>
      <tr
        className="table-expanded-row-container"
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
