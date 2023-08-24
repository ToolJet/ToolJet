import React from 'react';
import SelectComponent from '@/_ui/Select';

const selectCustomStyles = {
  control: (base, state) => ({
    ...base,
    border: state.isFocused ? '1px solid #3E63DD' : '1px solid #cccccc',
    boxShadow: state.isFocused ? '0px 0px 6px #3E63DD' : 'none',
    '&:hover': {
      border: '1px solid #3E63DD',
      boxShadow: '0px 0px 6px #3E63DD',
    },
    borderRadius: '6px',
    width: '144px',
    minHeight: '32px',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '4px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused || state.isSelected ? '#F0F4FF' : 'white',
    color: '#11181C',
    borderRadius: '6px',
  }),
};

export const Select = ({ value, onChange, forceCodeBox, meta }) => {
  return (
    <div
      className="row fx-container"
      data-cy={`dropdown-${meta.displayName ? String(meta.displayName).toLowerCase().replace(/\s+/g, '-') : 'common'}`}
    >
      <div className="field" onClick={(e) => e.stopPropagation()}>
        <SelectComponent
          options={meta.options}
          value={value}
          hasSearch={true}
          onChange={onChange}
          width={224}
          height={32}
          styles={selectCustomStyles}
          useCustomStyles={true}
          components={{
            IndicatorSeparator: () => null,
          }}
        />
      </div>
    </div>
  );
};
