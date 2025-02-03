import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import HighLightSearch from '@/AppBuilder/Widgets/NewTable/_components/HighLight';

export const TextColumn = ({
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
  searchText,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef(null);
  const cellRef = useRef(null);

  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const { isValid, validationError } = validateWidget({
    validationObject: {
      minLength: { value: column.minLength },
      maxLength: { value: column.maxLength },
      customRule: { value: column.customRule },
    },
    widgetValue: cellValue,
    currentState,
    customResolveObjects: { cellValue },
  });

  const handleContentChange = useCallback(
    (content) => {
      handleCellValueChange(cell.row.index, column.key || column.name, content, cell.row.original);
    },
    [cell.row, column, handleCellValueChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey && isEditable) {
        e.preventDefault();
        e.target.blur();
      }
    },
    [isEditable]
  );

  const isOverflowing = useCallback(() => {
    if (!containerRef.current || !cellRef.current) return false;
    const { clientWidth, clientHeight, scrollWidth, scrollHeight } = cellRef.current;
    return clientWidth < scrollWidth || clientHeight < scrollHeight;
  }, []);

  const cellStyle = useMemo(
    () => ({
      color: cellTextColor || 'inherit',
      maxHeight: isMaxRowHeightAuto
        ? 'fit-content'
        : maxRowHeightValue
        ? `${maxRowHeightValue}px`
        : `${cellSize === 'condensed' ? 39 : 45}px`,
    }),
    [cellTextColor, isMaxRowHeightAuto, maxRowHeightValue, cellSize]
  );

  const renderContent = useCallback(() => {
    if (!isEditable) {
      return (
        <div
          ref={cellRef}
          className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
            horizontalAlignment
          )}`}
          style={cellStyle}
        >
          <HighLightSearch text={String(cellValue)} searchTerm={searchText} />
        </div>
      );
    }

    return (
      <div
        ref={cellRef}
        contentEditable="true"
        className={`${!isValid ? 'is-invalid' : ''} h-100 long-text-input text-container ${
          darkMode ? 'textarea-dark-theme' : ''
        }`}
        style={{
          ...cellStyle,
          maxWidth: containerWidth,
          outline: 'none',
          border: 'none',
          background: 'inherit',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          position: 'static',
          display: 'flex',
          alignItems: 'center',
        }}
        onBlur={(e) => {
          setIsEditing(false);
          if (cellValue !== e.target.textContent) {
            handleContentChange(e.target.innerHTML);
          }
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cellValue) }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsEditing(true)}
      />
    );
  }, [
    isEditable,
    isValid,
    darkMode,
    cellStyle,
    containerWidth,
    cellValue,
    handleKeyDown,
    handleContentChange,
    horizontalAlignment,
    searchText,
  ]);

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        isOverflowing() ? (
          <div
            className={`overlay-cell-table ${darkMode ? 'dark-theme' : ''}`}
            style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}
          >
            <span
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cellValue) }}
              style={{ maxWidth: containerWidth, width: containerWidth }}
            />
          </div>
        ) : (
          <div />
        )
      }
      trigger={isOverflowing() && ['hover']}
      rootClose={true}
      show={isOverflowing() && showOverlay && !isEditing}
    >
      <div
        className={`h-100 d-flex ${
          isOverflowing() && isEditable ? '' : 'justify-content-center'
        } flex-column position-relative`}
        style={isEditing ? { zIndex: 2 } : undefined}
      >
        <div
          onMouseEnter={() => setShowOverlay(true)}
          onMouseLeave={() => setShowOverlay(false)}
          ref={containerRef}
          className={`${!isValid ? 'is-invalid h-100' : ''} ${isEditing ? 'h-100 content-editing' : ''}`}
        >
          {renderContent()}
        </div>
        {isEditable && !isValid && <div className="invalid-feedback text-truncate">{validationError}</div>}
      </div>
    </OverlayTrigger>
  );
};
