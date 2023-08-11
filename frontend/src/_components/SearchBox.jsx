import React, { useState, useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import useDebounce from '@/_hooks/useDebounce';
import { useMounted } from '@/_hooks/use-mount';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const SearchBox = forwardRef(
  (
    {
      width = '200px',
      onSubmit,
      className,
      debounceDelay = 300,
      darkMode = false,
      placeholder = 'Search',
      customClass = '',
      dataCy = '',
      callBack,
      onClearCallback,
      autoFocus = false,
      showClearButton,
      initialValue = '',
    },
    ref
  ) => {
    const [searchText, setSearchText] = useState('');
    const debouncedSearchTerm = useDebounce(searchText, debounceDelay);
    const [isFocused, setFocussed] = useState(false);

    const handleChange = (e) => {
      setSearchText(e.target.value);
      callBack?.(e);
    };

    const clearSearchText = () => {
      setSearchText('');
      onClearCallback?.();
    };

    const mounted = useMounted();

    useEffect(() => {
      if (mounted) {
        onSubmit?.(debouncedSearchTerm);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, onSubmit]);

    useEffect(() => {
      initialValue !== undefined && setSearchText(initialValue);
    }, [initialValue]);

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
            autoFocus={autoFocus}
            ref={ref}
          />
          {(isFocused || showClearButton) && (
            <span className="input-icon-addon end" onMouseDown={clearSearchText}>
              <div className="d-flex tj-common-search-input-clear-icon" title="clear">
                <SolidIcon name="remove" />
              </div>
            </span>
          )}
        </div>
      </div>
    );
  }
);

SearchBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  debounceDelay: PropTypes.number,
  width: PropTypes.string,
};
