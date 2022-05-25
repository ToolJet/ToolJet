import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useDebounce from '@/_hooks/useDebounce';

export function SearchBox({ width = '200px', onSubmit, debounceDelay = 300 }) {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchTerm = useDebounce(searchText, debounceDelay);
  const [isFocused, setFocussed] = useState(false);

  const handleChange = (e) => {
    setSearchText(e.target.value);
  };

  const clearSearchText = () => {
    setSearchText('');
  };

  useEffect(() => {
    onSubmit(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSubmit]);

  return (
    <div className="search-box-wrapper">
      <div className="input-icon mb-3">
        {!isFocused && (
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
        )}
        <input
          style={{ width }}
          type="text"
          value={searchText}
          onChange={handleChange}
          className="form-control"
          placeholder="Search"
          onFocus={() => setFocussed(true)}
          onBlur={() => setFocussed(false)}
        />
        {isFocused && searchText && (
          <span className="input-icon-addon end">
            <div className="d-flex" onMouseDown={clearSearchText} title="clear">
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </span>
        )}
      </div>
    </div>
  );
}
SearchBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  debounceDelay: PropTypes.number,
  width: PropTypes.string,
};
