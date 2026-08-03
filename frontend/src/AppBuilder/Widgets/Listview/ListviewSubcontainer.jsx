import React, { useMemo } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { getDynamicLayoutKey } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

export const ListviewSubcontainer = ({
  index,
  mode,
  rowHeight,
  positiveColumns,
  showBorder,
  onRecordOrRowClicked,
  computeCanvasBackgroundColor,
  darkMode,
  id,
  isDynamicHeightEnabled,
  data,
  width,
  currentLayout,
  visibility,
  parentHeight,
  dataCy,
  componentType,
}) => {
  const parentContext = useSubcontainerContext();
  const contextValue = useMemo(
    () => ({ contextPath: [...parentContext.contextPath, { containerId: id, index }] }),
    [parentContext.contextPath, id, index]
  );
  const contextIndices = useMemo(
    () => [...parentContext.contextPath.map((segment) => segment.index), index],
    [parentContext.contextPath, index]
  );

  const temporaryLayout = useStore(
    (state) => state.temporaryLayouts?.[getDynamicLayoutKey(id, contextIndices)],
    shallow
  );
  const transformedRowHeight = isDynamicHeightEnabled ? temporaryLayout?.height ?? rowHeight : rowHeight;

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    value: data,
    currentLayout,
    visibility,
    isContainer: true,
    subContainerIndex: index,
    isRowSubcontainer: true,
    height: parentHeight,
    componentType,
  });

  return (
    <SubcontainerContext.Provider value={contextValue}>
      <div
        className={`list-item ${mode == 'list' && 'w-100'}`}
        style={{
          position: 'relative',
          height: `${transformedRowHeight}px`,
          width: `${100 / positiveColumns}%`,
          padding: '0px',
          overflow: 'hidden',
          ...(showBorder && mode == 'list' && { borderBottom: `1px solid var(--cc-default-border)` }),
        }}
        key={index}
        data-cy={`${String(dataCy).toLowerCase()}-row-${index}`}
        onClickCapture={(_event) => {
          onRecordOrRowClicked(index);
        }}
      >
        <SubContainer
          index={index}
          id={id}
          key={`${id}-${index}`}
          canvasHeight={transformedRowHeight}
          canvasWidth={width}
          styles={computeCanvasBackgroundColor}
          columns={positiveColumns}
          listViewMode={mode}
          darkMode={darkMode}
          componentType="Listview"
        />
      </div>
    </SubcontainerContext.Provider>
  );
};
