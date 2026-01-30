import React, { useState, useCallback, useMemo } from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../../Utils';
import { resolveReferences } from '@/_helpers/utils';
// eslint-disable-next-line import/no-unresolved
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import SelectSearch from 'react-select-search';
import { EventManager } from '../../EventManager';
import { useTranslation } from 'react-i18next';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import List from '@/ToolJetUI/List/List';
import { capitalize, has } from 'lodash';
import NoListItem from './NoListItem';
import { ProgramaticallyHandleProperties } from './ProgramaticallyHandleProperties';
import { ColumnPopoverContent } from './ColumnManager/ColumnPopover';
import { checkIfTableColumnDeprecated } from './ColumnManager/DeprecatedColumnTypeMsg';
import { ColorSwatches } from '@/modules/Appbuilder/components';
import { getColumnIcon } from './utils';
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import { useColumnManager, useActionButtonManager, usePopoverState } from './hooks';

// Helper function to get display text for column type
const getColumnTypeDisplayText = (columnType) => {
  const displayMap = {
    undefined: '',
    string: 'String',
    default: 'Default',
    number: 'Number',
    text: 'Text',
    badge: 'Badge',
    badges: 'Badges',
    tags: 'Tags',
    dropdown: 'Dropdown',
    link: 'Link',
    radio: 'Radio',
    multiselect: 'Multiselect deprecated',
    toggle: 'Toggle',
    datepicker: 'Datepicker',
    image: 'Image',
    boolean: 'Boolean',
    select: 'Select',
    newMultiSelect: 'Multiselect',
    json: 'JSON',
    markdown: 'Markdown',
    html: 'HTML',
  };
  return displayMap[columnType] ?? capitalize(columnType ?? '');
};

// Draggable item style
const getDraggableStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  ...draggableStyle,
});

