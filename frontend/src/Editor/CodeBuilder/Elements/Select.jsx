import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import FxButton from './FxButton';

export const Select = ({ value, onChange, forceCodeBox, meta }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div className="row">
      <div className="col">
        <div className="field mb-3">
          <SelectSearch
            options={meta.options}
            value={value}
            search={true}
            onChange={onChange}
            filterOptions={fuzzySearch}
            placeholder="Select.."
            className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
          />
        </div>
      </div>
      <div className="col-auto pt-2">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};
