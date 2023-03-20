import React from 'react';
import SolidIcon from '../Icon/SolidIcons';

function SearchInput({ value, handleChange, handleClose, placeholder }) {
  return (
    <div className="tj-common-search-input">
      <div className="search-icon">
        <SolidIcon name="search" width="16" />
      </div>
      <input type="search" placeholder={placeholder ?? 'Search'} value={value} onChange={handleChange} className="" />

      {value && (
        <div className="tj-common-search-input-clear-icon" onClick={handleClose}>
          <SolidIcon name="remove" width="12" />
        </div>
      )}
    </div>
  );
}

export default SearchInput;
