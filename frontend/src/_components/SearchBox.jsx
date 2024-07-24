import React, { useState, useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import useDebounce from '@/_hooks/useDebounce';
import { useMounted } from '@/_hooks/use-mount';
import InputComponent from '@/components/ui/Input/Index';

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
      initialValue = '',
    },
    ref
  ) => {
    const [searchText, setSearchText] = useState('');
    const debouncedSearchTerm = useDebounce(searchText, debounceDelay);

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
        <InputComponent
          style={{ width }}
          value={searchText}
          aria-label="aria-label"
          id="#id"
          name="name"
          onChange={handleChange}
          placeholder={placeholder}
          data-cy={`${dataCy}-search-bar`}
          trailingAction="clear"
          className={cx('form-control', {
            'dark-theme-placeholder': darkMode,
            [className]: !!className,
          })}
          ref={ref}
          leadingIcon="search01"
          onClear={clearSearchText}
        />
      </div>
    );
  }
);

SearchBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  debounceDelay: PropTypes.number,
  width: PropTypes.string,
};
