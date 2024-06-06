import React from 'react';
import AppCard from './AppCard';
import { useTranslation } from 'react-i18next';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';

const AppList = (props) => {
  const { t } = useTranslation();
  return (
    <div className="app-list">
      {props.isLoading && (
        <>
          {Array.from(Array(2)).map((_, rowIndex) => (
            <div className="row skeleton-container mb-3" key={rowIndex}>
              {Array.from(Array(3)).map((_, index) => (
                <div className="col" key={rowIndex * 3 + index}>
                  <div className="card-skeleton-container">
                    <div className="app-icon-skeleton"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
      {!props.isLoading && props.meta.total_count > 0 && (
        <div className="container px-0">
          <div className="row homepage-app-card-list-item-wrap">
            {props.apps.map((app) => {
              return (
                <div className="homepage-app-card-list-item" key={app.id}>
                  <AppCard
                    app={app}
                    key={app.id}
                    currentFolder={props.currentFolder}
                    canCreateApp={props.canCreateApp}
                    canDeleteApp={props.canDeleteApp}
                    canUpdateApp={props.canUpdateApp}
                    deleteApp={props.deleteApp}
                    exportApp={props.exportApp}
                    appActionModal={props.appActionModal}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!props.isLoading && props.currentFolder.count === 0 && (
        <div className="text-center d-block">
          <EmptyFoldersIllustration className="mb-4" data-cy="empty-folder-image" />
          <span
            className={`d-block text-center text-body ${props.darkMode && 'text-white-50'}`}
            data-cy="empty-folder-text"
          >
            {t('homePage.thisFolderIsEmpty', 'This folder is empty')}
          </span>
        </div>
      )}
    </div>
  );
};

export default AppList;
