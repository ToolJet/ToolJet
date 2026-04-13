import React, { useEffect, useMemo } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { DEFAULT_EXPANSION_HEIGHT } from '../../../_utils/helper';

export const ExpandedRowContainer = ({
  tableId,
  rowIndex,
  top,
  darkMode,
  canvasWidth,
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
        <div
          className="table-expanded-row-content"
          style={{ width: `${canvasWidth}px`, height: `${expansionHeight}px` }}
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
