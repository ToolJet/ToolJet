import React, { useEffect, useMemo, useCallback, useId, useRef, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import generateColumnsData from '../../../_utils/generateColumnsData';
import {
  getAddNewRowColumns,
  getColumnSelectOptions,
  getIncludedTableColumns,
  hasColumnValidation,
  resolveAddNewRowIn,
} from '../../../_utils/addNewRowConfig';
import useStore from '@/AppBuilder/_stores/store';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/Rocket';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { validateNewRowField } from '../../../_utils/validateNewRowField';
import { AddNewRowForm } from './AddNewRowForm';
import {
  getFieldKind,
  getFieldLayout,
  TextControl,
  TextAreaControl,
  NumberControl,
  SelectControl,
  ChipsControl,
  SwitchControl,
  JsonControl,
  RichTextControl,
  RendererControl,
} from './AddNewRowFields';

const FOCUSABLE_SELECTOR = 'input, textarea, [role="combobox"], [role="button"], button';

const coreRowModel = getCoreRowModel();

export function AddNewRow({
  id,
  hideAddNewRowPopup,
  darkMode,
  allColumns: allTableColumns,
  fireEvent,
  setExposedVariables,
}) {
  const { moduleId } = useModuleContext();
  const columnProperties = useTableStore((state) => state.getColumnProperties(id), shallow);
  const columnSizes = useTableStore((state) => state.getTableProperties(id)?.columnSizes, shallow);
  const addNewRowDetails = useTableStore((state) => state.getAllAddNewRowDetails(id), shallow);
  const updateAddNewRowDetails = useTableStore((state) => state.updateAddNewRowDetails, shallow);
  const clearAddNewRowDetails = useTableStore((state) => state.clearAddNewRowDetails, shallow);
  const updateShouldPersistAddNewRow = useTableStore((state) => state.updateShouldPersistAddNewRow, shallow);
  const addNewRowColumns = useTableStore((state) => state.getTableProperties(id)?.addNewRowColumns, shallow);
  const placement = resolveAddNewRowIn(useTableStore((state) => state.getTableProperties(id)?.addNewRowIn, shallow));
  const allColumns = useMemo(
    () => getIncludedTableColumns(allTableColumns, addNewRowColumns),
    [allTableColumns, addNewRowColumns]
  );
  const baseId = useId();
  // What had focus when the form opened (the footer's add button). A Radix dialog returns focus only to its own
  // trigger, and this one has none, so the dialog puts it back here when it closes.
  const openerRef = useRef(null);
  if (openerRef.current === null && typeof document !== 'undefined') openerRef.current = document.activeElement;
  // errors stay hidden until Add row is clicked once; after that they follow the edits
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const addNewRowDetailsLength = addNewRowDetails.size;

  const newEmptyRow = useMemo(() => {
    return allColumns.reduce((accumulator, column) => {
      if (column.columnDef?.meta?.skipAddNewRow) return accumulator;
      const key = column.columnDef.accessorKey;
      accumulator[key] = '';
      return accumulator;
    }, {});
  }, [allColumns]);

  useEffect(() => {
    clearAddNewRowDetails(id);
    updateShouldPersistAddNewRow(id, false);
  }, [updateShouldPersistAddNewRow, clearAddNewRowDetails, id]);

  useEffect(() => {
    function discardNewlyAddedRows() {
      clearAddNewRowDetails(id);
      hideAddNewRowPopup();
    }
    setExposedVariables({ discardNewlyAddedRows });
  }, [clearAddNewRowDetails, setExposedVariables, id, hideAddNewRowPopup]);

  useEffect(() => {
    if (addNewRowDetailsLength === 0) {
      updateAddNewRowDetails(id, addNewRowDetailsLength, newEmptyRow);
    }
  }, [addNewRowDetailsLength, id, newEmptyRow, updateAddNewRowDetails]);

  const handleCellValueChange = useCallback(
    (index, name, value, row) => {
      const rowDetails = addNewRowDetails.get(index) ?? row;
      updateAddNewRowDetails(id, index, { ...rowDetails, [name]: value });
    },
    [addNewRowDetails, id, updateAddNewRowDetails]
  );

  const addRowTableRef = useRef();

  const columns = useMemo(
    () =>
      [
        ...generateColumnsData({
          columnProperties: getAddNewRowColumns(columnProperties, addNewRowColumns).map((column) => ({
            ...column,
            isEditable: true,
          })),
          columnSizes: columnSizes ?? {},
          defaultColumn: { width: 150 },
          tableData: addNewRowDetailsLength > 0 ? [...addNewRowDetails.values()] : [newEmptyRow],
          id,
          darkMode,
          fireEvent: () => {},
          tableRef: addRowTableRef,
          handleCellValueChange,
          searchText: '',
          columnForAddNewRow: true,
          moduleId,
        }).filter(Boolean),
      ].filter(Boolean),
    [
      id,
      columnProperties,
      addNewRowColumns,
      columnSizes,
      darkMode,
      handleCellValueChange,
      newEmptyRow,
      addNewRowDetails,
      addNewRowDetailsLength,
      moduleId,
    ]
  );

  // Fresh data or row model on every render makes the table reset its page index, which re-renders this form,
  // which hands it fresh data again, without end. Keep both stable and turn the reset off (nothing paginates here).
  const rowsData = useMemo(() => [...addNewRowDetails.values()], [addNewRowDetails]);
  const table = useReactTable({
    data: rowsData,
    columns: columns,
    getCoreRowModel: coreRowModel,
    autoResetAll: false,
  });

  const row = table.getRowModel().rows[0];

  const fields = (row?.getVisibleCells() ?? []).map((cell, index) => {
    const { columnDef } = cell.column;
    const key = columnDef.accessorKey;
    const columnType = columnDef.meta?.columnType;
    const label = typeof columnDef.header === 'string' ? columnDef.header : String(key ?? cell.column.id);
    const labelId = `${baseId}-label-${index}`;
    const value = addNewRowDetails.get(row.index)?.[key];
    const onChange = (newValue) => handleCellValueChange(row.index, key, newValue, row.original);
    const { validateWidget, validateDates } = useStore.getState();
    const validation = validateNewRowField(columnDef.meta, value, { validateWidget, validateDates, moduleId });
    const error = submitAttempted && !validation.isValid ? (validation.validationError ?? 'Invalid value') : null;
    const errorId = `${baseId}-error-${index}`;
    const invalid = !!error;
    const columnConfig = columnDef.meta ?? {};
    const resolve = (resolvable) =>
      useStore.getState().getResolvedValue(resolvable, { cellValue: value, rowData: row.original }, moduleId);
    const kind = getFieldKind(columnType, { allowMultipleTags: !!resolve(columnConfig.allowMultipleSelection) });
    const options = kind === 'select' || kind === 'chips' ? getColumnSelectOptions(columnConfig, resolve) : [];
    const defaultOptions =
      columnConfig.useDynamicOptions && resolve(columnConfig.useDynamicOptions)
        ? []
        : (columnConfig.defaultOptionsList ?? []);

    let control;
    if (kind === 'text')
      control = (
        <TextControl
          labelId={labelId}
          value={value}
          onChange={onChange}
          columnType={columnType}
          invalid={invalid}
          errorId={errorId}
        />
      );
    else if (kind === 'textarea')
      control = (
        <TextAreaControl labelId={labelId} value={value} onChange={onChange} invalid={invalid} errorId={errorId} />
      );
    else if (kind === 'number')
      control = (
        <NumberControl labelId={labelId} value={value} onChange={onChange} invalid={invalid} errorId={errorId} />
      );
    else if (kind === 'switch') control = <SwitchControl labelId={labelId} value={value} onChange={onChange} />;
    else if (kind === 'json')
      control = <JsonControl labelId={labelId} value={value} onChange={onChange} invalid={invalid} errorId={errorId} />;
    else if (kind === 'richtext')
      control = (
        <RichTextControl
          labelId={labelId}
          value={value}
          onChange={onChange}
          columnType={columnType}
          darkMode={darkMode}
          invalid={invalid}
          errorId={errorId}
        />
      );
    else if (kind === 'select')
      control = (
        <SelectControl
          labelId={labelId}
          options={options}
          value={value}
          defaultValue={defaultOptions.slice(-1)[0]?.value}
          placeholder={columnConfig.placeholder}
          onChange={onChange}
          darkMode={darkMode}
          invalid={invalid}
          errorId={errorId}
        />
      );
    else if (kind === 'chips')
      control = (
        <ChipsControl
          labelId={labelId}
          options={options}
          value={value}
          defaultValues={defaultOptions.map((option) => option.value)}
          placeholder={columnConfig.placeholder}
          onChange={onChange}
          darkMode={darkMode}
          invalid={invalid}
          errorId={errorId}
        />
      );
    else
      control = (
        <RendererControl invalid={invalid}>
          {flexRender(columnDef.cell, { ...cell.getContext(), isEditable: true })}
        </RendererControl>
      );

    const hookName = generateCypressDataCy(label);
    return {
      key: cell.id,
      label,
      labelId,
      dataCy: `${hookName}-column-${row.index}`,
      headerDataCy: `${hookName}-column-header`,
      layout: getFieldLayout(columnType),
      hasValidation: hasColumnValidation(columnConfig),
      isValid: validation.isValid,
      error,
      errorId,
      control,
    };
  });

  // Cancel, Escape and the dialog closing all do the same: tell the app, close, drop what was typed.
  const handleCancel = () => {
    fireEvent('onAddNewRowCancelled');
    hideAddNewRowPopup();
    clearAddNewRowDetails(id);
  };

  const handleSubmit = async () => {
    const firstInvalid = fields.find((field) => !field.isValid);
    if (firstInvalid) {
      setSubmitAttempted(true);
      addRowTableRef.current
        ?.querySelector(`[data-cy="${firstInvalid.dataCy}"]`)
        ?.querySelector(FOCUSABLE_SELECTOR)
        ?.focus();
      return;
    }
    await fireEvent('onNewRowsAdded');
    hideAddNewRowPopup();
  };

  const form = (variant) => (
    <AddNewRowForm
      variant={variant}
      fields={fields}
      darkMode={darkMode}
      bodyRef={addRowTableRef}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onEscape={handleCancel}
    />
  );

  if (placement === 'dialog') {
    return (
      <Dialog open onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          // a click on the backdrop must not throw away a half-filled form; Escape and Cancel still close it
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={() => openerRef.current?.focus?.()}
          className={cn(
            'tw-max-h-[min(80vh,720px)] tw-max-w-[500px] tw-overflow-hidden',
            darkMode && 'dark-theme theme-dark'
          )}
        >
          {form('dialog')}
        </DialogContent>
      </Dialog>
    );
  }

  return form('popover');
}
