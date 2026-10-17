import React, { useMemo } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { getDynamicLayoutKey } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

// `index` is the row's place in the store: its row, or its slot in a long ListView rendering only some rows (then
// `rowIndex` is its row, `placement` positions it and `onRowTouched` keeps it rendered once the user touches it).
export const ListviewSubcontainer = ({
  index,
  rowIndex = index,
  placement = null,
  onRowTouched = null,
  moduleId,
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
    (state) => state.temporaryLayouts?.[getDynamicLayoutKey(id, contextIndices, '', moduleId)],
    shallow
  );
  const transformedRowHeight = isDynamicHeightEnabled ? (temporaryLayout?.height ?? rowHeight) : rowHeight;

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
          ...placement,
        }}
        key={index}
        data-cy={`${String(dataCy).toLowerCase()}-row-${rowIndex}`}
        onClickCapture={(_event) => {
          onRecordOrRowClicked(rowIndex);
        }}
        {...(onRowTouched && {
          onPointerDownCapture: (event) => onRowTouched(rowIndex, event.target),
          onFocusCapture: (event) => onRowTouched(rowIndex, event.target),
          onKeyDownCapture: (event) => onRowTouched(rowIndex, event.target),
          onInputCapture: (event) => onRowTouched(rowIndex, event.target),
          onChangeCapture: (event) => onRowTouched(rowIndex, event.target),
        })}
      >
        <SubContainer
          index={index}
          rowIndex={rowIndex}
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
