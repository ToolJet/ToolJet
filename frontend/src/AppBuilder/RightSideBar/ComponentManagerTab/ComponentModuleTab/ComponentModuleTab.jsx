import React, { useState } from 'react';
import './styles.scss';

export const ComponentModuleTab = ({ onChangeTab }) => {
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
          data-cy="button-invite-with-email"
        >
          <span>Components</span>
        </button>
        <button
          className={`tj-drawer-tabs-btn  tj-text-xsm ${activeTab == 2 && 'tj-drawer-tabs-btn-active'}`}
          onClick={() => handleChangeTab(2)}
          data-cy="button-upload-csv-file"
        >
          <span>Modules</span>
        </button>
      </div>
    </div>
  );
};
