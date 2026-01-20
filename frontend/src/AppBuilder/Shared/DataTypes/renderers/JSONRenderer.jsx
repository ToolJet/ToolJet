import React, { useState, useEffect, useRef } from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

/**
 * JSONRenderer - Pure JSON value renderer with editing support
 *
 * Renders JSON content with optional formatting/indentation and editing support.
 *
 * @param {Object} props
 * @param {any} props.value - The JSON value to render
 * @param {boolean} props.isEditable - Whether the value can be edited
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.textColor - Text color
 * @param {string} props.horizontalAlignment - Horizontal alignment
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 * @param {boolean} props.jsonIndentation - Whether to indent JSON
 * @param {string} props.maxHeight - Max height CSS value
 */
export const JSONRenderer = ({
  value = '',
  isEditable = false,
  onChange,
  textColor,
  horizontalAlignment = 'left',
  darkMode = false,
  jsonIndentation = false,
  maxHeight,
}) => {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const cellStyles = {
    color: textColor ?? 'inherit',
  };

  useEffect(() => {
    if (!isEditable && isEditing) {
      setIsEditing(false);
    }
  }, [isEditable, isEditing]);

  function format(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? `"${obj}"` : obj;
    }
    if (Array.isArray(obj)) {
      return `[  ${obj.map(format).join(',  ')}  ]`;
    }
    return `{  ${Object.entries(obj)
      .map(([key, val]) => `"${key}":  ${format(val)}`)
      .join(',  ')}  }`;
  }

  const formatCellValue = (val, overlay = false) => {
    try {
      if (typeof val === 'object') {
        if (jsonIndentation === true && !overlay) {
          return JSON.stringify(val, null, 4).replace(/":/g, '":  ');
        }
        const formattedJSON = format(val);
        return formattedJSON;
      } else {
        if (jsonIndentation === true && !overlay) {
          return JSON.stringify(JSON.parse(val), null, 4).replace(/":/g, '":  ');
        }
        const formattedJSON = format(JSON.parse(val));
        return formattedJSON;
      }
    } catch (error) {
      return val;
    }
  };

  const handleChange = (textContent) => {
    if (value !== textContent) {
      try {
        const parsedValue = JSON.stringify(JSON.parse(textContent.replace(/\n/g, '')));
        onChange?.(parsedValue);
      } catch (e) {
        // Invalid JSON, don't update
      }
    }
  };

  const renderEditable = () => (
    <div
      ref={ref}
      contentEditable={'true'}
      className={`h-100 text-container long-text-input d-flex align-items-center ${
        darkMode ? ' textarea-dark-theme' : ''
      } justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
      tabIndex={-1}
      style={{
        color: textColor || 'inherit',
        outline: 'none',
        border: 'none',
        background: 'inherit',
        position: 'relative',
        height: '100%',
      }}
      readOnly={!isEditable}
      onBlur={(e) => {
        setIsEditing(false);
        handleChange(e.target.textContent);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          ref.current.blur();
          handleChange(e.target.textContent);
        }
      }}
      onFocus={(e) => {
        setIsEditing(true);
        e.stopPropagation();
      }}
    >
      {String(formatCellValue(value))}
    </div>
  );

  const getOverlay = () => {
    return (
      <div
        className={`overlay-cell-table scrollbar-tranck-transparent ${darkMode && 'dark-theme'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ color: 'var(--text-primary)' }}
      >
        <span
          style={{
            maxWidth: `250px`,
            maxHeight: '100px',
            textOverflow: 'ellipsis',
            overflowY: 'scroll',
            paddingRight: '5px',
          }}
        >
          {String(formatCellValue(value, true))}
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
        overlay={_showOverlay ? getOverlay() : <div />}
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
              {String(formatCellValue(value))}
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
    </>
  );
};

export default JSONRenderer;
