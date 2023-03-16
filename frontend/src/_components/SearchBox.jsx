import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import useDebounce from '@/_hooks/useDebounce';
import { useMounted } from '@/_hooks/use-mount';
import SolidIcon from '../_ui/Icon/SolidIcons';

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
      <div className="input-icon">
        {!isFocused && (
          <span className="input-icon-addon">
            <SolidIcon name="search" width="14" />
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
              <SolidIcon name="remove" />
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
