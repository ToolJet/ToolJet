import React from 'react';
import SelectComponent from '@/_ui/Select';
import FxButton from './FxButton';

export const Select = ({ value, onChange, forceCodeBox, meta }) => {
  return (
    <div className="row fx-container">
      <div className="col">
        <div className="field mb-3">
          <SelectComponent
            options={meta.options}
            value={value}
            hasSearch={true}
            onChange={onChange}
            width={224}
            height={32}
          />
        </div>
      </div>
      <div className="col-auto pt-0 style-fx fx-common">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};
