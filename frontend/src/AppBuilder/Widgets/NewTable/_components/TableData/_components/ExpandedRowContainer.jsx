import React, { useMemo } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';

const DEFAULT_EXPANSION_HEIGHT = 250;

export const ExpandedRowContainer = ({
  tableId,
  rowIndex,
  top,
  darkMode,
  canvasWidth,
  expansionHeight = DEFAULT_EXPANSION_HEIGHT,
}) => {
  const parentContext = useSubcontainerContext();

  const contextValue = useMemo(
    () => ({
      contextPath: [...parentContext.contextPath, { containerId: tableId, index: rowIndex }],
    }),
    [parentContext.contextPath, tableId, rowIndex]
  );

  return (
    <SubcontainerContext.Provider value={contextValue}>
      <tr
        className="table-expanded-row-container"
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: 0,
          width: '100%',
        }}
      >
        <div
          className="table-expanded-row-content"
          style={{
            width: `${canvasWidth}px`,
            height: `${expansionHeight}px`,
          }}
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
