import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import { validateWidget } from '@/_helpers/utils';
import { useMounted } from '@/_hooks/use-mount';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import DOMPurify from 'dompurify';

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
  darkMode,
  cellWidth,
}) {
  const mounted = useMounted();
  const updateCellValue = useRef();
  const isTabKeyPressed = useRef(false);
  const [showHighlightedCells, setHighlighterCells] = React.useState(globalFilter ? true : false);
  const columnTypeAllowToRenderMarkElement = ['text', 'string', 'default', 'number', undefined];
  const ref = useRef();
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [hovered]);

  const _showOverlay = ref?.current && ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth;

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
    if (mounted && _.isEmpty(rowChangeSet)) {
      setHighlighterCells(true);
    }
    //In the dependency array to ingnore linting warning, added mounted but it's not working out, any way to avoid ingnoring dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, rowChangeSet]);

  const getOverlay = () => {
    return (
      <div
        className={`overlay-cell-table ${darkMode && 'dark-theme'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}
      >
        <span
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cellValue) }}
          style={{
            maxWidth: cellWidth,
          }}
        ></span>
      </div>
    );
  };

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
      onClick={() => {
        if (isEditable && columnTypeAllowToRenderMarkElement.includes(columnType)) {
          setHighlighterCells(false);
        }
      }}
      onBlur={(e) => {
        e.stopPropagation();
        if (isTabKeyPressed.current) {
          isTabKeyPressed.current = false;
          return;
        } else {
          updateCellValue.current = e.target.value;
          //removing _.isEmpty(rowChangeSet) flag from if statement at the end
          if (!showHighlightedCells && updateCellValue.current === cellValue) {
            updateCellValue.current = null;
            setHighlighterCells(true);
          }
        }
      }}
      onKeyUp={(e) => {
        if (e.key === 'Tab') {
          isTabKeyPressed.current = true;
          setHighlighterCells(false);
        }
      }}
      className={`w-100 h-100 ${columnType === 'selector' && 'd-flex align-items-center justify-content-center'} `}
    >
      {!isColumnTypeAction && columnTypeAllowToRenderMarkElement.includes(columnType) && showHighlightedCells ? (
        <OverlayTrigger
          placement="bottom"
          overlay={_showOverlay ? getOverlay() : <div></div>}
          trigger={_showOverlay && ['hover']}
          rootClose={true}
          show={_showOverlay && showOverlay}
        >
          <div
            className="d-flex justify-content-center flex-column w-100 h-100 generate-cell-value-component-div-wrapper"
            style={{ oveflow: 'hidden' }}
            onMouseMove={() => {
              if (!hovered) setHovered(true);
            }}
            onMouseOut={() => setHovered(false)}
          >
            <div
              style={{
                color: cellTextColor,
              }}
              ref={ref}
              tabIndex={0}
              className={`table-column-type-div-element ${columnType === 'text' && 'h-100 my-1'}`}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: htmlElement,
                }}
              ></span>
            </div>
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
        </OverlayTrigger>
      ) : (
        cellRender
      )}
    </div>
  );
}
