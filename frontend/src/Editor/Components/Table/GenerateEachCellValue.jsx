import React, { useEffect, useRef } from 'react';
import _ from 'lodash';

export default function GenerateEachCellValue({
  cellValue,
  globalFilter,
  cellRender,
  rowChangeSet,
  rowData,
  isEditable,
  columnType,
  isColumnTypeAction,
}) {
  const updateCellValue = useRef();
  const [showHighlightedCells, setHighlighterCells] = React.useState(globalFilter ? true : false);
  const columnTypeAllowToRenderMarkElement = ['text', 'string', 'default', 'number', undefined];

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
        e.persist();
        if (isEditable && columnTypeAllowToRenderMarkElement.includes(columnType)) {
          setHighlighterCells(false);
        }
      }}
      onMouseLeave={(e) => {
        e.persist();
        updateCellValue.current = e.target.value;
        if (!showHighlightedCells && updateCellValue.current === cellValue && _.isEmpty(rowChangeSet)) {
          updateCellValue.current = null;
          setHighlighterCells(true);
        }
      }}
    >
      {!isColumnTypeAction && columnTypeAllowToRenderMarkElement.includes(columnType) && showHighlightedCells ? (
        <span
          dangerouslySetInnerHTML={{
            __html: htmlElement,
          }}
        ></span>
      ) : (
        cellRender
      )}
    </div>
  );
}
