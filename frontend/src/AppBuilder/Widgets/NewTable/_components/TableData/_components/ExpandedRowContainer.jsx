import React, { useEffect, useMemo } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { DEFAULT_EXPANSION_HEIGHT } from '../../../_utils/helper';
import { CONTAINER_FORM_CANVAS_PADDING, BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

export const ExpandedRowContainer = ({
  tableId,
  rowIndex,
  top,
  darkMode,
  canvasWidth,
  measuredWidth,
  expansionHeight = DEFAULT_EXPANSION_HEIGHT,
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

  // Computed styles
  const containerBackgroundColor = useTableStore(
    (state) => state.getTableStyles(tableId)?.containerBackgroundColor,
    shallow
  );

  const containerPadding = useTableStore((state) => state.getTableStyles(tableId)?.containerPadding, shallow);

  // measuredWidth (.jet-data-table's real, scrollbar-adjusted clientWidth) is preferred over the
  // canvasWidth-derived estimate below: a vertical scrollbar reserving layout space (non-overlay
  // scrollbar settings) shrinks the table's real content width in a way canvasWidth can't see,
  // and every other row already tracks it via CSS (width: 100%) rather than a fixed px value.
  const containerWrapperStyle = {
    width: `${measuredWidth ?? (containerPadding === 'default' ? canvasWidth - 2 * BOX_PADDING : canvasWidth)}px`,
    height: `${expansionHeight}px`,
    padding: `${CONTAINER_FORM_CANVAS_PADDING}px`,
    backgroundColor: containerBackgroundColor,
  };

  // Single effect to update virtualizer slot when expanded row height is changed
  useEffect(() => {
    virtualizer.resizeItem(virtualItemIndex, expansionHeight);
  }, [expansionHeight, virtualizer, virtualItemIndex]);

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
        <div className="table-expanded-row-content" style={containerWrapperStyle}>
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
