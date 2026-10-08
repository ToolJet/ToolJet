import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';
import DOMPurify from 'dompurify';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { isCellContentOverflowing } from '../utils';
import useStore from '@/AppBuilder/_stores/store';

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
 * @param {Object} props.validationConfig - Validation rule config (minLength/maxLength/customRule),
 *                  used to validate the in-progress draft value while editing, ahead of the commit on blur.
 * @param {Function} props.onValidationChange - Reports the effective ({isValid, validationError}) —
 *                  draft-based while editing, prop-driven/committed otherwise — to a parent that
 *                  displays its own validation UI (e.g. KeyValuePair's row-level error text).
 */
export const TextRenderer = ({
  id,
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
  isEditing,
  setIsEditing,
  widgetType,
  validationConfig,
  onValidationChange,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  // const [isEditing, setIsEditing] = useState(false);
  const [draftValidation, setDraftValidation] = useState(null);
  const containerRef = useRef(null);
  const cellRef = useRef(null);
  // Measured for overflow: the outer wrapper is always constrained to the fixed cell
  // height, unlike cellRef which collapses to content height in an editable-but-not-
  // editing cell (that collapse is why the tooltip never appeared for editable cells).
  const wrapperRef = useRef(null);

  const effectiveIsValid = draftValidation ? draftValidation.isValid : isValid;
  const effectiveValidationError = draftValidation ? draftValidation.validationError : validationError;

  const validateDraft = useCallback(
    (draftValue) => {
      if (!validationConfig) return;
      setDraftValidation(
        useStore.getState().validateWidget({
          validationObject: {
            regex: { value: validationConfig?.regex },
            minLength: { value: validationConfig?.minLength },
            maxLength: { value: validationConfig?.maxLength },
            customRule: { value: validationConfig?.customRule },
          },
          widgetValue: draftValue,
          customResolveObjects: { cellValue: draftValue },
        })
      );
    },
    [validationConfig]
  );

  useEffect(() => {
    onValidationChange?.({ isValid: effectiveIsValid, validationError: effectiveValidationError });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIsValid, effectiveValidationError]);

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
    return isCellContentOverflowing(wrapperRef.current);
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
        id={id}
        contentEditable="true"
        className={`${!effectiveIsValid ? 'is-invalid' : ''} h-100 long-text-input text-container ${
          darkMode ? 'textarea-dark-theme' : ''
        } justify-content-${determineJustifyContentValue(horizontalAlignment)} `}
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
        onInput={(e) => validateDraft(e.target.textContent)}
        onBlur={(e) => {
          setIsEditing(false);
          setDraftValidation(null);
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
    effectiveIsValid,
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
    validateDraft,
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
        ref={wrapperRef}
        className={`h-100 d-flex ${
          isOverflowing() && isEditable ? '' : 'justify-content-center'
        } flex-column position-relative`}
        style={isEditing ? { zIndex: 2 } : undefined}
      >
        <div
          onMouseEnter={() => setShowOverlay(true)}
          onMouseLeave={() => setShowOverlay(false)}
          ref={containerRef}
          className={`${!effectiveIsValid ? 'is-invalid h-100' : ''} ${isEditing ? 'h-100 content-editing' : ''}`}
        >
          {renderContent()}
        </div>
        {isEditable && !effectiveIsValid && widgetType !== 'KeyValuePair' && (
          <div className="invalid-feedback text-truncate" onClick={focusInput}>
            {effectiveValidationError}
          </div>
        )}
      </div>
    </OverlayTrigger>
  );
};

export default TextRenderer;
