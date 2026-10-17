import React, { memo } from 'react';
import cx from 'classnames';
import { flexRender } from '@tanstack/react-table';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { getPinnedStyles } from '../pinColumnsUtils';
import { useTableCellSettings } from '../TableCellSettings';

/**
 * A row of the table: the row element, placed at `top` (rows move while scrolling), and its cells in TableRowCells,
 * which doesn't take the position: moving a row doesn't re-render its cells. Anything else that re-rendered the table
 * reaches the cells through `renderVersion` (and `tableState`, `isSelected`), so they re-render as they did before.
 */
export const TableRow = memo(function TableRow({
  id,
  row,
  index,
  top,
  isSelected,
  cellHeight,
  handleRowClick,
  allowSelection,
  highlightSelectedRow,
  setExposedVariables,
  fireEvent,
  rowStyles,
  measureElement,
  componentName,
  ...cellProps
}) {
  const { hasHoveredEvent } = useTableCellSettings(id);

  if (!row) return null;

  return (
    <tr
      ref={measureElement}
      data-index={index}
      style={{
        position: 'absolute',
        top,
        left: 0,
        width: '100%',
        ...rowStyles,
      }}
      className={cx('table-row table-editor-component-row', {
        selected: allowSelection && highlightSelectedRow && isSelected,
        'table-row-condensed': cellHeight === 'condensed',
      })}
      onClick={(e) => {
        const isCheckbox = e?.target?.classList.contains('table-selector-checkbox-icon') ?? false;
        handleRowClick(row, isCheckbox);
      }}
      onMouseEnter={() => {
        if (hasHoveredEvent) {
          const hoveredRowDetails = { hoveredRowId: row.id, hoveredRow: row.original };
          setExposedVariables(hoveredRowDetails);
          fireEvent('onRowHovered');
        }
      }}
      data-cy={`${generateCypressDataCy(componentName)}-row-${index}`}
    >
      <TableRowCells
        id={id}
        row={row}
        index={index}
        isSelected={isSelected}
        cellHeight={cellHeight}
        allowSelection={allowSelection}
        setExposedVariables={setExposedVariables}
        fireEvent={fireEvent}
        componentName={componentName}
        {...cellProps}
      />
    </tr>
  );
});

// A value the cell resolves against its row, or one getResolvedValue returns as it is (the same test it uses).
const isTemplate = (value) => typeof value === 'string' && value.includes('{{') && value.includes('}}');
// What getResolvedValue returns for a value whatever the row: one that isn't a template, or `{{true}}` / `{{false}}`
// (as columns save these). VARIES for anything else.
const VARIES = Symbol('varies');
const constantOf = (value) => {
  if (!isTemplate(value)) return value;
  const literal = /^\{\{\s*(true|false)\s*\}\}$/.exec(value);
  return literal ? literal[1] === 'true' : VARIES;
};
const PINNED_BACKGROUND = 'var(--cc-table-pinned-column-bg, var(--cc-surface1-surface))';
const UNSET_BACKGROUNDS = [undefined, null, '', 'inherit', 'transparent'];
const backgroundOf = (pinnedPosition, background) =>
  pinnedPosition && UNSET_BACKGROUNDS.includes(background) ? PINNED_BACKGROUND : (background ?? 'inherit');

/**
 * What every cell of a column shares: its classes (in the order a cell lists them, around the ones that depend on the
 * cell), style, data-cy prefix, and its background and editability unless they read the row. Built once per column for
 * a render of the table (`columnPlans`), where each cell built it for itself.
 */
