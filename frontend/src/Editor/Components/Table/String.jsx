import React, { useState, useEffect } from 'react';
import { resolveReferences, validateWidget, determineJustifyContentValue } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

const String = ({
  isEditable,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  horizontalAlignment,
  cellValue,
  column,
  currentState,
  containerWidth,
  cell,
  isMaxRowHeightAuto,
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
  const elem = document.querySelector('.table-string-column-cell');
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
      contentEditable={true}
      className={`${!isValid ? 'is-invalid' : ''} h-100 text-container long-text-input ${
        darkMode ? ' textarea-dark-theme' : ''
      }`}
      style={{
        color: cellTextColor ? cellTextColor : 'inherit',
        maxWidth: containerWidth,
        outline: 'none',
        border: 'none',
        background: 'inherit',
        ...(isMaxRowHeightAuto && { position: 'static' }),
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
      {cellValue}
    </div>
  );

  const getOverlay = () => {
    return (
      <div
        style={{
          maxWidth: containerWidth,
          width: containerWidth,
        }}
        className={`overlay-cell-table ${darkMode && 'dark-theme'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cellValue) }}
      />
    );
  };
  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={elem && elem?.parentElement?.clientHeight < elem?.scrollHeight ? getOverlay() : <div></div>}
        trigger={elem && elem?.parentElement?.clientHeight < elem?.scrollHeight && ['hover']}
        rootClose={true}
        show={elem && elem?.parentElement?.clientHeight < elem?.scrollHeight && showOverlay}
      >
        <div className="h-100 d-flex flex-column justify-content-center position-relative">
          <div
            className="table-string-column-cell"
            onMouseMove={() => {
              if (!hovered) setHovered(true);
            }}
            onMouseOut={() => setHovered(false)}
          >
            <div>{_renderString()}</div>
          </div>
          <div className={isValid ? '' : 'invalid-feedback'}>{validationError}</div>
        </div>
      </OverlayTrigger>
    </>
  );
};

export default String;
