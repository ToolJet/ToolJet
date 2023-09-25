import React from 'react';
import { SearchBox } from '@/_components/SearchBox';
import { useTranslation } from 'react-i18next';

export default function Header({ onSearchSubmit, darkMode }) {
  const { t } = useTranslation();
  return (
    <div className="row">
      <div className="home-search-holder">
        <SearchBox
          dataCy={`home-page`}
          className="border-0 homepage-search"
          onSubmit={onSearchSubmit}
          darkMode={darkMode}
          placeholder={'Search apps in this workspace'}
          width={'100%'}
        />
      </div>
    </div>
  );
}
