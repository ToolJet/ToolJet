import React, { useState, useRef, useCallback, useMemo } from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import HighLightSearch from '@/AppBuilder/Widgets/NewTable/_components/HighLightSearch';
import useTableStore from '@/AppBuilder/Widgets/NewTable/_stores/tableStore';
import { getMaxHeight } from '../../_utils/helper';

export const TextColumn = ({
  id,
  isEditable,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  cellValue,
  column,
  containerWidth,
  cell,
  horizontalAlignment,
  searchText,
}) => {
  const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);

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
      maxHeight: getMaxHeight(isMaxRowHeightAuto, maxRowHeightValue, cellHeight),
    }),
    [cellTextColor, isMaxRowHeightAuto, maxRowHeightValue, cellHeight]
  );

  const focusInput = () => {
    if (cellRef.current) {
      cellRef.current.focus();
    }
  };

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
          color: cellTextColor || 'inherit',
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
        onKeyDown={handleKeyDown}
        onFocus={() => setIsEditing(true)}
        suppressContentEditableWarning={true}
      >
        <HighLightSearch text={String(cellValue)} searchTerm={searchText} />
      </div>
    );
  }, [
    isEditable,
    isValid,
    darkMode,
    cellTextColor,
    containerWidth,
    handleKeyDown,
    cellValue,
    searchText,
    horizontalAlignment,
    cellStyle,
    handleContentChange,
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
        {isEditable && !isValid && (
          <div className="invalid-feedback text-truncate" onClick={focusInput}>
            {validationError}
          </div>
        )}
      </div>
    </OverlayTrigger>
  );
};
