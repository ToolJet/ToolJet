import React, { useState, useEffect } from 'react';
import { validateWidget, determineJustifyContentValue } from '@/_helpers/utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

const String = ({
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

  useEffect(() => {
    if (hovered) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [hovered]);

  const _renderString = () => (
    <div
      ref={ref}
      contentEditable={true}
      className={`${!isValid ? 'is-invalid' : ''} h-100 text-container long-text-input ${
        darkMode ? ' textarea-dark-theme' : ''
      }`}
      style={{
        color: cellTextColor ? cellTextColor : 'inherit',
        outline: 'none',
        border: 'none',
        background: 'inherit',
      }}
      readOnly={!isEditable}
      onBlur={(e) => {
        if (cellValue !== e.target.textContent) {
          handleCellValueChange(cell.row.index, column.key || column.name, e.target.textContent, cell.row.original);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (cellValue !== e.target.textContent) {
            handleCellValueChange(cell.row.index, column.key || column.name, e.target.textContent, cell.row.original);
          }
        }
      }}
      onFocus={(e) => e.stopPropagation()}
    >
      <span>{cellValue}</span>
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
          {cellValue}
        </span>
      </div>
    );
  };
  const _showOverlay = ref?.current && ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth;
  if (!isEditable) {
    return (
      <div
        className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
          horizontalAlignment
        )}`}
        style={cellStyles}
      >
        {cellValue}
      </div>
    );
  }
  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={_showOverlay ? getOverlay() : <div></div>}
        trigger={_showOverlay && ['hover']}
        rootClose={true}
        show={_showOverlay && showOverlay}
      >
        <div className="h-100 d-flex flex-column justify-content-center position-relative">
          <div
            onMouseMove={() => {
              if (!hovered) setHovered(true);
            }}
            onMouseOut={() => setHovered(false)}
          >
            {_renderString()}
          </div>
          <div className={isValid ? '' : 'invalid-feedback'}>{validationError}</div>
        </div>
      </OverlayTrigger>
    </>
  );
};

export default String;
