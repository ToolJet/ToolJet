import React, { useState } from 'react';
import PropTypes from 'prop-types';

export function SearchBox({ onSubmit }) {
  const [searchText, setSearchText] = useState('');

  const handleChange = (e) => {
    setSearchText(e.target.value);
    onSubmit(e.target.value);
  };

  return (
    <div className="search-box-wrapper">
      <div className="input-icon mb-3">
        <span className="input-icon-addon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <circle cx="10" cy="10" r="7" />
            <line x1="21" y1="21" x2="15" y2="15" />
          </svg>
        </span>
        <input type="text" value={searchText} onChange={handleChange} className="form-control" placeholder="Search" />
      </div>
    </div>
  );
}
SearchBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
