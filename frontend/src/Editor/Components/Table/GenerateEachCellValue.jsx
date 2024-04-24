import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import { validateWidget } from '@/_helpers/utils';
import { useMounted } from '@/_hooks/use-mount';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import DOMPurify from 'dompurify';
import NullRenderer from './NullRenderer/NullRenderer';

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
  isCellValueChanged,
  setIsCellValueChanged,
}) {
  const mounted = useMounted();
  const updateCellValue = useRef();
  const isTabKeyPressed = useRef(false);
  const cellRef = useRef(null);

  const [showHighlightedCells, setHighlighterCells] = React.useState(globalFilter ? true : false);
  const [isNullCellClicked, setIsNullCellClicked] = React.useState(false);
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

  const _showOverlay =
    ref?.current &&
    (ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth ||
      ref?.current?.clientHeight < ref?.current?.children[0]?.offsetHeight);

  const handleCellClick = () => {
    setIsNullCellClicked(true);
    if (isEditable && columnTypeAllowToRenderMarkElement.includes(columnType)) {
      setHighlighterCells(false);
    }
  };

  const handleCellBlur = (e) => {
    e.stopPropagation();
    if (isTabKeyPressed.current) {
      isTabKeyPressed.current = false;
      return;
    } else {
      updateCellValue.current = e.target.value;
      if (!showHighlightedCells && updateCellValue.current === cellValue) {
        updateCellValue.current = null;
        setHighlighterCells(true);
      }
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Tab') {
      isTabKeyPressed.current = true;
      setHighlighterCells(false);
    }
  };

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

  const _renderCellWhenHighlighted = () => {
    return (
      <div
        className="d-flex justify-content-center flex-column w-100 h-100 generate-cell-value-component-div-wrapper"
        style={{ oveflow: 'hidden' }}
        onMouseMove={() => {
          if (!hovered) setHovered(true);
        }}
        onMouseOut={() => setHovered(false)}
      >
        {cellValue === null ? (
          <NullRenderer darkMode={darkMode} />
        ) : (
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
        )}
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
    );
  };

  const _renderNullCell = () => {
    if (isEditable) {
      if (!isNullCellClicked && !updateCellValue.current) {
        return <NullRenderer darkMode={darkMode} />;
      } else return cellRender;
    } else {
      return <NullRenderer darkMode={darkMode} />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cellRef.current && !cellRef.current.contains(event.target) && !isCellValueChanged) {
        // Adding setTimeout to avoid this event to be executed before input's blur event
        setTimeout(() => {
          setIsNullCellClicked(false);
          setIsCellValueChanged(false);
        }, 100);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCellValueChanged, setIsCellValueChanged]);

  useEffect(() => {
    if (isNullCellClicked) {
      const inputElement = document.getElementById(`table-input-${cell.column.id}-${cell.row.id}`);
      if (inputElement) {
        inputElement.focus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNullCellClicked]);

  return (
    <div
      onClick={handleCellClick}
      onBlur={handleCellBlur}
      onKeyUp={handleKeyUp}
      className={`w-100 h-100 ${columnType === 'selector' && 'd-flex align-items-center justify-content-center'}`}
      ref={cellRef}
    >
      {!isColumnTypeAction && columnTypeAllowToRenderMarkElement.includes(columnType) && showHighlightedCells ? (
        <OverlayTrigger
          placement="bottom"
          overlay={_showOverlay ? getOverlay() : <div></div>}
          trigger={_showOverlay && ['hover']}
          rootClose={true}
          show={_showOverlay && showOverlay}
        >
          {_renderCellWhenHighlighted()}
        </OverlayTrigger>
      ) : cellValue === null ? (
        _renderNullCell()
      ) : (
        cellRender
      )}
    </div>
  );
}
