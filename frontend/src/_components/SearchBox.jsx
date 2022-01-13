import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export function SearchBox({ onSubmit, updateIconOnType = false }) {
  const [searchText, setSearchText] = useState('');
  const [isSearching, set] = useState(false);

  const handleChange = (e) => {
    setSearchText(e.target.value);
  };

  const trackEnterKey = (e) => {
    if (e.key === 'Enter') {
      onSubmit(searchText);
      console.log('Enter key pressed', searchText);
    }
  };

  useEffect(() => {
    if (updateIconOnType) {
      if (searchText.length > 0) {
        set(true);
      }
    }

    return () => {
      set(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
    <div className="search-box-wrapper">
      <div className="input-icon mb-3">
        {isSearching === false && <DefaultIcon />}
        <input
          type="text"
          value={searchText}
          onKeyDown={trackEnterKey}
          onChange={handleChange}
          className="form-control"
          placeholder="Search"
        />
      </div>
      {isSearching && (
        <span className="input-icon-addon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-circle-x"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M10 10l4 4m0 -4l-4 4"></path>
          </svg>
        </span>
      )}
    </div>
  );
}
SearchBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

const DefaultIcon = () => {
  return (
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
  );
};
