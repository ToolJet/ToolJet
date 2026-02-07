import React from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';

export const ListviewSubcontainer = ({
  index,
  mode,
  rowHeight,
  positiveColumns,
  showBorder,
  onRecordOrRowClicked,
  onOptionChange,
  onOptionsChange,
  computeCanvasBackgroundColor,
  darkMode,
  id,
  adjustComponentPositions,
  isDynamicHeightEnabled,
  data,
  width,
  currentLayout,
  visibility,
  parentHeight,
}) => {
  const temporaryLayout = useStore((state) => state.temporaryLayouts?.[`${id}-${index}`], shallow);
  const transformedRowHeight = isDynamicHeightEnabled ? temporaryLayout?.height ?? rowHeight : rowHeight;

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    value: data,
    adjustComponentPositions,
    currentLayout,
    visibility,
    isContainer: true,
    subContainerIndex: index,
    height: parentHeight,
  });

  return (
    <div
      className={`list-item ${mode == 'list' && 'w-100'}`}
      style={{
        position: 'relative',
        height: `${transformedRowHeight}px`,
        width: `${100 / positiveColumns}%`,
        padding: '0px',
        overflowY: 'auto',
        overflowX: 'hidden',
        ...(showBorder && mode == 'list' && { borderBottom: `1px solid var(--cc-default-border)` }),
      }}
      key={index}
      // data-cy={`${String(component.name).toLowerCase()}-row-${index}`}
      onClickCapture={(event) => {
        onRecordOrRowClicked(index);
      }}
    >
      <SubContainer
        index={index}
        id={id}
        key={`${id}-${index}`}
        canvasHeight={transformedRowHeight}
        canvasWidth={width}
        onOptionChange={onOptionChange}
        onOptionsChange={onOptionsChange}
        styles={computeCanvasBackgroundColor}
        columns={positiveColumns}
        listViewMode={mode}
        darkMode={darkMode}
        componentType="Listview"
      />
    </div>
  );
};
