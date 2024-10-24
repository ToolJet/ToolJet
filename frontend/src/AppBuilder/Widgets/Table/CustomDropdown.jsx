import React, { useState, useEffect } from 'react';
import SelectSearch from 'react-select-search';
import '@/_styles/editor/react-select-search.scss';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

export const CustomDropdown = ({
  options,
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
  const [hovered, setHovered] = useState(false);

  const elem = document.querySelector(
    '.table-custom-select-badge-badges .select-search-container.select-search-is-multiple .select-search-value > div'
  );

  useEffect(() => {
    if (hovered) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [hovered]);

  const checkForValidValue = (value) => {
    // value for badge should be ['premitive values'] and not [{}]
    if (!Array.isArray(value)) {
      return [];
    }
    const nonPremitiveValueExits = value.find((singleValue) => typeof singleValue === 'object');
    return nonPremitiveValueExits ? [] : value;
  };

  value = multiple ? checkForValidValue(value) : value;
  const { t } = useTranslation();

  function renderValue(valueProps) {
    if (!isEditable && valueProps) {
      const stringifyValue = String(valueProps.value);
      const arrayOfValueProps = stringifyValue.includes(',') ? stringifyValue.split(', ') : stringifyValue.split(' ');
      return (
        <div>
          {arrayOfValueProps.map((value, index) => (
            <span key={index} className="badge bg-blue-lt p-2 mx-1">
              {value}
            </span>
          ))}
        </div>
      );
    } else if (valueProps) {
      const stringifyValue = String(valueProps.value);
      const arrayOfValueProps = stringifyValue.includes(',') ? stringifyValue.split(', ') : stringifyValue.split(' ');
      return (
        <div>
          {arrayOfValueProps.map((value, index) => (
            <span key={index} {...valueProps} className="badge bg-blue-lt p-2 mx-1">
              {value}
            </span>
          ))}
        </div>
      );
    }
  }
  const getOverlay = (value, containerWidth, options) => {
    const labels = Array.isArray(value)
      ? value.map((value) => {
          const option = options.find((option) => option.value === value);
          if (option) {
            return option.name;
          }
        })
      : [];
    return Array.isArray(labels) ? (
      <div
        style={{
          maxWidth: containerWidth,
          width: containerWidth,
        }}
        className={`overlay-cell-table overlay-badges-table ${darkMode && 'dark-theme'}`}
      >
        {labels?.map((label) => {
          return (
            <span
              style={{
                padding: '2px 6px',
                background: 'var(--surfaces-surface-03)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                wordWrap: 'break-word', // Add word-wrap property for content wrapping
                display: 'flex',
                flexWrap: 'wrap',
                overflow: 'auto',
              }}
              key={label}
            >
              {label}
            </span>
          );
        })}
      </div>
    ) : (
      <div></div>
    );
  };

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        multiple &&
        elem &&
        (elem?.clientHeight < elem?.scrollHeight || elem?.clientWidth < elem?.scrollWidth) &&
        getOverlay(value, width, options)
      }
      trigger={
        multiple &&
        elem &&
        (elem?.clientHeight < elem?.scrollHeight || elem?.clientWidth < elem?.scrollWidth) &&
        value?.length >= 1 && ['hover']
      }
      rootClose={true}
      show={
        multiple &&
        elem &&
        (elem?.clientHeight < elem?.scrollHeight || elem?.clientWidth < elem?.scrollWidth) &&
        value?.length >= 1 &&
        showOverlay
      }
    >
      <div
        className={`custom-select d-flex align-items-center table-custom-select-badge-badges w-100 h-100 position-relative ${
          contentWrap
            ? autoHeight
              ? 'content--wrap'
              : 'content--wrap-content--overflow-hidden'
            : 'content--overflow-hidden'
        }`}
        onMouseMove={() => {
          if (!hovered) setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
      >
        <SelectSearch
          options={options}
          printOptions="on-focus"
          value={value}
          renderValue={renderValue}
          search={false}
          onChange={onChange}
          multiple={multiple}
          placeholder={t('globals.select', 'Select') + '...'}
          className={'select-search'}
        />
      </div>
    </OverlayTrigger>
  );
};
