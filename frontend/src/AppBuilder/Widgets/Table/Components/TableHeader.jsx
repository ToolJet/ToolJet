import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { isEqual } from 'lodash';

export const TableHeader = ({
  headerGroups,
  allColumns,
  currentColOrder,
  setColumnOrder,
  loadingState,
  darkMode,
  getResolvedValue,
  columnHeaderWrap,
  setResizingColumnId,
  resizingColumnId,
  headerCasing,
}) => {
  const calculateWidthOfActionColumnHeader = (position) => {
    let totalWidth = null;
    if (position === 'rightActions') {
      const rightActionBtn = document.querySelector('.has-right-actions');
      totalWidth = rightActionBtn?.offsetWidth;
    }
    if (position === 'leftActions') {
      const leftActionBtn = document.querySelector('.has-left-actions');
      totalWidth = leftActionBtn?.offsetWidth;
    }
    return totalWidth;
  };

  const getItemStyle = ({ isDragging, isDropAnimating }, draggableStyle) => ({
    ...draggableStyle,
    userSelect: 'none',
    background: isDragging ? 'var(--slate4)' : '',
    top: 'auto',
    borderRadius: '4px',
    ...(isDragging && {
      // marginLeft: '-280px', // hack changing marginLeft to -280px to bring the draggable header to the correct position at the start of drag
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '10px',
      height: '30px',
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '9999',
      width: '60px',
    }),
    ...(!isDragging && { transform: 'translate(0,0)', width: '100%' }),
    ...(isDropAnimating && { transitionDuration: '0.001s' }),
  });

  return (
    <thead>
      {headerGroups?.map((headerGroup, index) => (
        <DragDropContext
          key={index}
          onDragStart={() => {
            currentColOrder.current = allColumns?.map((o) => o.id);
          }}
          onDragEnd={(dragUpdateObj) => {
            const colOrder = [...currentColOrder.current];
            const sIndex = dragUpdateObj.source.index;
            const dIndex = dragUpdateObj.destination && dragUpdateObj.destination.index;

            if (typeof sIndex === 'number' && typeof dIndex === 'number') {
              colOrder.splice(sIndex, 1);
              colOrder.splice(dIndex, 0, dragUpdateObj.draggableId);
              setColumnOrder(colOrder);
            }
          }}
        >
          <Droppable droppableId="droppable" direction="horizontal">
            {(droppableProvided) => (
              <tr ref={droppableProvided.innerRef} key={index} {...headerGroup.getHeaderGroupProps()} className="tr">
                {loadingState && (
                  <div className="w-100">
                    <SkeletonTheme baseColor="var(--slate3)" width="100%">
                      <Skeleton count={1} width={'100%'} height={28} className="mb-1" />
                    </SkeletonTheme>
                  </div>
                )}
                {!loadingState &&
                  headerGroup.headers.map((column, index) => {
                    return (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={index}
                        isDragDisabled={!column.accessor}
                      >
                        {(provided, snapshot) => {
                          let headerProps = { ...column.getHeaderProps() };
                          if (column.columnType === 'selector') {
                            headerProps = {
                              ...headerProps,
                              style: {
                                ...headerProps.style,
                                width: 40,
                                padding: 0,
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                              },
                            };
                          }
                          if (column.Header === 'Actions') {
                            headerProps = {
                              ...headerProps,
                              style: {
                                ...headerProps.style,
                                width: calculateWidthOfActionColumnHeader(column.id),
                                maxWidth: calculateWidthOfActionColumnHeader(column.id),
                                padding: 0,
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                              },
                            };
                          }
                          if (
                            headerGroup?.headers?.[headerGroup?.headers?.length - 1]?.Header === 'Actions' &&
                            index === headerGroup?.headers?.length - 2
                          ) {
                            headerProps = {
                              ...headerProps,
                              style: {
                                ...headerProps.style,
                                flex: '1 1 auto',
                              },
                            };
                          }
                          const isEditable = getResolvedValue(column?.isEditable ?? false);
                          return (
                            <th
                              key={index}
                              {...headerProps}
                              className={`th tj-text-xsm font-weight-400 ${
                                column.isSorted && (column.isSortedDesc ? '' : '')
                              } ${column.isResizing && 'resizing-column'} ${
                                column.Header === 'Actions' && 'has-actions'
                              } position-relative ${column.columnType === 'selector' && 'selector-header'}`}
                            >
                              <div
                                className={`${
                                  column.columnType !== 'selector' && 'd-flex justify-content-between custom-gap-12'
                                } ${column.columnType === 'selector' && 'd-flex justify-content-center w-100'}`}
                                {...column.getSortByToggleProps()}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                // {...extraProps}
                                ref={provided.innerRef}
                                style={{
                                  ...getItemStyle(snapshot, provided.draggableProps.style),
                                }}
                              >
                                <div
                                  className={`d-flex thead-editable-icon-header-text-wrapper
                                  ${
                                    column.columnType === 'selector'
                                      ? 'justify-content-center'
                                      : `justify-content-${determineJustifyContentValue(
                                          column?.horizontalAlignment ?? ''
                                        )}`
                                  }
                                  ${column.columnType !== 'selector' && isEditable && 'custom-gap-4'}
                                  `}
                                >
                                  <div>
                                    {column.columnType !== 'selector' &&
                                      column.columnType !== 'image' &&
                                      isEditable && (
                                        <SolidIcon
                                          name="editable"
                                          width="16px"
                                          height="16px"
                                          fill={darkMode ? '#4C5155' : '#C1C8CD'}
                                          vievBox="0 0 16 16"
                                        />
                                      )}
                                  </div>
                                  <div
                                    data-cy={`column-header-${String(column.exportValue)
                                      .toLowerCase()
                                      .replace(/\s+/g, '-')}`}
                                    className={cx('header-text', {
                                      'selector-column': column.id === 'selection' && column.columnType === 'selector',
                                      'text-truncate': getResolvedValue(columnHeaderWrap) === 'fixed',
                                      'wrap-wrapper': getResolvedValue(columnHeaderWrap) === 'wrap',
                                    })}
                                    style={{ textTransform: headerCasing === 'uppercase' ? 'uppercase' : 'none' }}
                                  >
                                    {column.render('Header')}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: column?.columnType !== 'selector' && column?.isSorted ? 'block' : 'none',
                                  }}
                                >
                                  {column?.isSortedDesc ? (
                                    <SolidIcon
                                      name="arrowdown"
                                      width="16"
                                      height="16"
                                      fill={darkMode ? '#ECEDEE' : '#11181C'}
                                    />
                                  ) : (
                                    <SolidIcon
                                      name="arrowup"
                                      width="16"
                                      height="16"
                                      fill={darkMode ? '#ECEDEE' : '#11181C'}
                                    />
                                  )}
                                </div>
                              </div>
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onMouseMove={() => {
                                  if (column.id !== resizingColumnId) {
                                    setResizingColumnId(column.id);
                                  }
                                }}
                                onMouseLeave={() => {
                                  if (resizingColumnId) {
                                    setResizingColumnId(null);
                                  }
                                }}
                                draggable="true"
                                {...column.getResizerProps()}
                                className={`${
                                  (column.id === 'selection' && column.columnType === 'selector') ||
                                  column.Header === 'Actions'
                                    ? ''
                                    : 'resizer'
                                }  ${column.isResizing ? 'isResizing' : ''}`}
                              >
                                <div
                                  className="table-column-resize-handle"
                                  style={{
                                    ...(column.isResizing && { display: 'block' }),
                                  }}
                                ></div>
                              </div>
                            </th>
                          );
                        }}
                      </Draggable>
                    );
                  })}
              </tr>
            )}
          </Droppable>
        </DragDropContext>
      ))}
    </thead>
  );
};
