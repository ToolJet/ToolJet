import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import FxButton from './FxButton';

export const Select = ({ value, onChange, forceCodeBox, meta }) => {
  return (
    <div className="row">
      <div className="col-10">
        <div className="field mb-3">
          <SelectSearch
            options={meta.options}
            value={value}
            search={true}
            onChange={onChange}
            filterOptions={fuzzySearch}
            placeholder="Select.."
          />
        </div>
      </div>
      <div className="col-2 pt-2">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};
