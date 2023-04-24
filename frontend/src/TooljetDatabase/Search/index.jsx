import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import useDebounce from '@/_hooks/useDebounce';
import { useMounted } from '@/_hooks/use-mount';
import { TooljetDatabaseContext } from '../index';
import SolidIcon from '@/_ui/Icon/SolidIcons';
const Search = ({
  width = '248px',
  onSubmit,
  className,
  debounceDelay = 300,
  darkMode = false,
  customClass = '',
  dataCy = '',
  callBack,
  onClearCallback,
  autoFocus = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchTerm = useDebounce(searchText, debounceDelay);
  const [isFocused, setFocussed] = useState(false);
  const { setSearchParam } = useContext(TooljetDatabaseContext);

  const handleChange = (e) => {
    setSearchText(e.target.value.trim().toLowerCase());
    setSearchParam(e.target.value.trim().toLowerCase());

    callBack?.(e);
  };

  const clearSearchText = () => {
    setSearchText('');
    onClearCallback?.();
    setSearchParam('');
  };

  const mounted = useMounted();

  useEffect(() => {
    if (mounted) {
      onSubmit?.(debouncedSearchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, onSubmit]);

  return (
    <div className={`search-box-wrapper ${customClass}`}>
      <div className="input-icon">
        {!isFocused && (
          <span className="input-icon-addon">
            <SolidIcon name="search" width="14" fill={darkMode ? '#ECEDEE' : '#11181C'} />
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
          placeholder="Search table"
          onFocus={() => setFocussed(true)}
          onBlur={() => setFocussed(false)}
          data-cy={`${dataCy}-search-bar`}
          autoFocus={autoFocus}
        />
        {isFocused && searchText && (
          <span className="input-icon-addon end">
            <div
              className={`d-flex ${customClass && 'tj-common-search-input-clear-icon'}`}
              onMouseDown={clearSearchText}
              title="clear"
            >
              <SolidIcon name="remove" />
            </div>
          </span>
        )}
      </div>
    </div>
  );
};
Search.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  debounceDelay: PropTypes.number,
  width: PropTypes.string,
};
export default Search;
