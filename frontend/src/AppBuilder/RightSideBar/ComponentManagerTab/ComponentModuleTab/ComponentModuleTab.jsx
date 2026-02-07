import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.scss';

export const ComponentModuleTab = ({ onChangeTab, hasModuleAccess }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(1);

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    onChangeTab(tab);
  };

  return (
    <div className="tj-tabs-container-outer">
      <div className="tj-tabs-container">
        <button
          className={`tj-drawer-tabs-btn tj-text-xsm ${activeTab == 1 && 'tj-drawer-tabs-btn-active'}`}
          onClick={() => handleChangeTab(1)}
        >
          <span>{t('editor.componentsPanel.title', 'Components')}</span>
        </button>
        {hasModuleAccess && (
          <button
            className={`tj-drawer-tabs-btn  tj-text-xsm ${activeTab == 2 && 'tj-drawer-tabs-btn-active'}`}
            onClick={() => handleChangeTab(2)}
            data-cy="button-upload-csv-file"
          >
            <span>{t('editor.componentsPanel.modules', 'Modules')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
