import React, { useState, useEffect, useRef } from 'react';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Loader from '../Loader';
import useTableStore from '../../_stores/tableStore';
import { flexRender } from '@tanstack/react-table';
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DraggableHeader = ({ header, darkMode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging, setActivatorNodeRef } = useSortable({
    id: header.id,
  });

  const style = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <th
      ref={setNodeRef}
      key={header.id}
      className={cx('th tj-text-xsm font-weight-400', {
        'resizing-column': header.column.getIsResizing(),
        'has-actions': header.column.columnDef.header === 'Actions',
        'selector-header': header.column.columnDef.type === 'selector',
      })}
      style={{
        width: header.getSize(),
        position: 'relative',
        ...style,
      }}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={cx('d-flex justify-content-between custom-gap-12', {
          'd-flex justify-content-center w-100': header.column.columnDef.type === 'selector',
        })}
        onClick={header.column.getCanSort() ? () => header.column.toggleSorting() : undefined}
        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', width: '100%' }}
      >
        <div className="header-text">
          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
        </div>
        {header.column.getIsSorted() && (
          <div>
            <SolidIcon
              name={header.column.getIsSorted() === 'desc' ? 'arrowdown' : 'arrowup'}
              width="16"
              height="16"
              fill={darkMode ? '#ECEDEE' : '#11181C'}
            />
          </div>
        )}
      </div>
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cx('resizer', { 'resizing-column': header.column.getIsResizing() })}
        >
          <div
            className="table-column-resize-handle"
            style={{
              display: header.column.getIsResizing() ? 'block' : 'none',
            }}
          ></div>
        </div>
      )}
    </th>
  );
};

export const TableHeader = ({ id, table, darkMode, columnOrder, setColumnOrder }) => {
  const { getLoadingState } = useTableStore();
  const loadingState = getLoadingState(id);

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

  if (loadingState) {
    return (
      <div className="w-100">
        <Loader />
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
                <DraggableHeader key={header.id} header={header} darkMode={darkMode} />
              ))}
            </tr>
          </SortableContext>
        ))}
      </DndContext>
    </thead>
  );
};