function columnPlan(column, table, cellHeight, contentWrap, componentName) {
  const meta = column.columnDef?.meta;
  const columnType = meta?.columnType;
  const isButtonColumn = columnType === 'button';
  const { pinnedPosition, isPinnedBoundary, style: pinnedStyles } = getPinnedStyles({ column, table });
  const style = {
    justifyContent: isButtonColumn ? undefined : determineJustifyContentValue(meta?.horizontalAlignment),
    display: 'flex',
    alignItems: 'center',
    textAlign: isButtonColumn ? undefined : meta?.horizontalAlignment,
    width: column.getSize(),
    flex: '0 0 auto',
    ...pinnedStyles,
  };
  const background = meta?.cellBackgroundColor;
  const editable = meta?.isEditable ?? false;
  return {
    columnType,
    pinnedPosition,
    style,
    background: isTemplate(background) ? null : { backgroundColor: backgroundOf(pinnedPosition, background), ...style },
    backgroundTemplate: background,
    editable: constantOf(editable),
    editableTemplate: editable,
    dataCy: `${generateCypressDataCy(componentName)}-${generateCypressDataCy(
      typeof column.columnDef?.header === 'string' ? column.columnDef?.header : column.id
    )}-row-`,
    containerClass: `td-container ${columnType === 'image' && 'jet-table-image-column h-100'} ${
      columnType !== 'image' && `w-100 h-100`
    }`,
    classBefore: cx('table-cell td', {
      'has-actions': column.id === 'rightActions' || column.id === 'leftActions' || columnType === 'button',
      'has-left-actions': column.id === 'leftActions',
      'has-right-actions': column.id === 'rightActions',
      'table-text-align-center': meta?.horizontalAlignment === 'center',
      'table-text-align-right': meta?.horizontalAlignment === 'right',
      'table-text-align-left': meta?.horizontalAlignment === 'left',
      'wrap-wrapper': contentWrap,
    }),
    classMiddle: cx({
      'has-datepicker': columnType === 'datepicker',
      'has-number': columnType === 'number',
      'has-badge': ['badge', 'badges'].includes(columnType),
      [cellHeight]: true,
      'overflow-hidden': ['text', 'string', undefined, 'number'].includes(columnType) && !contentWrap,
      'selector-column': columnType === 'selector',
      'has-select': ['select', 'newMultiSelect', 'tagsV2'].includes(columnType),
      'has-tags': columnType === 'tags',
      'has-link': columnType === 'link',
      'has-radio': columnType === 'radio',
      'has-toggle': columnType === 'toggle',
      'has-textarea': ['string', 'text'].includes(columnType),
      'has-multiselect': columnType === 'multiselect',
      'has-dropdown': columnType === 'dropdown',
    }),
    classAfter: cx({
      'pinned-column': !!pinnedPosition,
      'pinned-column-left': pinnedPosition === 'left',
      'pinned-column-right': pinnedPosition === 'right',
      'pinned-column-boundary-left': pinnedPosition === 'left' && isPinnedBoundary,
      'pinned-column-boundary-right': pinnedPosition === 'right' && isPinnedBoundary,
    }),
  };
}

const TableRowCells = memo(function TableRowCells({
  id,
  row,
  index,
  cellHeight,
  getResolvedValue,
  allowSelection,
  contentWrap,
  setExposedVariables,
  fireEvent,
  componentName,
  table,
  columnPlans,
}) {
  const { selectRowOnCellEdit } = useTableCellSettings(id);
  const editedFields = useTableStore((state) => state.getEditedFieldsOnIndex(id, row.index), shallow);
  const plans = columnPlans ?? new Map();

  return row.getVisibleCells().map((cell) => {
    let plan = plans.get(cell.column.id);
    if (!plan) {
      plan = columnPlan(cell.column, table, cellHeight, contentWrap, componentName);
      plans.set(cell.column.id, plan);
    }
    const rowScope = () => ({ rowData: row.original, cellValue: cell.getValue() });
    const cellStyles = plan.background ?? {
      backgroundColor: backgroundOf(plan.pinnedPosition, getResolvedValue(plan.backgroundTemplate, rowScope())),
      ...plan.style,
    };
    const isEditable = plan.editable !== VARIES ? plan.editable : getResolvedValue(plan.editableTemplate, rowScope());
    const isEdited = editedFields?.[cell.column.columnDef?.accessorKey] || false;

    return (
      <td
        key={cell.id}
        data-cy={`${plan.dataCy}${index}`}
        style={cellStyles}
        className={cx(
          plan.classBefore,
          { 'has-text': plan.columnType === 'text' || isEditable },
          plan.classMiddle,
          { isEditable: isEditable, isEdited: isEdited },
          plan.classAfter
        )}
        onClick={(e) => {
          const columnType = cell.column.columnDef?.meta?.columnType;

          setExposedVariables({
            selectedCell: {
              columnName: cell.column.columnDef?.header,
              columnKey: cell.column.columnDef?.accessorKey,
              value: cell.getValue(),
            },
          });

          // These cell clicks keep the current selection (already-selected action/button cells,
          // or an editable cell) and fire onRowClicked directly.
          const keepsSelectionAndFires =
            (['rightActions', 'leftActions'].includes(cell.column.id) && allowSelection && row.getIsSelected()) ||
            (columnType === 'button' && allowSelection && row.getIsSelected()) ||
            (isEditable && allowSelection && (!selectRowOnCellEdit || row.getIsSelected()));

          if (keepsSelectionAndFires) {
            e.stopPropagation();
            fireEvent('onRowClicked');
          }
        }}
      >
        <div className={plan.containerClass}>{flexRender(cell.column?.columnDef?.cell, cell.getContext())}</div>
      </td>
    );
  });
});
