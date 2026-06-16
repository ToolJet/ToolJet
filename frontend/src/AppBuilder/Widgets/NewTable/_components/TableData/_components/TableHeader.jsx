import React, { useRef, useState } from 'react';
import cx from 'classnames';
import { OverlayTrigger } from 'react-bootstrap';
import Loader from '../../Loader';
import useTableStore from '../../../_stores/tableStore';
import { flexRender } from '@tanstack/react-table';
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useStore from '@/AppBuilder/_stores/store';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { shallow } from 'zustand/shallow';
import { IconPencil, IconSortDescending, IconSortAscending } from '@tabler/icons-react';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { getPinnedStyles } from '../pinColumnsUtils';

const DraggableHeader = ({ header, darkMode, id, table, fireEvent, setExposedVariables }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging, setActivatorNodeRef } = useSortable({
    id: header.id,
  });

  const headerTextRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const columnHeaderWrap = useTableStore((state) => state.getTableStyles(id)?.columnHeaderWrap, shallow);
  const headerCasing = useTableStore((state) => state.getTableStyles(id)?.headerCasing, shallow);
  const columnTitleColor = useTableStore((state) => state.getTableStyles(id)?.columnTitleColor, shallow);
  const columnBackgroundColor = useTableStore((state) => state.getTableStyles(id)?.columnBackgroundColor, shallow);
  const enabledSort = useTableStore((state) => state.getTableProperties(id)?.enabledSort ?? true, shallow);

  const getResolvedValue = useStore.getState().getResolvedValue;

  const column = header.column.columnDef.meta;
  const isEditable = getResolvedValue(column.isEditable);

  const isOverflowing = () => {
    if (!headerTextRef.current) return false;
    return headerTextRef.current.clientWidth < headerTextRef.current.scrollWidth;
  };

  const isDataColumn = column.columnType !== 'selector';

  const handleHeaderClick = () => {
    if (!isDataColumn) return;
    setExposedVariables({
      selectedColumnHeader: {
        key: column.key,
        name: column.name,
        index: header.column.getIndex(),
      },
    });
    fireEvent('onHeaderClick');
    if (enabledSort && header.column.getCanSort()) {
      header.column.toggleSorting();
    }
  };
  const {
    pinnedPosition,
    isPinnedBoundary,
    style: pinnedStyles,
  } = getPinnedStyles({
    column: header.column,
    table,
    isHeader: true,
  });

  const style = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    flex: '0 0 auto',
    zIndex: isDragging ? 15 : pinnedStyles.zIndex ?? 0,
    backgroundColor: columnBackgroundColor,
    color: columnTitleColor,
    '--cc-table-header-hover': getModifiedColor(columnBackgroundColor, 6),
    '--cc-table-header-active': getModifiedColor(columnBackgroundColor, 10),
  };

  return (
    <th
      ref={setNodeRef}
      key={header.id}
      className={cx('th tj-text-xsm font-weight-400', {
        'resizing-column': header.column.getIsResizing(),
        'has-actions': header.column.columnDef.header === 'Actions',
        'selector-header': header.column.columnDef.type === 'selector',
        'dark-theme': darkMode,
        'pinned-column': !!pinnedPosition,
        'pinned-column-left': pinnedPosition === 'left',
        'pinned-column-right': pinnedPosition === 'right',
        'pinned-column-boundary-left': pinnedPosition === 'left' && isPinnedBoundary,
        'pinned-column-boundary-right': pinnedPosition === 'right' && isPinnedBoundary,
      })}
      style={{
        width: header.getSize(),
        ...style,
        ...pinnedStyles,
      }}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={cx('d-flex justify-content-between custom-gap-4', {
          'd-flex justify-content-center w-100': header.column.columnDef.type === 'selector',
        })}
        onClick={isDataColumn ? handleHeaderClick : undefined}
        style={{ cursor: isDataColumn ? 'pointer' : 'default', width: '100%' }}
      >
        <div
          className={`d-flex thead-editable-icon-header-text-wrapper ${
            column.columnType === 'selector'
              ? 'justify-content-center'
              : `justify-content-${determineJustifyContentValue(column?.horizontalAlignment ?? '')}`
          } ${column.columnType !== 'selector' && isEditable && 'custom-gap-4'}`}
        >
          <div className="d-flex align-items-center tw-flex-shrink-0">
            {column.columnType !== 'selector' && column.columnType !== 'image' && isEditable && (
              <IconPencil size="16px" color="var(--cc-secondary-icon, var(--icon-default))" />
            )}
          </div>
          <OverlayTrigger
            placement="top"
            overlay={
              isOverflowing() && isDataColumn ? (
                <div className={`overlay-cell-table ${darkMode ? 'dark-theme' : ''}`}>
                  <span className="tw-text-text-default">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </span>
                </div>
              ) : (
                <div />
              )
            }
            trigger={isOverflowing() && isDataColumn && ['hover', 'focus']}
            rootClose={true}
            show={isOverflowing() && isDataColumn && showOverlay}
          >
            <div
              ref={headerTextRef}
              className={cx('header-text tw-w-full', {
                'selector-column': column.id === 'selection' && column.columnType === 'selector',
                'text-truncate': getResolvedValue(columnHeaderWrap) === 'fixed',
                'wrap-wrapper': getResolvedValue(columnHeaderWrap) === 'wrap',
              })}
              data-cy={`${generateCypressDataCy(column.name)}-column-header`}
              style={{
                textTransform: headerCasing === 'uppercase' ? 'uppercase' : 'none',
                textAlign: column.columnType !== 'selector' ? column?.horizontalAlignment || 'left' : undefined,
              }}
              onMouseEnter={() => setShowOverlay(true)}
              onMouseLeave={() => setShowOverlay(false)}
            >
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          </OverlayTrigger>
        </div>
        {header.column.getIsSorted() && (
          <div className="tw-flex-shrink-0">
            {header.column.getIsSorted() === 'desc' ? (
              <IconSortDescending
                size={16}
                color="var(--cc-secondary-icon, var(--icon-default))"
                data-cy={`${generateCypressDataCy(column.name)}-sort-icon-descending`}
              />
            ) : (
              <IconSortAscending
                size={16}
                color="var(--cc-secondary-icon, var(--icon-default))"
                data-cy={`${generateCypressDataCy(column.name)}-sort-icon-ascending`}
              />
            )}
          </div>
        )}
      </div>
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onClick={(e) => e.stopPropagation()}
          className={cx('resizer', { 'resizing-column': header.column.getIsResizing() })}
        >
          <div
            className="table-column-resize-handle"
            style={{
              display: header.column.getIsResizing() ? 'block' : 'none',
            }}
            data-cy={`${generateCypressDataCy(column.name)}-column-resizer`}
          ></div>
        </div>
      )}
    </th>
  );
};

export const TableHeader = ({ id, table, darkMode, columnOrder, setColumnOrder, fireEvent, setExposedVariables }) => {
  const { getLoadingState, getIsRefreshing } = useTableStore();
  const loadingState = getLoadingState(id);
  const isRefreshing = getIsRefreshing(id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
        delay: 250,
      },
    })
  );

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumnOrder((currentOrder) => {
      const oldIndex = currentOrder.indexOf(active.id);
      const newIndex = currentOrder.indexOf(over.id);
      return arrayMove(columnOrder, oldIndex, newIndex);
    });
  };

  if (loadingState || isRefreshing) {
    return (
      <div className="w-100">
        <Loader height={28} />
      </div>
    );
  }

  return (
    <thead>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        {table.getHeaderGroups().map((headerGroup) => (
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy} key={headerGroup.id}>
            <tr className="tr" style={{ display: 'flex' }}>
              {headerGroup.headers.map((header) => (
                <DraggableHeader
                  key={header.id}
                  header={header}
                  darkMode={darkMode}
                  id={id}
                  table={table}
                  fireEvent={fireEvent}
                  setExposedVariables={setExposedVariables}
                />
              ))}
            </tr>
          </SortableContext>
        ))}
      </DndContext>
    </thead>
  );
};
