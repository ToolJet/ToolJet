import React, { useState, useEffect, useRef } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { default as ReactMarkdown } from 'react-markdown';
import DOMPurify from 'dompurify';

/**
 * MarkdownRenderer - Pure Markdown value renderer with editing support
 *
 * Renders Markdown content with optional editing and overlay for overflow.
 *
 * @param {Object} props
 * @param {string} props.value - The Markdown value to render
 * @param {boolean} props.isEditable - Whether the value can be edited
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.textColor - Text color
 * @param {string} props.horizontalAlignment - Horizontal alignment
 * @param {number} props.containerWidth - Container width for overlay
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 * @param {string} props.maxHeight - Max height CSS value
 */
export const MarkdownRenderer = ({
  value = '',
  isEditable = false,
  onChange,
  textColor,
  horizontalAlignment = 'left',
  containerWidth,
  darkMode = false,
  maxHeight,
  isEditing,
  setIsEditing,
  id,
}) => {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  const cellStyles = {
    color: textColor ?? 'inherit',
  };

  const getCellValue = (val) => {
    let transformedValue = val;
    if (typeof val !== 'string') {
      try {
        transformedValue = String(val);
      } catch (e) {
        transformedValue = '';
      }
    }
    return DOMPurify.sanitize(transformedValue.trim());
  };

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
          <ReactMarkdown>{getCellValue(value)}</ReactMarkdown>
        </span>
      </div>
    );
  };

  const handleChange = (e) => {
    if (value !== e.target.textContent) {
      onChange?.(e.target.textContent);
    }
  };

  const renderEditable = () => {
    return (
      <div
        id={id}
        ref={ref}
        contentEditable={'true'}
        className={`h-100 text-container long-text-input d-flex${
          darkMode ? ' textarea-dark-theme' : ''
        } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
        style={{
          color: textColor || 'inherit',
          outline: 'none',
          border: 'none',
          background: 'inherit',
          position: 'relative',
          height: '100%',
          flexDirection: 'column',
        }}
        readOnly={!isEditable}
        onBlur={(e) => {
          setIsEditing(false);
          handleChange(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            ref.current.blur();
            handleChange(e);
          }
        }}
        onFocus={(e) => {
          setIsEditing(true);
          e.stopPropagation();
        }}
      >
        <div className="h-100">{isEditing ? value : <ReactMarkdown>{getCellValue(value)}</ReactMarkdown>}</div>
      </div>
    );
  };

  const _showOverlay =
    ref?.current &&
    (ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth ||
      ref?.current?.clientHeight < ref?.current?.children[0]?.offsetHeight);

  return (
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
              maxHeight: maxHeight,
              whiteSpace: 'pre-wrap',
            }}
          >
            <ReactMarkdown>{getCellValue(value)}</ReactMarkdown>
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
            {renderEditable()}
          </div>
        </div>
      )}
    </OverlayTrigger>
  );
};

export default MarkdownRenderer;