export const Table = (props) => {
  const {
    dataQueries,
    component,
    paramUpdated,
    componentMeta,
    components,
    currentState,
    darkMode,
    eventsChanged,
    apps,
    pages,
    layoutPropertyChanged,
  } = props;

  const { t } = useTranslation();

  // Popover states
  const [actionPopOverRootClose, setActionPopOverRootClose] = useState(true);
  const [showPopOver, setShowPopOver] = useState(false);

  // Custom hooks
  const {
    columns,
    filteredColumns,
    isAllColumnsEditable,
    addColumn,
    removeColumn,
    duplicateColumn,
    reorderColumns,
    updateColumnProperty,
    updateColumnEvents,
    setAllColumnsEditable,
    getPopoverFieldSource,
  } = useColumnManager({ component, paramUpdated, currentState });

  const { actions, addAction, removeAction, updateActionProperty, updateActionEvents } = useActionButtonManager({
    component,
    paramUpdated,
  });

  const {
    activeIndex: activeColumnPopoverIndex,
    isRootCloseEnabled,
    togglePopover: handleToggleColumnPopover,
    setRootCloseBlocker: setColumnPopoverRootCloseBlocker,
  } = usePopoverState();

  // Event handlers
  const handleDragEnd = useCallback(
    ({ source, destination }) => {
      if (!destination || source?.index === destination?.index) return;
      reorderColumns(source.index, destination.index);
    },
    [reorderColumns]
  );

  const handleColumnEventChange = useCallback(
    (column, events) => updateColumnEvents(column.id, events),
    [updateColumnEvents]
  );

  const handleEventManagerPopoverCallback = useCallback((showing) => {
    setActionPopOverRootClose(!showing);
    setShowPopOver(showing);
  }, []);

  // Render helpers
  const renderCustomElement = useCallback(
    (param, paramType = 'properties') =>
      renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType),
    [component, componentMeta, paramUpdated, dataQueries]
  );

  // Column popover
  const renderColumnPopover = useCallback(
    (column, index) => (
      <Popover
        id="popover-basic-2"
        className={`${darkMode && 'dark-theme'} shadow table-column-popover`}
        style={{
          width: '280px',
          maxHeight: resolveReferences(column.isEditable) ? '100vh' : 'inherit',
          zIndex: '9999',
        }}
      >
        <ColumnPopoverContent
          column={column}
          index={index}
          darkMode={darkMode}
          currentState={currentState}
          onColumnItemChange={updateColumnProperty}
          getPopoverFieldSource={getPopoverFieldSource}
          setColumnPopoverRootCloseBlocker={setColumnPopoverRootCloseBlocker}
          component={component}
          props={props}
          columnEventChanged={handleColumnEventChange}
          handleEventManagerPopoverCallback={handleEventManagerPopoverCallback}
        />
      </Popover>
    ),
    [
      darkMode,
      currentState,
      updateColumnProperty,
      getPopoverFieldSource,
      setColumnPopoverRootCloseBlocker,
      component,
      props,
      handleColumnEventChange,
      handleEventManagerPopoverCallback,
    ]
  );

  // Action popover
  const renderActionPopover = useCallback(
    (action, index) => {
      const dummyComponentForActionButton = {
        component: {
          definition: {
            events: actions[index]?.events || [],
          },
        },
      };

      const actionRef = { ref: `${action?.name}` };

      return (
        <Popover id="popover-basic" className={`${darkMode && 'dark-theme'} tw-max-w-80`}>
          <Popover.Body
            className="table-action-popover d-flex flex-column custom-gap-16 tw-w-[19rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="field tj-app-input">
              <label data-cy="label-action-button-text" className="form-label">
                {t('widget.Table.buttonText', 'Button Text')}
              </label>
              <input
                data-cy="action-button-text-input-field"
                type="text"
                className="form-control text-field"
                onChange={(e) => {
                  e.stopPropagation();
                  updateActionProperty(index, 'buttonText', e.target.value);
                }}
                value={action.buttonText}
              />
            </div>
            <div className="field" data-cy="dropdown-action-button-position">
              <label data-cy="label-action-button-position" className="form-label">
                {t('widget.Table.buttonPosition', 'Button Position')}
              </label>
              <SelectSearch
                className="select-search"
                options={[
                  { name: 'Left', value: 'left' },
                  { name: 'Right', value: 'right' },
                ]}
                value={action.position ?? 'right'}
                search={false}
                closeOnSelect={true}
                onChange={(value) => updateActionProperty(index, 'position', value)}
                fuzzySearch
                placeholder="Select position"
              />
            </div>
            <div>
              <label data-cy="label-action-button-bg" className="form-label">
                Background color
              </label>
              <ColorSwatches
                value={action?.backgroundColor}
                onChange={(color) => updateActionProperty(index, 'backgroundColor', color)}
                cyLabel="action-button-bg"
              />
            </div>
            <div>
              <label data-cy="label-action-button-text" className="form-label">
                Text color
              </label>
              <ColorSwatches
                value={action?.textColor}
                onChange={(color) => updateActionProperty(index, 'textColor', color)}
                cyLabel="action-button-text"
              />
            </div>
            <ProgramaticallyHandleProperties
              label="Disable button"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={updateActionProperty}
              property="disableActionButton"
              props={action}
              component={component}
              paramMeta={{ type: 'toggle', displayName: 'Disable action button' }}
              paramType="properties"
            />
            <EventManager
              component={dummyComponentForActionButton}
              sourceId={component?.id}
              eventSourceType="table_action"
              customEventRefs={actionRef}
              eventMetaDefinition={{ events: { onClick: { displayName: 'On click' } } }}
              currentState={currentState}
              dataQueries={dataQueries}
              components={components}
              eventsChanged={(events) => updateActionEvents(index, events)}
              apps={apps}
              popOverCallback={(showing) => {
                setActionPopOverRootClose(!showing);
                setShowPopOver(showing);
              }}
              pages={pages}
            />
            <button className="btn btn-sm btn-outline-danger mt-2 col" onClick={() => removeAction(index, actionRef)}>
              {t('widget.Table.remove', 'Remove')}
            </button>
          </Popover.Body>
        </Popover>
      );
    },
    [
      actions,
      darkMode,
      t,
      updateActionProperty,
      currentState,
      component,
      dataQueries,
      components,
      updateActionEvents,
      apps,
      pages,
      removeAction,
    ]
  );

  // Render action button
  const renderActionButton = useCallback(
    (action, index) => (
      <OverlayTrigger
        trigger="click"
        placement="left"
        rootClose={actionPopOverRootClose}
        overlay={renderActionPopover(action, index)}
        onToggle={(showing) => {
          if (!showing) {
            document.activeElement?.blur();
          }
          setShowPopOver(showing);
        }}
      >
        <div>
          <List>
            <List.Item
              data-cy={`action-button-${String(action.buttonText ?? '')
                .toLowerCase()
                .replace(/\s+/g, '-')}-${String(index ?? '')}`}
              primaryText={action.buttonText}
            />
          </List>
        </div>
      </OverlayTrigger>
    ),
    [actionPopOverRootClose, renderActionPopover]
  );

  // Derived state
  const displaySearchBox = component.component.definition.properties.displaySearchBox?.value ?? true;

  const displayServerSideFilter = useMemo(
    () => resolveReferences(component.component.definition.properties.showFilterButton?.value) ?? false,
    [component.component.definition.properties.showFilterButton?.value]
  );

  const displayServerSideSearch = useMemo(
    () => resolveReferences(component.component.definition.properties.displaySearchBox?.value) ?? false,
    [component.component.definition.properties.displaySearchBox?.value]
  );

  const serverSidePagination = useMemo(
    () => resolveReferences(component.component.definition.properties.serverSidePagination?.value) ?? false,
    [component.component.definition.properties.serverSidePagination?.value]
  );

  const clientSidePagination = useMemo(
    () => resolveReferences(component.component.definition.properties.clientSidePagination?.value) ?? false,
    [component.component.definition.properties.clientSidePagination?.value]
  );

  const enablePagination = useMemo(() => {
    if (!has(component.component.definition.properties, 'enablePagination')) {
      return clientSidePagination || serverSidePagination;
    }
    return resolveReferences(component.component.definition.properties.enablePagination?.value);
  }, [component.component.definition.properties, clientSidePagination, serverSidePagination]);

  const enabledSort = useMemo(
    () => resolveReferences(component.component.definition.properties.enabledSort?.value) ?? true,
    [component.component.definition.properties.enabledSort?.value]
  );

  const useDynamicColumn = useMemo(
    () => resolveReferences(component.component.definition.properties.useDynamicColumn?.value) ?? false,
    [component.component.definition.properties.useDynamicColumn?.value]
  );

  const allowSelection = useMemo(() => {
    const allowSelectionValue = component.component.definition.properties?.allowSelection?.value;
    if (allowSelectionValue) {
      return resolveReferences(allowSelectionValue);
    }
    return (
      resolveReferences(component.component.definition.properties.highlightSelectedRow?.value) ||
      resolveReferences(component.component.definition.properties.showBulkSelector?.value)
    );
  }, [component.component.definition.properties]);

  // Ensure displaySearchBox is set
  if (!component.component.definition.properties.displaySearchBox) {
    paramUpdated({ name: 'displaySearchBox' }, 'value', true, 'properties');
  }

  // Options arrays
  const rowSelectionsOptions = useMemo(
    () => [
      'allowSelection',
      ...(allowSelection
        ? ['highlightSelectedRow', 'showBulkSelector', 'defaultSelectedRow', 'selectRowOnCellEdit']
        : []),
    ],
    [allowSelection]
  );

  const searchSortFilterOptions = useMemo(
    () => [
      ...(displaySearchBox ? ['displaySearchBox'] : []),
      ...(displayServerSideSearch ? ['serverSideSearch'] : []),
      'enabledSort',
      ...(enabledSort ? ['serverSideSort'] : []),
      'showFilterButton',
      ...(displayServerSideFilter ? ['serverSideFilter'] : []),
    ],
    [displaySearchBox, displayServerSideSearch, enabledSort, displayServerSideFilter]
  );

  const paginationOptions = useMemo(
    () => [
      'enablePagination',
      ...(enablePagination ? ['serverSidePagination'] : []),
      ...(enablePagination && !serverSidePagination ? ['rowsPerPage'] : []),
      ...(enablePagination && serverSidePagination ? ['enablePrevButton', 'enableNextButton', 'totalRecords'] : []),
    ],
    [enablePagination, serverSidePagination]
  );

  const additionalActions = [
    'showAddNewRowButton',
    'showDownloadButton',
    'hideColumnSelectorButton',
    'loadingState',
    'showBulkUpdateActions',
    'visibility',
    'disabledState',
    'dynamicHeight',
  ];

  // Accordion items
  const accordionItems = useMemo(
    () => [
      // Data section
      {
        title: 'Data',
        children: (
          <>
            {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'dataSourceSelector',
              'properties',
              currentState,
              components,
              darkMode,
              false
            )}
            {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              'data',
              'properties',
              currentState,
              components,
              darkMode,
              false
            )}
          </>
        ),
      },
      // Columns section
      {
        title: 'Columns',
        children: (
          <div>
            <div>{renderCustomElement('useDynamicColumn')}</div>
            {useDynamicColumn && <div>{renderCustomElement('columnData')}</div>}
            {!useDynamicColumn && (
              <List>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="droppable">
                    {({ innerRef, droppableProps, placeholder }) => (
                      <div className="w-100 d-flex custom-gap-4 flex-column" {...droppableProps} ref={innerRef}>
                        {filteredColumns.map((item, index) => {
                          const resolvedItemName = getSafeRenderableValue(resolveReferences(item.name));
                          const isEditable = resolveReferences(item.isEditable);
                          const columnVisibility = item?.columnVisibility ?? true;

                          return (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={getDraggableStyle(snapshot.isDragging, provided.draggableProps.style)}
                                >
                                  <OverlayTrigger
                                    trigger="click"
                                    placement="left"
                                    rootClose={isRootCloseEnabled}
                                    overlay={renderColumnPopover(item, index)}
                                    onToggle={(show) => handleToggleColumnPopover(index, show)}
                                  >
                                    <div className="table-column-lists">
                                      <List.Item
                                        isDraggable
                                        primaryText={resolvedItemName}
                                        secondaryText={getColumnTypeDisplayText(item?.columnType)}
                                        data-cy={`column-${resolvedItemName}`}
                                        enableActionsMenu={false}
                                        isEditable={isEditable}
                                        onMenuOptionClick={(listItem, menuOptionLabel) => {
                                          if (menuOptionLabel === 'Delete') {
                                            removeColumn(index, `${item.name}-${index}`);
                                          } else if (menuOptionLabel === 'copyColumn') {
                                            duplicateColumn(index);
                                          }
                                        }}
                                        darkMode={darkMode}
                                        showIconOnHover
                                        deleteIconOutsideMenu
                                        showCopyColumnOption
                                        showVisibilityIcon
                                        isColumnVisible={resolveReferences(columnVisibility)}
                                        className={activeColumnPopoverIndex === index ? 'active-column-list' : ''}
                                        columnType={item?.columnType}
                                        isDeprecated={checkIfTableColumnDeprecated(item?.columnType)}
                                        Icon={getColumnIcon(item?.columnType)}
                                      />
                                    </div>
                                  </OverlayTrigger>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <div style={{ marginTop: '8px' }}>
                  {columns?.length === 0 && <NoListItem text="There are no columns" dataCy="-columns" />}
                  <div className="mb-2">
                    <AddNewButton dataCy="button-add-column" onClick={addColumn}>
                      {t('widget.Table.addNewColumn', ' Add new column')}
                    </AddNewButton>
                  </div>
                  <ProgramaticallyHandleProperties
                    label="Make all columns editable"
                    currentState={currentState}
                    darkMode={darkMode}
                    callbackFunction={(index, property, value) => setAllColumnsEditable(value)}
                    property="isAllColumnsEditable"
                    props={{ isAllColumnsEditable: `{{${isAllColumnsEditable}}}` }}
                    component={component}
                    paramMeta={{ type: 'toggle', displayName: 'Make all columns editable', isFxNotRequired: true }}
                    paramType="properties"
                  />
                </div>
              </List>
            )}
          </div>
        ),
      },
      // Action buttons section
      {
        title: 'Action buttons',
        children: (
          <div className="field">
            <div className="row g-2">
              <div>{actions.map((action, index) => renderActionButton(action, index))}</div>
              {actions.length === 0 && (
                <div className="mb-3">
                  <NoListItem text="No action buttons" dataCy="-action-button" />
                </div>
              )}
              <AddNewButton dataCy="button-add-new-action-button" onClick={addAction} className="mt-0">
                New action button
              </AddNewButton>
            </div>
          </div>
        ),
      },
      // Events section
      {
        title: 'Events',
        isOpen: true,
        children: (
          <EventManager
            component={component}
            sourceId={component?.id}
            eventSourceType="component"
            eventMetaDefinition={componentMeta}
            currentState={currentState}
            dataQueries={dataQueries}
            components={components}
            eventsChanged={eventsChanged}
            apps={apps}
            pages={pages}
          />
        ),
      },
      // Row Selection section
      {
        title: 'Row Selection',
        children: rowSelectionsOptions.map((option) => renderCustomElement(option)),
      },
      // Search, sort and filter section
      {
        title: 'Search, sort and filter',
        children: searchSortFilterOptions.map((option) => renderCustomElement(option)),
      },
      // Pagination section
      {
        title: 'Pagination',
        children: paginationOptions.map((option) => renderCustomElement(option)),
      },
      // Additional actions section
      {
        title: 'Additional actions',
        children: additionalActions.map((option) => renderCustomElement(option)),
      },
      // Devices section
      {
        title: 'Devices',
        isOpen: true,
        children: (
          <>
            {renderElement(
              component,
              componentMeta,
              layoutPropertyChanged,
              dataQueries,
              'showOnDesktop',
              'others',
              currentState,
              components
            )}
            {renderElement(
              component,
              componentMeta,
              layoutPropertyChanged,
              dataQueries,
              'showOnMobile',
              'others',
              currentState,
              components
            )}
          </>
        ),
      },
    ],
    [
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      currentState,
      components,
      darkMode,
      renderCustomElement,
      useDynamicColumn,
      handleDragEnd,
      filteredColumns,
      isRootCloseEnabled,
      renderColumnPopover,
      handleToggleColumnPopover,
      removeColumn,
      duplicateColumn,
      activeColumnPopoverIndex,
      columns,
      addColumn,
      t,
      setAllColumnsEditable,
      isAllColumnsEditable,
      actions,
      renderActionButton,
      addAction,
      eventsChanged,
      apps,
      pages,
      rowSelectionsOptions,
      searchSortFilterOptions,
      paginationOptions,
      layoutPropertyChanged,
    ]
  );

  return <Accordion items={accordionItems} />;
};
