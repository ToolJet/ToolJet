import React from 'react';
import SelectSearch from 'react-select-search';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

export const CustomDropdown = ({ options, value, multiple, onChange, isEditable, width }) => {
  const { t } = useTranslation();

  function renderValue(valueProps) {
    if (!isEditable && valueProps) {
      const stringifyValue = String(valueProps.value);
      const arrayOfValueProps = stringifyValue.includes(',') ? stringifyValue.split(', ') : stringifyValue.split(' ');
      return (
        <OverlayTrigger
          placement="bottom"
          overlay={multiple && getOverlay(value, width)}
          trigger={multiple && ['hover']}
          rootClose={true}
        >
          <div>
            {arrayOfValueProps.map((value, index) => (
              <span key={index} className="badge bg-blue-lt p-2 mx-1">
                {value}
              </span>
            ))}
          </div>
        </OverlayTrigger>
      );
    } else if (valueProps) {
      const stringifyValue = String(valueProps.value);
      const arrayOfValueProps = stringifyValue.includes(',') ? stringifyValue.split(', ') : stringifyValue.split(' ');
      return (
        <OverlayTrigger
          placement="bottom"
          overlay={multiple && getOverlay(value, width)}
          trigger={multiple && ['hover']}
          rootClose={true}
        >
          <div>
            {arrayOfValueProps.map((value, index) => (
              <span key={index} {...valueProps} className="badge bg-blue-lt p-2 mx-1">
                {value}
              </span>
            ))}
          </div>
        </OverlayTrigger>
      );
    }
  }

  return (
    <div className={`custom-select table-custom-select-badge-badges`} style={{ width: width }}>
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
  );
};

const getOverlay = (value, containerWidth) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return Array.isArray(value) ? (
    <div
      style={{
        height: 'fit-content',
        maxWidth: containerWidth,
        width: containerWidth,
        background: 'var(--surfaces-surface-01)',
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '16px',
        borderRadius: '6px',
        boxShadow: '0px 8px 16px 0px var(--elevation-400-box-shadow), 0px 0px 1px 0px var(--elevation-400-box-shadow)',
        zIndex: 1,
      }}
      className={`overlay-multiselect-table ${darkMode && 'dark-theme'}`}
    >
      {value?.map((option) => {
        return (
          <span
            style={{
              padding: '2px 6px',
              background: 'var(--surfaces-surface-03)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
            key={option}
          >
            {option}
          </span>
        );
      })}
    </div>
  ) : (
    <div></div>
  );
};
