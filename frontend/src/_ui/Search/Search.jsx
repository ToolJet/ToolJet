import React from 'react';
import { useTranslation } from 'react-i18next';

export const SearchBox = ({ onChange, ...restProps }) => {
  const { callback, placeholder, placeholderIcon = null, customClass = '' } = restProps;
  const [searchText, setSearchText] = React.useState('');
  const { t } = useTranslation();

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
      if (document.querySelector('.searchbox-wrapper .input-icon .form-control:not(:first-child)')) {
        document.querySelector('.searchbox-wrapper .input-icon .form-control:not(:first-child)').style.paddingLeft =
          '2.5rem';
      }
    };
  }, [searchText]);

  return (
    <div className={`searchbox-wrapper ${customClass}`}>
      <div style={{ height: '32px' }} className="input-icon d-flex">
        <span className="search-icon mx-2" onClick={clearSearch}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.34994 1.66683C3.1408 1.66683 1.34993 3.45769 1.34993 5.66683C1.34993 7.87597 3.1408 9.66683 5.34994 9.66683C7.55907 9.66683 9.34994 7.87597 9.34994 5.66683C9.34994 3.45769 7.55907 1.66683 5.34994 1.66683ZM0.0166016 5.66683C0.0166016 2.72131 2.40442 0.333496 5.34994 0.333496C8.29545 0.333496 10.6833 2.72131 10.6833 5.66683C10.6833 6.8993 10.2652 8.03414 9.56317 8.93726L13.1547 12.5288C13.415 12.7891 13.415 13.2112 13.1547 13.4716C12.8943 13.7319 12.4722 13.7319 12.2119 13.4716L8.62037 9.88007C7.71724 10.5821 6.58241 11.0002 5.34994 11.0002C2.40442 11.0002 0.0166016 8.61235 0.0166016 5.66683Z"
              fill="#C1C8CD"
            />
          </svg>
        </span>
        {searchText.length > 0 && (
          <span className="clear-icon" onClick={clearSearch}>
            <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="0.0507812" width="20" height="20" rx="4" fill="#F0F4FF" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.52851 5.57942C5.78886 5.31907 6.21097 5.31907 6.47132 5.57942L9.99992 9.10801L13.5285 5.57942C13.7889 5.31907 14.211 5.31907 14.4713 5.57942C14.7317 5.83977 14.7317 6.26188 14.4713 6.52223L10.9427 10.0508L14.4713 13.5794C14.7317 13.8398 14.7317 14.2619 14.4713 14.5222C14.211 14.7826 13.7889 14.7826 13.5285 14.5222L9.99992 10.9936L6.47132 14.5222C6.21097 14.7826 5.78886 14.7826 5.52851 14.5222C5.26816 14.2619 5.26816 13.8398 5.52851 13.5794L9.05711 10.0508L5.52851 6.52223C5.26816 6.26188 5.26816 5.83977 5.52851 5.57942Z"
                fill="#3E63DD"
              />
            </svg>
          </span>
        )}

        {placeholderIcon && searchText.length === 0 && (
          // custom placeholder icon
          <span
            style={{
              color: '#7E868C',
            }}
            className="clear-icon mt-2 cursor-not-allowed"
          >
            {placeholderIcon}
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
          placeholder={placeholder ?? t(`globals.search`, 'Search')}
          data-cy={`search-input-filed`}
        />
      </div>
    </div>
  );
};
