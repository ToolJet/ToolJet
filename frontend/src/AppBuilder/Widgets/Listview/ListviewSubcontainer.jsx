import React, { useMemo, useRef } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { getDynamicLayoutKey } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import cx from 'classnames';

const ListviewSubcontainerComponent = ({
  index,
  moduleId,
  mode,
  rowHeight,
  positiveColumns,
  showBorder,
  recordWidth,
  recordBoxStyle,
  recordBorderInset = 0,
  onRecordOrRowClicked,
  onRecordHovered,
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
  recordOffset = 0,
  isBuilder = false,
  isFaded = false,
  isMoving = false,
  onMainHoverChange,
}) => {
  const parentContext = useSubcontainerContext();
  // The first record of page 1 is the only editable one; a page-relative index cannot tell it from page 2's first.
  const isCopy = !!parentContext.listviewCopy || recordOffset + index !== 0;
  // The first record of a later page is read-only but is no copy of a record-1 selection.
  const copyOutline = parentContext.listviewCopy ? (parentContext.listviewCopyOutline ?? true) : isCopy && index !== 0;
  const contextValue = useMemo(
    () => ({
      contextPath: [...parentContext.contextPath, { containerId: id, index }],
      inListviewRecord: true,
      listviewCopy: isCopy,
      listviewCopyOutline: copyOutline,
    }),
    [parentContext.contextPath, id, index, isCopy, copyOutline]
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
        className={cx('list-item', {
          'listview-record-moving': isMoving,
          'w-100': mode == 'list',
          'listview-legacy-divider': showBorder && mode == 'list',
        })}
        style={{
          position: 'relative',
          height: `${transformedRowHeight}px`,
          width: recordWidth ?? `${100 / positiveColumns}%`,
          padding: '0px',
          overflow: 'hidden',
          ...(isFaded && { opacity: 0.4 }),
          ...recordBoxStyle,
        }}
        key={index}
        role="listitem"
        tabIndex={0}
        data-cy={`${String(dataCy).toLowerCase()}-row-${index}`}
        // mouseenter does not bubble, so moving over the record's children does not re-fire.
        onMouseEnter={() => {
          onRecordHovered?.(index);
          if (isBuilder && !isCopy) onMainHoverChange?.(true);
        }}
        onMouseLeave={() => {
          if (isBuilder && !isCopy) onMainHoverChange?.(false);
        }}
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
          canvasHeight={transformedRowHeight - recordBorderInset}
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

export const ListviewSubcontainer = React.memo(ListviewSubcontainerComponent);
