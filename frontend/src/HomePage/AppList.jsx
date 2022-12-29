import React from 'react';
import AppCard from './AppCard';
import { useTranslation } from 'react-i18next';

const AppList = (props) => {
  const { t } = useTranslation();
  return (
    <div className="app-list">
      {props.isLoading && (
        <>
          {Array.from(Array(2)).map((_, rowIndex) => (
            <div className="row mb-3" key={rowIndex}>
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
      {props.meta.total_count > 0 && (
        <div className="container px-0">
          <div className="row">
            {props.apps.map((app) => {
              return (
                <div className="col mt-3 homepage-app-card-list-item" key={app.id}>
                  <AppCard
                    app={app}
                    key={app.id}
                    currentFolder={props.currentFolder}
                    canCreateApp={props.canCreateApp}
                    canDeleteApp={props.canDeleteApp}
                    canUpdateApp={props.canUpdateApp}
                    deleteApp={props.deleteApp}
                    cloneApp={props.cloneApp}
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
        <div>
          <img
            className="mx-auto d-block"
            src="assets/images/icons/empty-folder-svgrepo-com.svg"
            height="120px"
            data-cy="empty-folder-image"
          />
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
