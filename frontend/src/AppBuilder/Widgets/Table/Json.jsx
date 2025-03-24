/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

const Json = ({
  isEditable,
  jsonIndentation,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  cellValue,
  column,
  containerWidth,
  cell,
  horizontalAlignment,
  isMaxRowHeightAuto,
  cellSize,
  maxRowHeightValue,
}) => {
  const ref = React.useRef(null);

  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const cellStyles = {
    color: cellTextColor ?? 'inherit',
  };

  useEffect(() => {
    if (!isEditable && isEditing) {
      setIsEditing(false);
    }
  }, [isEditable]);

  function format(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? `"${obj}"` : obj;
    }
    if (Array.isArray(obj)) {
      return `[  ${obj.map(format).join(',  ')}  ]`;
    }
    return `{  ${Object.entries(obj)
      .map(([key, value]) => `"${key}":  ${format(value)}`)
      .join(',  ')}  }`;
  }

  const formatCellValue = (value, overlay = false) => {
    try {
      if (typeof value === 'object') {
        if (jsonIndentation === true && !overlay) {
          return JSON.stringify(value, null, 4).replace(/":/g, '":  ');
        }
        const formattedJSON = format(value);
        return formattedJSON;
      } else {
        if (jsonIndentation === true && !overlay) {
          return JSON.stringify(JSON.parse(value), null, 4).replace(/":/g, '":  ');
        }
        const formattedJSON = format(JSON.parse(value));
        return formattedJSON;
      }
    } catch (error) {
      return value;
    }
  };

  const _renderString = () => (
    <div
      ref={ref}
      contentEditable={'true'}
      className={`h-100 text-container long-text-input d-flex align-items-center ${
        darkMode ? ' textarea-dark-theme' : ''
      } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
      tabIndex={-1}
      style={{
        color: cellTextColor ? cellTextColor : 'inherit',
        outline: 'none',
        border: 'none',
        background: 'inherit',
        position: 'relative',
        height: '100%',
      }}
      readOnly={!isEditable}
      onBlur={(e) => {
        setIsEditing(false);
        if (cellValue !== e.target.textContent) {
          const value = JSON.stringify(JSON.parse(e.target.textContent.replace(/\n/g, '')));
          handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          ref.current.blur();
          if (cellValue !== e.target.textContent) {
            const value = JSON.stringify(JSON.parse(e.target.textContent.replace(/\n/g, '')));
            handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
          }
        }
      }}
      onFocus={(e) => {
        setIsEditing(true);
        e.stopPropagation();
      }}
    >
      {String(formatCellValue(cellValue))}
    </div>
  );

  const getOverlay = () => {
    return (
      <div
        className={`overlay-cell-table ${darkMode && 'dark-theme'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ color: 'var(--text-primary)' }}
      >
        <span
          style={{
            width: `${containerWidth}px`,
            whiteSpace: 'pre-wrap',
          }}
        >
          {String(formatCellValue(cellValue, true))}
        </span>
      </div>
    );
  };

  const _showOverlay =
    ref?.current &&
    (ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth ||
      ref?.current?.clientHeight < ref?.current?.children[0]?.offsetHeight);

  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={_showOverlay ? getOverlay() : <div></div>}
        trigger={_showOverlay && ['hover', 'focus']}
        rootClose={true}
        show={_showOverlay && hovered && !isEditing}
      >
        {!isEditable ? (
          <div
            className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
              horizontalAlignment
            )}`}
            style={cellStyles}
            onMouseMove={() => {
              if (!hovered) setHovered(true);
            }}
            onMouseLeave={() => {
              setHovered(false);
            }}
            ref={ref}
          >
            <span
              style={{
                maxHeight: isMaxRowHeightAuto
                  ? 'fit-content'
                  : maxRowHeightValue
                  ? `${maxRowHeightValue}px`
                  : cellSize === 'condensed'
                  ? '39px'
                  : '45px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {String(formatCellValue(cellValue))}
            </span>
          </div>
        ) : (
          <div className="h-100 d-flex flex-column justify-content-center position-relative">
            <div
              onMouseMove={() => {
                if (!hovered) setHovered(true);
              }}
              onMouseLeave={() => setHovered(false)}
              className={`${isEditing ? 'h-100 content-editing' : ''} h-100`}
            >
              {_renderString()}
            </div>
          </div>
        )}
      </OverlayTrigger>
    </>
  );
};

export default Json;
