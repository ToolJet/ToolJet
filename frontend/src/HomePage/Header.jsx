import React from 'react';
import { SearchBox } from '@/_components/SearchBox';
import { useTranslation } from 'react-i18next';

export default function Header({ onSearchSubmit, darkMode }) {
  const { t } = useTranslation();
  return (
    <div className="row">
      <div className="col-8 ms-auto d-print-none d-flex flex-row justify-content-end">
        <SearchBox onSubmit={onSearchSubmit} darkMode={darkMode} placeholder={t('globals.search', 'Search')} />
      </div>
    </div>
  );
}
