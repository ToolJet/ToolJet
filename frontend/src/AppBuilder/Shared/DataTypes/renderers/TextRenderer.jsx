import React, { useState, useRef, useCallback, useMemo } from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

/**
 * TextRenderer - Pure multiline text value renderer with editing support
 *
 * Renders multiline text values with optional editing, validation, and search highlighting.
 * Supports contentEditable for rich text editing.
 *
 * @param {Object} props
 * @param {string} props.value - The text value to render
 * @param {boolean} props.isEditable - Whether the value can be edited
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.textColor - Text color
 * @param {string} props.horizontalAlignment - Horizontal alignment
 * @param {number} props.containerWidth - Container width for overlay
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 * @param {string} props.maxHeight - Max height CSS value
 * @param {boolean} props.isValid - Whether current value is valid
 * @param {string} props.validationError - Validation error message
 * @param {string} props.searchText - Search text for highlighting
 * @param {React.Component} props.SearchHighlightComponent - Optional component for search highlighting
 */
export const TextRenderer = ({
  value = '',
  isEditable = false,
  onChange,
  textColor,
  horizontalAlignment = 'left',
  containerWidth,
  darkMode = false,
  maxHeight,
  isValid = true,
  validationError,
  searchText,
  SearchHighlightComponent,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef(null);
  const cellRef = useRef(null);

  const handleContentChange = useCallback(
    (content) => {
      onChange?.(content);
    },
    [onChange]
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
      color: textColor || 'inherit',
      maxHeight: maxHeight,
    }),
    [textColor, maxHeight]
  );

  const focusInput = () => {
    if (cellRef.current) {
      cellRef.current.focus();
    }
  };

  const renderText = (text) => {
    if (SearchHighlightComponent) {
      return <SearchHighlightComponent text={String(text)} searchTerm={searchText} />;
    }
    return String(text);
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
          {renderText(value)}
        </div>
      );
    }

    return (
      <div
        ref={cellRef}
        contentEditable="true"
        className={`${!isValid ? 'is-invalid' : ''} h-100 long-text-input text-container ${
          darkMode ? 'textarea-dark-theme' : ''
        } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
        style={{
          color: textColor || 'inherit',
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
          if (value !== e.target.textContent) {
            handleContentChange(e.target.textContent);
          }
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsEditing(true)}
        suppressContentEditableWarning={true}
      >
        {renderText(value)}
      </div>
    );
  }, [
    isEditable,
    isValid,
    darkMode,
    textColor,
    containerWidth,
    handleKeyDown,
    value,
    searchText,
    horizontalAlignment,
    cellStyle,
    handleContentChange,
    SearchHighlightComponent,
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
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
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

export default TextRenderer;
