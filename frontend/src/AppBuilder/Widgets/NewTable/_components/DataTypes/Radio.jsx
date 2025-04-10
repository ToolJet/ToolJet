import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

export const RadioColumn = ({ options = [], value, onChange, readOnly, containerWidth }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setShowOverlay(hovered);
  }, [hovered]);

  // Memoize sanitized value and options
  const sanitizedValue = useMemo(() => (value === undefined ? [] : value), [value]);
  const sanitizedOptions = useMemo(() => (Array.isArray(options) ? options : []), [options]);

  const handleOptionClick = useCallback(
    (optionValue) => {
      if (!readOnly) {
        onChange(optionValue);
      }
    },
    [readOnly, onChange]
  );

  const renderOption = useCallback(
    (option, index) => (
      <label key={index} className="form-check form-check-inline" onClick={() => handleOptionClick(option.value)}>
        <input
          className="form-check-input"
          type="radio"
          checked={option.value === sanitizedValue}
          disabled={readOnly && option.value !== sanitizedValue}
          onChange={() => {}} // Controlled component needs onChange
          aria-label={option.name}
        />
        <span className="form-check-label">{option.name}</span>
      </label>
    ),
    [sanitizedValue, readOnly, handleOptionClick]
  );

  const getOverlay = useCallback(
    (options, containerWidth) => {
      const darkMode = localStorage.getItem('darkMode') === 'true';

      return Array.isArray(options) ? (
        <div
          style={{
            maxWidth: containerWidth,
            width: containerWidth,
          }}
          className={`overlay-cell-table overlay-radio-table ${darkMode ? 'dark-theme' : ''}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          role="radiogroup"
          aria-label="Radio options overlay"
        >
          {options.map(renderOption)}
        </div>
      ) : (
        <div />
      );
    },
    [renderOption]
  );

  const isOverflowing = useCallback(() => {
    if (!containerRef.current) return false;
    return (
      containerRef.current.clientHeight < containerRef.current.scrollHeight ||
      containerRef.current.clientWidth < containerRef.current.scrollWidth
    );
  }, []);

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={getOverlay(sanitizedOptions, containerWidth)}
      trigger={isOverflowing() && ['focus']}
      rootClose={true}
      show={isOverflowing() && showOverlay}
    >
      <div
        className="table-radio-column-cell radio row h-100"
        onMouseMove={() => !hovered && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="radiogroup"
        aria-label="Radio options"
      >
        <div ref={containerRef} className="table-radio-column-list">
          {sanitizedOptions.map(renderOption)}
        </div>
      </div>
    </OverlayTrigger>
  );
};
