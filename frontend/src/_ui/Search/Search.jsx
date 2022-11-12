import React from 'react';
import { useTranslation } from 'react-i18next';

export const SearchBox = ({ onChange, placeholder }) => {
  const [searchText, setSearchText] = React.useState('');
  const { t } = useTranslation();

  const handleChange = (e) => {
    setSearchText(e.target.value);
    onChange(e.target.value);
  };

  // const clearSearch = () => {
  //   setSearchText('');
  //   onChange('');
  // };

  return (
    <div className="searchbox-wrapper">
      <div className="input-icon d-flex align-items-center">
        {searchText.length === 0 && (
          <span className="search-icon d-flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              // className="icon"
              width="13.33"
              height="13.33"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="#C1C8CD"
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
          autoFocus
          type="text"
          value={searchText}
          onChange={handleChange}
          className="form-control animate-width-change"
          placeholder={placeholder ?? t(`globals.search`, 'Search')}
        />
        {/* {searchText.length > 0 && (
          <span className="clear-icon d-flex" onClick={clearSearch}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13.33"
              height="13.33"
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
        )} */}
      </div>
    </div>
  );
};
