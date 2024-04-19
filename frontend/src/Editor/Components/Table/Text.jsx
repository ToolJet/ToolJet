import React, { useState, useEffect, useRef } from 'react';
import { validateWidget, determineJustifyContentValue } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

const Text = ({
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
  const ref = useRef();
  const nonEditableCellValueRef = useRef();
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [contentEditable, setContentEditable] = useState(false);
  const cellStyles = {
    color: cellTextColor ?? 'inherit',
  };
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (hovered) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [hovered]);

  const _renderTextArea = () => (
    <div
      contentEditable={contentEditable}
      className={`${!isValid ? 'is-invalid' : ''} h-100 long-text-input text-container ${
        darkMode ? ' textarea-dark-theme' : ''
      }`}
      style={{
        color: cellTextColor ? cellTextColor : 'inherit',
        maxWidth: containerWidth,
        outline: 'none',
        border: 'none',
        background: 'inherit',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        position: 'static',
      }}
      readOnly={!isEditable}
      onBlur={(e) => {
        setIsEditing(false);
        if (isEditable && cellValue !== e.target.textContent) {
          const div = e.target;
          let content = div.innerHTML;
          handleCellValueChange(cell.row.index, column.key || column.name, content, cell.row.original);
        }
      }}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cellValue) }}
      onKeyDown={(e) => {
        e.persist();
        if (e.key === 'Enter' && !e.shiftKey && isEditable) {
          const div = e.target;
          let content = div.innerHTML;
          handleCellValueChange(cell.row.index, column.key || column.name, content, cell.row.original);
        }
      }}
      onFocus={(e) => {
        setIsEditing(true);
        // setShowOverlay(false);
        e.stopPropagation();
      }}
      onClick={(e) => {
        setContentEditable(true);
      }}
    />
  );

  const _renderNonEditableData = () => (
    <div
      className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
        horizontalAlignment
      )}`}
      style={cellStyles}
    >
      <span
        style={{
          maxHeight: isMaxRowHeightAuto
            ? 'auto'
            : maxRowHeightValue
            ? maxRowHeightValue
            : cellSize === 'condensed'
            ? '39px'
            : '45px',
        }}
        ref={nonEditableCellValueRef}
      >
        {cellValue}
      </span>
    </div>
  );

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
            maxWidth: containerWidth,
            width: containerWidth,
          }}
        ></span>
      </div>
    );
  };
  const _showOverlay = isEditable
    ? ref.current && ref.current?.parentElement?.clientHeight < ref.current?.scrollHeight
    : ref.current && ref.current?.parentElement?.clientWidth < nonEditableCellValueRef.current?.clientWidth;

  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={_showOverlay ? getOverlay() : <div></div>}
        trigger={_showOverlay && ['hover']}
        rootClose={true}
        show={_showOverlay && showOverlay && !isEditing}
      >
        <div
          className={`h-100 d-flex ${
            _showOverlay && isEditable ? '' : 'justify-content-center'
          } flex-column position-relative`}
          style={{ ...(isEditing && { zIndex: 2 }) }}
        >
          <div
            onMouseMove={() => {
              if (!hovered) setHovered(true);
            }}
            onMouseLeave={() => setHovered(false)}
            ref={ref}
            className={`${!isValid ? 'is-invalid' : ''} ${isEditing ? 'h-100 content-editing' : ''}`}
          >
            {!isEditable ? _renderNonEditableData() : _renderTextArea()}
          </div>
          {isEditable && <div className={isValid ? '' : 'invalid-feedback text-truncate'}>{validationError}</div>}
        </div>
      </OverlayTrigger>
    </>
  );
};

export default Text;
