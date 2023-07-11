import React from 'react';
import SelectComponent from '@/_ui/Select';
import FxButton from './FxButton';

export const Select = ({ value, onChange, forceCodeBox, meta }) => {
  return (
    <div
      className="row fx-container"
      data-cy={`dropdown-${meta.displayName ? String(meta.displayName).toLowerCase().replace(/\s+/g, '-') : 'common'}`}
    >
      <div className="col">
        <div className="field mb-3" onClick={(e) => e.stopPropagation()}>
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
        <FxButton
          active={false}
          onPress={forceCodeBox}
          dataCy={`${meta.displayName ? String(meta.displayName).toLowerCase().replace(/\s+/g, '-') : 'common'}`}
        />
      </div>
    </div>
  );
};
