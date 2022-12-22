import React from 'react';
import { SearchBox } from '@/_components/SearchBox';
import { useTranslation } from 'react-i18next';

export default function Header({ onSearchSubmit, darkMode }) {
  const { t } = useTranslation();
  return (
    <div className="row">
      <div className="home-search-holder">
        <SearchBox
          className="border-0 bg-light-gray homepage-search"
          onSubmit={onSearchSubmit}
          darkMode={darkMode}
          placeholder={t('globals.search', 'Search')}
        />
      </div>
    </div>
  );
}
