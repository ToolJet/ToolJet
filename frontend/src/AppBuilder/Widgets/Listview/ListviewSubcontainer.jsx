import React, { useCallback, useMemo, useRef } from 'react';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { getDynamicLayoutKey } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import cx from 'classnames';

const RESIZE_HANDLE_HEIGHT = 8;
const RESIZE_HANDLE_WIDTH = 26;

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
  isDisabled = false,
  isListDisabled = false,
  isMoving = false,
  onMainHoverChange,
  recordRef,
  resizeHandleProps,
  isResizing = false,
  isMainHovered = false,
}) => {
  const parentContext = useSubcontainerContext();
  // The first record of page 1 is the only editable one; a page-relative index cannot tell it from page 2's first.
  // A disabled record 1 is read-only too: it locks the template for every record until it is enabled.
  const isCopy = !!parentContext.listviewCopy || recordOffset + index !== 0 || isDisabled;
  // The first record of a later page is read-only but is no copy of a record-1 selection.
  const copyOutline = parentContext.listviewCopy ? (parentContext.listviewCopyOutline ?? true) : isCopy && index !== 0;
  const isDisabledTree = isDisabled || !!parentContext.listviewDisabled;
  // The list's own Disabled state (0.6) and an enclosing dimmed record already fade this one.
  const isDimmedAbove = isListDisabled || !!parentContext.listviewDimmed;
  const isDimmed = isDimmedAbove || isFaded || isDisabled;
  const contextValue = useMemo(
    () => ({
      contextPath: [...parentContext.contextPath, { containerId: id, index }],
      inListviewRecord: true,
      listviewCopy: isCopy,
      listviewCopyOutline: copyOutline,
      listviewDisabled: isDisabledTree,
      listviewDimmed: isDimmed,
    }),
    [parentContext.contextPath, id, index, isCopy, copyOutline, isDisabledTree, isDimmed]
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
  const ownRef = useRef(null);
  // `inert` also takes the record's components out of the tab order, which pointer-events cannot.
  useDisableInert(ownRef, isDisabled);
  const setRecordNode = useCallback(
    (node) => {
      ownRef.current = node;
      if (recordRef) recordRef.current = node;
    },
    [recordRef]
  );
  // Only record 1 has the handle props, so the drag's outline and grid never reach a copy.
  const isResizeTarget = isResizing && !!resizeHandleProps;
  // The handle sits on the bottom edge, half outside the record, so the record itself must not clip; its children are clipped by the inner box.
  const handleBottom = -(RESIZE_HANDLE_HEIGHT / 2 + recordBorderInset / 2);

  return (
    <SubcontainerContext.Provider value={contextValue}>
      <div
        className={cx('list-item', {
          'listview-record-moving': isMoving || isResizeTarget || (isMainHovered && !!resizeHandleProps),
          'w-100': mode == 'list',
          'listview-legacy-divider': showBorder && mode == 'list',
        })}
        style={{
          position: 'relative',
          height: `${transformedRowHeight}px`,
          width: recordWidth ?? `${100 / positiveColumns}%`,
          padding: '0px',
          overflow: resizeHandleProps ? undefined : 'hidden',
          // One 0.4 for the hover fade and Disabled, and none when the list or an outer record already dims it.
          ...((isFaded || isDisabled) && !isDimmedAbove && { opacity: 0.4 }),
          ...(isDisabled && { pointerEvents: 'none' }),
          ...recordBoxStyle,
        }}
        key={index}
        ref={setRecordNode}
        role="listitem"
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? undefined : 0}
        data-cy={`${String(dataCy).toLowerCase()}-row-${index}`}
        // mouseenter does not bubble, so moving over the record's children does not re-fire.
        onMouseEnter={() => {
          if (isDisabled) return;
          onRecordHovered?.(index);
          if (isBuilder && !isCopy) onMainHoverChange?.(true);
        }}
        onMouseLeave={() => {
          if (isBuilder && !isCopy) onMainHoverChange?.(false);
        }}
        // Enter and Space only: focus alone must not select, or tabbing would fire Record clicked.
        onKeyDown={(event) => {
          if (isDisabled || event.target !== event.currentTarget) return;
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
          // jsdom and a script click ignore pointer-events, so the click is also stopped before it reaches a component.
          if (isDisabled) {
            event.stopPropagation();
            return;
          }
          // The click that ends a resize is not a click on the record.
          if (event.target?.closest?.('.listview-record-resize-handle')) return;
          if (pendingClickRef.current) return;
          pendingClickRef.current = true;
          setTimeout(() => {
            pendingClickRef.current = false;
            onRecordOrRowClicked(index);
          }, 0);
        }}
      >
        <div className="listview-record-clip" style={{ height: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
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
            forceShowGrid={isResizeTarget}
          />
        </div>
        {resizeHandleProps && (
          <div
            className={cx('resize-handle', 'listview-record-resize-handle', {
              dragging: isResizing,
              'listview-record-handle-shown': isMainHovered,
            })}
            data-cy={`${String(dataCy).toLowerCase()}-record-resize-handle`}
            style={{
              position: 'absolute',
              bottom: handleBottom,
              left: '50%',
              transform: 'translateX(-50%)',
              width: RESIZE_HANDLE_WIDTH,
              height: RESIZE_HANDLE_HEIGHT,
            }}
            {...resizeHandleProps}
          />
        )}
      </div>
    </SubcontainerContext.Provider>
  );
};

export const ListviewSubcontainer = React.memo(ListviewSubcontainerComponent);
