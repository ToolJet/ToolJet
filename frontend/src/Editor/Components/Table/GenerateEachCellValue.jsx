import React, { useEffect, useRef } from 'react';
import _ from 'lodash';
import { validateWidget } from '@/_helpers/utils';

export default function GenerateEachCellValue({
  cellValue,
  globalFilter,
  cellRender,
  rowChangeSet,
  rowData,
  isEditable,
  columnType,
  isColumnTypeAction,
  cellTextColor,
  cell,
  currentState,
}) {
  const updateCellValue = useRef();
  const [showHighlightedCells, setHighlighterCells] = React.useState(globalFilter ? true : false);
  const columnTypeAllowToRenderMarkElement = ['text', 'string', 'default', 'number', undefined];
  let validationData = {};
  if (cell.column.isEditable && showHighlightedCells) {
    if (cell.column.columnType === 'number') {
      validationData = {
        ...validateWidget({
          validationObject: {
            minValue: {
              value: cell.column.minValue,
            },
            maxValue: {
              value: cell.column.maxValue,
            },
          },
          widgetValue: cellValue,
          currentState,
          customResolveObjects: { cellValue },
        }),
      };
    }
    if (['string', undefined, 'default', 'text'].includes(cell.column.columnType)) {
      validationData = {
        ...validateWidget({
          validationObject: {
            regex: {
              value: cell.column.regex,
            },
            minLength: {
              value: cell.column.minLength,
            },
            maxLength: {
              value: cell.column.maxLength,
            },
            customRule: {
              value: cell.column.customRule,
            },
          },
          widgetValue: cellValue,
          currentState,
          customResolveObjects: { cellValue },
        }),
      };
    }
  }

  useEffect(() => {
    if (_.isEmpty(rowChangeSet)) {
      setHighlighterCells(true);
    }
  }, [rowData, rowChangeSet]);

  let htmlElement = cellValue;
  if (cellValue?.toString()?.toLowerCase().includes(globalFilter?.toLowerCase())) {
    if (globalFilter) {
      var normReq = globalFilter
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .sort((a, b) => b.length - a.length);
      htmlElement = cellValue
        .toString()
        .replace(new RegExp(`(${normReq.join('|')})`, 'gi'), (match) => `<mark>${match}</mark>`);
    }
  }
  return (
    <div
      onClick={(e) => {
        if (isEditable && !showHighlightedCells) e.stopPropagation();
        if (isEditable && columnTypeAllowToRenderMarkElement.includes(columnType)) {
          setHighlighterCells(false);
        }
      }}
      onBlur={(e) => {
        e.persist();
        updateCellValue.current = e.target.value;
        if (!showHighlightedCells && updateCellValue.current === cellValue && _.isEmpty(rowChangeSet)) {
          updateCellValue.current = null;
          setHighlighterCells(true);
        }
      }}
      className="w-100 h-100"
    >
      {!isColumnTypeAction && columnTypeAllowToRenderMarkElement.includes(columnType) && showHighlightedCells ? (
        <div className="d-flex justify-content-center flex-column w-100 h-100">
          <div
            style={{ color: cellTextColor }}
            dangerouslySetInnerHTML={{
              __html: htmlElement,
            }}
          ></div>
          <div
            style={{
              display: cell.column.isEditable && validationData.validationError ? 'block' : 'none',
              width: '100%',
              marginTop: ' 0.25rem',
              fontSize: ' 85.7142857%',
              color: '#d63939',
            }}
          >
            {validationData.validationError}
          </div>
        </div>
      ) : (
        cellRender
      )}
    </div>
  );
}
