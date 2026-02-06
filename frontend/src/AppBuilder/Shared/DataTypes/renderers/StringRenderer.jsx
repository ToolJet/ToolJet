import React, { useState, useEffect, useRef } from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { noop } from 'lodash';

/**
 * StringRenderer - Pure string value renderer with editing support
 *
 * Renders string values with optional editing, validation, and search highlighting.
 * Context-independent - all dependencies are passed as props.
 *
 * @param {Object} props
 * @param {string} props.value - The string value to render
 * @param {boolean} props.isEditable - Whether the value can be edited
 * @param {Function} props.onChange - Callback when value changes (receives new value)
 * @param {string} props.textColor - Text color
 * @param {string} props.horizontalAlignment - Horizontal alignment ('left' | 'center' | 'right')
 * @param {number} props.containerWidth - Container width for overlay
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 * @param {string} props.maxHeight - Max height CSS value
 * @param {boolean} props.isValid - Whether current value is valid
 * @param {string} props.validationError - Validation error message
 * @param {string} props.searchText - Search text for highlighting
 * @param {React.Component} props.SearchHighlightComponent - Optional component for search highlighting
 */
export const StringRenderer = ({
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
  id,
  isEditing,
  setIsEditing = noop,
  widgetType,
}) => {
  const ref = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  // const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setShowOverlay(hovered);
  }, [hovered]);

  const getOverlay = () => (
    <div
      className={`overlay-cell-table ${darkMode ? 'dark-theme' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ color: 'var(--text-primary)' }}
    >
      <span style={{ width: `${containerWidth}px` }}>{String(value)}</span>
    </div>
  );

  const _showOverlay =
    ref?.current &&
    (ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth ||
      ref?.current?.clientHeight < ref?.current?.children[0]?.offsetHeight);

  const focusInput = () => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  const renderText = (text) => {
    if (SearchHighlightComponent) {
      return <SearchHighlightComponent text={String(text)} searchTerm={searchText} />;
    }
    return String(text);
  };

  const renderEditableContent = () => (
    <div className="h-100 d-flex flex-column justify-content-center position-relative">
      <div
        onMouseMove={() => !hovered && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${!isValid ? 'is-invalid h-100' : ''} ${isEditing ? 'h-100 content-editing' : ''} h-100`}
      >
        {isEditing ? (
          <div
            ref={ref}
            id={id}
            contentEditable={true}
            className={`${
              !isValid ? 'is-invalid' : ''
            } h-100 text-container long-text-input d-flex align-items-center ${
              darkMode ? 'textarea-dark-theme' : ''
            } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
            style={{
              color: textColor || 'inherit',
              outline: 'none',
              border: 'none',
              background: 'inherit',
              position: 'relative',
              height: '100%',
            }}
            onBlur={(e) => {
              setIsEditing(false);
              if (value !== e.target.textContent) {
                onChange?.(e.target.textContent);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            onFocus={(e) => {
              setIsEditing(true);
              e.stopPropagation();
            }}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`${
              !isValid ? 'is-invalid' : ''
            } h-100 text-container long-text-input d-flex align-items-center ${
              darkMode ? 'textarea-dark-theme' : ''
            } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
            style={{
              color: textColor || 'inherit',
              outline: 'none',
              border: 'none',
              background: 'inherit',
              position: 'relative',
              height: '100%',
            }}
          >
            {renderText(value)}
          </div>
        )}
      </div>
      {widgetType !== 'KeyValuePair' && !isValid && (
        <div className="invalid-feedback text-truncate" onClick={focusInput}>
          {validationError}
        </div>
      )}
    </div>
  );

  const renderReadOnlyContent = () => (
    <div
      className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
        horizontalAlignment
      )}`}
      style={{ color: textColor || 'inherit' }}
      onMouseMove={() => !hovered && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={ref}
    >
      <span style={{ maxHeight: maxHeight }}>{renderText(value)}</span>
    </div>
  );

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={_showOverlay ? getOverlay() : <div />}
      trigger={_showOverlay && ['hover', 'focus']}
      rootClose={true}
      show={_showOverlay && showOverlay && !isEditing}
    >
      {isEditable ? renderEditableContent() : renderReadOnlyContent()}
    </OverlayTrigger>
  );
};

export default StringRenderer;
