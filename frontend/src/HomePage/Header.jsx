import React from 'react';
import { SearchBox } from '@/_components/SearchBox';
import { useTranslation } from 'react-i18next';

export default function HomeHeader({ onSearchSubmit, darkMode, appType }) {
  const { t } = useTranslation();
  const page = appType === 'workflow' ? 'workflows' : 'apps';

  const placeholderText =
    page === 'apps'
      ? t('globals.searchItem', 'Search apps in this workspace')
      : t('globals.workflowsSearchItem', 'Search workflows in this workspace');

  return (
    <div className="row">
      <div className="home-search-holder">
        <SearchBox
          dataCy={`home-page`}
          className="border-0 homepage-search"
          onSubmit={onSearchSubmit}
          darkMode={darkMode}
          placeholder={placeholderText}
          width={'100%'}
        />
      </div>
    </div>
  );
}
