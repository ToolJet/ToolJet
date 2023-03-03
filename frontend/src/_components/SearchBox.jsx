import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import useDebounce from '@/_hooks/useDebounce';
import { useMounted } from '@/_hooks/use-mount';

export function SearchBox({
  width = '200px',
  onSubmit,
  className,
  debounceDelay = 300,
  darkMode = false,
  placeholder = 'Search',
  customClass = '',
  dataCy = '',
}) {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchTerm = useDebounce(searchText, debounceDelay);
  const [isFocused, setFocussed] = useState(false);

  const handleChange = (e) => {
    setSearchText(e.target.value);
  };

  const clearSearchText = () => {
    setSearchText('');
  };

  const mounted = useMounted();

  useEffect(() => {
    if (mounted) {
      onSubmit(debouncedSearchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, onSubmit]);

  return (
    <div className={`search-box-wrapper ${customClass}`}>
      <div className="input-icon mb-3">
        {!isFocused && (
          <span className="input-icon-addon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.66634 2.66683C4.4572 2.66683 2.66634 4.45769 2.66634 6.66683C2.66634 8.87597 4.4572 10.6668 6.66634 10.6668C8.87548 10.6668 10.6663 8.87597 10.6663 6.66683C10.6663 4.45769 8.87548 2.66683 6.66634 2.66683ZM1.33301 6.66683C1.33301 3.72131 3.72082 1.3335 6.66634 1.3335C9.61186 1.3335 11.9997 3.72131 11.9997 6.66683C11.9997 7.8993 11.5816 9.03414 10.8796 9.93726L14.4711 13.5288C14.7314 13.7891 14.7314 14.2112 14.4711 14.4716C14.2107 14.7319 13.7886 14.7319 13.5283 14.4716L9.93677 10.8801C9.03365 11.5821 7.89882 12.0002 6.66634 12.0002C3.72082 12.0002 1.33301 9.61235 1.33301 6.66683Z"
                fill="#C1C8CD"
              />
            </svg>
          </span>
        )}
        <input
          style={{ width }}
          type="text"
          value={searchText}
          onChange={handleChange}
          className={cx('form-control', {
            'dark-theme-placeholder': darkMode,
            [className]: !!className,
          })}
          placeholder={placeholder}
          onFocus={() => setFocussed(true)}
          onBlur={() => setFocussed(false)}
          data-cy={`${dataCy}-search-bar`}
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
