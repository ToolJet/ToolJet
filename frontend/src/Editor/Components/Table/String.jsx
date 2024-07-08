import React, { useState, useEffect } from 'react';
import { validateWidget, determineJustifyContentValue } from '@/_helpers/utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

const StringColumn = ({
  isEditable,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  cellValue,
  column,
  currentState,
  containerWidth,
  cell,
  horizontalAlignment,
  isMaxRowHeightAuto,
  cellSize,
  maxRowHeightValue,
}) => {
  const validationData = validateWidget({
    validationObject: {
      regex: {
        value: column.regex,
      },
      minLength: {
        value: column.minLength,
      },
      maxLength: {
        value: column.maxLength,
      },
      customRule: {
        value: column.customRule,
      },
    },
    widgetValue: cellValue,
    currentState,
    customResolveObjects: { cellValue },
  });
  const { isValid, validationError } = validationData;
  const cellStyles = {
    color: cellTextColor ?? 'inherit',
  };
  const ref = React.useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    if (hovered) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [hovered]);

  useEffect(() => {
    if (!isEditable && isEditing) {
      setIsEditing(false);
    }
  }, [isEditable]);

  const _renderString = () => (
    <div
      ref={ref}
      contentEditable={'true'}
      className={`${!isValid ? 'is-invalid' : ''} h-100 text-container long-text-input d-flex align-items-center ${
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
          handleCellValueChange(cell.row.index, column.key || column.name, e.target.textContent, cell.row.original);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          ref.current.blur();
          if (cellValue !== e.target.textContent) {
            handleCellValueChange(cell.row.index, column.key || column.name, e.target.textContent, cell.row.original);
          }
        }
      }}
      onFocus={(e) => {
        setIsEditing(true);
        e.stopPropagation();
      }}
    >
      {String(cellValue)}
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
          }}
        >
          {String(cellValue)}
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
        show={_showOverlay && showOverlay && !isEditing}
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
              }}
            >
              {String(cellValue)}
            </span>
          </div>
        ) : (
          <div className="h-100 d-flex flex-column justify-content-center position-relative">
            <div
              onMouseMove={() => {
                if (!hovered) setHovered(true);
              }}
              onMouseLeave={() => setHovered(false)}
              className={`${!isValid ? 'is-invalid h-100' : ''} ${isEditing ? 'h-100 content-editing' : ''} h-100`}
            >
              {_renderString()}
            </div>
            <div className={`${isValid ? '' : 'invalid-feedback text-truncate'} `}>{validationError}</div>
          </div>
        )}
      </OverlayTrigger>
    </>
  );
};

export default StringColumn;
