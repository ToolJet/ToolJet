import React, { useState, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

export const Radio = ({ options, value, onChange, readOnly, containerWidth, darkMode }) => {
  value = value === undefined ? [] : value;
  options = Array.isArray(options) ? options : [];

  const elem = document.querySelector('.table-radio-column-list');

  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [hovered]);

  const renderOptions = (options) => {
    return options.map((option, index) => (
      <label
        key={index}
        className="form-check form-check-inline"
        onClick={() => {
          if (!readOnly) onChange(option.value);
        }}
      >
        <input
          className="form-check-input"
          type="radio"
          checked={option.value === value}
          disabled={readOnly && option.value !== value}
        />
        <span className="form-check-label">{option.name}</span>
      </label>
    ));
  };

  const getOverlay = (options, containerWidth) => {
    return Array.isArray(options) ? (
      <div
        style={{
          maxWidth: containerWidth,
          width: containerWidth,
        }}
        className={`overlay-cell-table overlay-radio-table ${darkMode && 'dark-theme'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {renderOptions(options)}
      </div>
    ) : (
      <div></div>
    );
  };

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        elem &&
        (elem?.clientHeight < elem?.scrollHeight || elem?.clientWidth < elem?.scrollWidth) &&
        getOverlay(options, containerWidth)
      }
      trigger={elem && (elem?.clientHeight < elem?.scrollHeight || elem?.clientWidth < elem?.scrollWidth) && ['focus']}
      rootClose={true}
      show={elem && (elem?.clientHeight < elem?.scrollHeight || elem?.clientWidth < elem?.scrollWidth) && showOverlay}
    >
      <div
        className="table-radio-column-cell radio row h-100"
        onMouseMove={() => {
          if (!hovered) setHovered(true);
        }}
        onMouseOut={() => setHovered(false)}
      >
        <div className="table-radio-column-list">{renderOptions(options)}</div>
      </div>
    </OverlayTrigger>
  );
};
