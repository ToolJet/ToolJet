import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SelectSearch from 'react-select-search';
import '@/_styles/editor/react-select-search.scss';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

export const CustomDropdownColumn = ({
  options = [],
  value,
  multiple,
  onChange,
  isEditable,
  width,
  contentWrap,
  autoHeight,
  darkMode,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const { t } = useTranslation();

  const sanitizedValue = useMemo(() => {
    if (!multiple) return value;
    if (!Array.isArray(value)) return [];
    return value.every((val) => typeof val !== 'object') ? value : [];
  }, [value, multiple]);

  const handleMouseMove = useCallback(() => {
    if (!showOverlay) {
      setShowOverlay(true);
    }
  }, [showOverlay]);

  const handleMouseLeave = useCallback(() => {
    setShowOverlay(false);
  }, []);

  const renderValue = useCallback(
    (valueProps) => {
      if (!valueProps) return null;

      const stringValue = String(valueProps.value);
      const values = stringValue.includes(',') ? stringValue.split(', ') : stringValue.split(' ');

      return (
        <div>
          {values.map((val, index) => (
            <span key={index} {...(!isEditable ? {} : valueProps)} className="badge bg-blue-lt p-2 mx-1">
              {val}
            </span>
          ))}
        </div>
      );
    },
    [isEditable]
  );

  const getOverlay = useCallback(
    (value, width, options) => {
      if (!Array.isArray(value)) return <div />;

      const labels = value
        .map((val) => {
          const option = options.find((opt) => opt.value === val);
          return option?.name;
        })
        .filter(Boolean);

      return (
        <div
          style={{ maxWidth: width, width }}
          className={`overlay-cell-table overlay-badges-table ${darkMode ? 'dark-theme' : ''}`}
        >
          {labels.map((label) => (
            <span
              key={label}
              style={{
                padding: '2px 6px',
                background: 'var(--surfaces-surface-03)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                wordWrap: 'break-word',
                display: 'flex',
                flexWrap: 'wrap',
                overflow: 'auto',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      );
    },
    [darkMode]
  );

  const isOverflowing = useCallback((element) => {
    if (!element) return false;
    return element.clientHeight < element.scrollHeight || element.clientWidth < element.scrollWidth;
  }, []);

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={getOverlay(sanitizedValue, width, options)}
      trigger={multiple && sanitizedValue?.length >= 1 && ['hover']}
      rootClose={true}
      show={multiple && sanitizedValue?.length >= 1 && showOverlay}
    >
      <div
        className={`custom-select d-flex align-items-center table-custom-select-badge-badges w-100 h-100 position-relative ${
          contentWrap
            ? autoHeight
              ? 'content--wrap'
              : 'content--wrap-content--overflow-hidden'
            : 'content--overflow-hidden'
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <SelectSearch
          options={options}
          printOptions="on-focus"
          value={sanitizedValue}
          renderValue={renderValue}
          search={false}
          onChange={onChange}
          multiple={multiple}
          placeholder={t('globals.select', 'Select') + '...'}
          className="select-search"
        />
      </div>
    </OverlayTrigger>
  );
};
