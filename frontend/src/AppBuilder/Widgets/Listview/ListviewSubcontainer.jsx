import React, { useMemo, useRef } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { getDynamicLayoutKey } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

export const ListviewSubcontainer = ({
  index,
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

  const pendingClickRef = useRef(false);

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
        role="listitem"
        tabIndex={0}
        data-cy={`${String(dataCy).toLowerCase()}-row-${index}`}
        // Enter and Space only: focus alone must not select, or tabbing would fire Record clicked.
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onRecordOrRowClicked(index);
        }}
        // Capture, so a child that stops propagation cannot hide the click (D-13); deferred, so the
        // child's own handler writes first; coalesced, so a label and its synthetic input click count once.
        onClickCapture={(event) => {
          // A modal this row opened covers the page; clicking it is not clicking the row beneath.
          // It is lifted out of the row in a browser and left inside it under jsdom, so both count.
          if (!event.currentTarget.contains(event.target)) return;
          const dialog = event.target?.closest?.('[role="dialog"]');
          if (dialog && event.currentTarget.contains(dialog)) return;
          if (pendingClickRef.current) return;
          pendingClickRef.current = true;
          setTimeout(() => {
            pendingClickRef.current = false;
            onRecordOrRowClicked(index);
          }, 0);
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
