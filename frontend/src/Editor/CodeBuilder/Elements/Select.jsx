import React from 'react';
import SelectComponent from '@/_ui/Select';
import FxButton from './FxButton';

export const Select = ({ value, onChange, forceCodeBox, meta }) => {
  const handleOnChange = (newValue) => {
    onChange(newValue.value);
  };

  return (
    <div className="row">
      <div className="col">
        <div className="field mb-3">
          <SelectComponent
            options={meta.options}
            value={value}
            hasSearch={true}
            onChange={handleOnChange}
            width={224}
            height={32}
          />
        </div>
      </div>
      <div className="col-auto pt-2">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};
