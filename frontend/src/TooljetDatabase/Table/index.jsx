import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isEmpty } from 'lodash';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';
import TableFooter from './Footer';
import { isSqlModeDisabled, isTableMissingFromEnvironment } from '../constants';
import TjdbTableHeader from './Header';
import { AddDataMenu } from './AddDataMenu';
import { TableGrid } from './Grid/TableGrid';
import { LinkButton } from '@/components/ui/Rocket/LinkButton/LinkButton';
import { EmptyAndNoResultsState } from '@/components/ui/Rocket/EmptyAndNoResultsState/EmptyAndNoResultsState';
import {
  convertDateToTimeZoneFormatted,
  getLocalTimeZone,
} from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import { useTjdbStore, useTjdbActions, selectView } from '../_stores/tjdbStore';
import './styles.scss';

const TIMESTAMP_TYPE = 'timestamp with time zone';

const Table = () => {
  const {
    organizationId,
    tables,
    columns,
    selectedTable,
    selectedTableData,
    setColumns,
    rowsLoading,
    rowsRefetching,
    setForeignKeys,
    configurations,
    setConfigurations,
    getConfigurationProperty,
    canEditTjdb,
    canEditSchema,
    totalRecords,
  } = useTooljetDatabaseContext();
  const selectedEnvironment = useTjdbStore((state) => state.selectedEnvironment);
  const developmentEnvironment = useTjdbStore((state) => state.environments.find((env) => env.priority === 1));
  const hasQueryFilters = useTjdbStore((state) => Object.keys(selectView(state).queryFilters).length > 0);
  const selectedTableMissingFromEnvironment = isTableMissingFromEnvironment(
    tables,
    selectedTable.id,
    selectedEnvironment
  );
  const {
    registerEnvironmentSwitchHandler,
    fetchTableMetadata: fetchMetadata,
    setQueryFilters,
    openTableView,
    setScrollTop,
    switchEnvironment,
  } = useTjdbActions();

  // Read, not subscribed to: the grid uses it once, when its rows first render, and its own reports would otherwise
  // re-render this page after every scroll pause.
  const initialScrollTop = useTjdbStore.getState().views[selectedTable.id]?.scrollTop ?? 0;
  const tableId = selectedTable.id;
  const handleScrollEnd = useCallback((scrollTop) => setScrollTop(tableId, scrollTop), [setScrollTop, tableId]);

  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);
  const [isBulkUploadDrawerOpen, setIsBulkUploadDrawerOpen] = useState(false);
  const [isSeedDataDrawerOpen, setIsSeedDataDrawerOpen] = useState(false);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);
  const [filterEnable, setFilterEnable] = useState(false);

  const prevSelectedTableRef = useRef({});

  const fetchTableMetadata = async () => {
    if (isEmpty(selectedTable)) {
      setColumns([]);
      return;
    }
    const metadata = await fetchMetadata(organizationId, selectedTable.table_name);
    if (!metadata) return;
    setConfigurations(metadata.configurations);
    if (metadata.columns.length > 0) setColumns(metadata.columns);
    setForeignKeys([...metadata.foreignKeys]);
  };

  useEffect(() => {
    if (prevSelectedTableRef.current.id !== selectedTable.id && !isEmpty(selectedTable)) {
      openTableView(selectedTable.id);
      // A table staging lacks cannot load there; the fallback effect below moves to Development and loads it.
      if (!selectedTableMissingFromEnvironment) fetchTableMetadata();
    }
    prevSelectedTableRef.current = selectedTable;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  // Steps 3-5 of the ordered environment switch (see switchEnvironment in tjdbStore.js). This
  // component owns every derived cache involved, which is why the store calls back into it rather
  // than trying to hold them itself.
  // Rows need no step here: the environment is part of their query key, so the new environment's read starts on its own.
  const handleEnvironmentSwitch = async () => {
    setColumns([]);
    setConfigurations({});
    setForeignKeys([]);
    await fetchTableMetadata();
  };

  // Deliberately no dependency array: re-registering on every render is what keeps the handler's
  // closure over selectedTable/columns fresh. The store slot holds exactly one handler, so this is
  // an assignment, not an accumulating subscription.
  useEffect(() => {
    registerEnvironmentSwitchHandler(handleEnvironmentSwitch);
    return () => registerEnvironmentSwitchHandler(null);
  });

  // After the handler registration above, so the switch runs the handler for this render's table.
  useEffect(() => {
    if (selectedTableMissingFromEnvironment && developmentEnvironment) switchEnvironment(developmentEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTableMissingFromEnvironment, selectedTable.id]);

  // Primary keys first, as the grid pins the first of them next to the checkbox column.
  const gridColumns = useMemo(
    () =>
      [
        ...columns.filter((column) => column.constraints_type?.is_primary_key),
        ...columns.filter((column) => !column.constraints_type?.is_primary_key),
      ].map((column) => {
        if (column.dataType !== TIMESTAMP_TYPE) return column;
        const timeZone = getConfigurationProperty(column.Header, 'timezone', getLocalTimeZone());
        return { ...column, formatValue: (value) => convertDateToTimeZoneFormatted(value, timeZone) };
      }),
    // getConfigurationProperty is rebuilt every render and only reads `configurations`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, configurations]
  );

  // The grid works on raw rows: row ids and the delete filter come from them. Timestamps are shown in the time zone
  // configured for their column, which is data the grid knows nothing about, so the column carries the formatter.
  const gridRows = selectedTableData;

  if (!selectedTable) return null;

  const isEmptyTable = gridRows.length === 0 && !rowsLoading;
  // Only a table with no rows at all loses the add row. A filter with no match, or a page emptied by a delete while the
  // table has more, keeps it mounted: unmounting would drop an inline draft.
  const hasNoRowsAtAll = isEmptyTable && !hasQueryFilters && !totalRecords;

  return (
    <div>
      <TjdbTableHeader
        isCreateColumnDrawerOpen={isCreateColumnDrawerOpen}
        setIsCreateColumnDrawerOpen={setIsCreateColumnDrawerOpen}
        isCreateRowDrawerOpen={isCreateRowDrawerOpen}
        setIsCreateRowDrawerOpen={setIsCreateRowDrawerOpen}
        setIsBulkUploadDrawerOpen={setIsBulkUploadDrawerOpen}
        isBulkUploadDrawerOpen={isBulkUploadDrawerOpen}
        isSeedDataDrawerOpen={isSeedDataDrawerOpen}
        setIsSeedDataDrawerOpen={setIsSeedDataDrawerOpen}
        setFilterEnable={setFilterEnable}
      />
      {/* 48px navbar + 48px toolbar + the 48px page footer, plus whatever the page puts above the table (the tab strip). */}
      <div
        className="tw-flex tw-flex-col"
        style={{ height: 'calc(100vh - 144px - var(--tjdb-above-table, 0px))' }}
        data-cy="tjdb-table-area"
      >
        <div className={isEmptyTable ? 'tw-shrink-0' : 'tw-min-h-0 tw-flex-1'}>
          <TableGrid
            key={selectedTable.id}
            initialScrollTop={initialScrollTop}
            onScrollEnd={handleScrollEnd}
            columns={gridColumns}
            rows={gridRows}
            isLoading={rowsLoading}
            isRefetching={rowsRefetching}
            canEditSchema={canEditSchema}
            canSelectRows={canEditTjdb}
            canEditCells={canEditTjdb}
            canAddRows={canEditTjdb && !hasNoRowsAtAll}
            onAddColumn={() => setIsCreateColumnDrawerOpen(true)}
          />
        </div>
        {isEmptyTable && (
          <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center">
            {filterEnable ? (
              <EmptyAndNoResultsState
                variant="no-results"
                action={<LinkButton onClick={() => setQueryFilters({})}>Clear filters</LinkButton>}
              />
            ) : (
              <EmptyAndNoResultsState
                variant="empty"
                action={
                  <AddDataMenu
                    onAddRow={() => setIsCreateRowDrawerOpen(true)}
                    onBulkUpload={() => setIsBulkUploadDrawerOpen(true)}
                    onSeedData={() => setIsSeedDataDrawerOpen(true)}
                    hideSeedDataOption={isSqlModeDisabled()}
                  />
                }
              />
            )}
          </div>
        )}
      </div>
      <TableFooter dataLoading={rowsLoading || rowsRefetching} />
    </div>
  );
};

export default Table;
