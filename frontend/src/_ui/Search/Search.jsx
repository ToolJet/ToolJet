import React from 'react';

export const SearchBox = ({ onChange, ...restProps }) => {
  const { callback, placeholder } = restProps;
  const [searchText, setSearchText] = React.useState('');

  const handleChange = (e) => {
    setSearchText(e.target.value);
    onChange(e.target.value);
  };

  const clearSearch = () => {
    setSearchText('');
    onChange('');
  };

  React.useEffect(() => {
    if (searchText) {
      document.querySelector('.searchbox-wrapper .input-icon .form-control:not(:first-child)').style.paddingLeft =
        '0.5rem';
    }

    return () => {
      document.querySelector('.searchbox-wrapper .input-icon .form-control:not(:first-child)').style.paddingLeft =
        '2.5rem';
    };
  }, [searchText]);

  return (
    <div className="searchbox-wrapper">
      <div style={{ height: '32px' }} className="input-icon d-flex">
        {searchText.length === 0 && (
          <span className="search-icon mt-2 mx-2">
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
        {searchText.length > 0 && (
          <span className="clear-icon mt-2" onClick={clearSearch}>
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
        {typeof callback === 'function' && searchText.length === 0 && (
          <span className="clear-icon mt-2" onClick={callback}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-arrow-back-up"
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
              <path d="M9 13l-4 -4l4 -4m-4 4h11a4 4 0 0 1 0 8h-1"></path>
            </svg>
          </span>
        )}
        <input
          autoFocus
          type="text"
          value={searchText}
          onChange={handleChange}
          className="form-control animate-width-change"
          placeholder={placeholder ?? 'Search'}
        />
      </div>
    </div>
  );
};
