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
  expansionHeight = DEFAULT_EXPANSION_HEIGHT,
  resizeItem,
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

  const containerWrapperStyle = {
    width: containerPadding === 'default' ? `${canvasWidth - 2 * BOX_PADDING}px` : `${canvasWidth}px`,
    height: `${expansionHeight}px`,
    padding: `${CONTAINER_FORM_CANVAS_PADDING}px`,
    backgroundColor: containerBackgroundColor,
  };

  // Single effect to update the row window's slot when expanded row height is changed
  useEffect(() => {
    resizeItem(virtualItemIndex, expansionHeight);
  }, [expansionHeight, resizeItem, virtualItemIndex]);

  return (
    <SubcontainerContext.Provider value={contextValue}>
      <tr
        className="table-expanded-row-container"
        data-index={virtualItemIndex}
        style={{
          position: 'absolute',
          top,
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
