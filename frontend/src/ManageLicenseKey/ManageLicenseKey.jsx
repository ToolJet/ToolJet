import React, { useState } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import FolderList from '@/_ui/FolderList/FolderList';
import { General } from './General';

function ManageLicenseKey() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('general');

  const sideBarNavs = ['General'];

  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'General':
        return 'general';
      default:
        return groupName;
    }
  };

  return (
    <div className="wrapper enterprise-page">
      <div className="wrapper license-page">
        <div className="row gx-0">
          <div className="license-page-sidebar col ">
            <div className="license-nav-list-wrap">
              {sideBarNavs.map((item, index) => {
                return (
                  <>
                    <FolderList
                      className="workspace-settings-nav-items"
                      key={index}
                      onClick={() => {
                        setSelectedTab(defaultOrgName(item));
                      }}
                      selectedItem={selectedTab == defaultOrgName(item)}
                      dataCy={item.toLowerCase().replace(/\s+/g, '-')}
                    >
                      {item}
                    </FolderList>
                  </>
                );
              })}
            </div>
          </div>
          <div className={cx('col license-content-wrapper')}>
            <div className="content-wrapper">{selectedTab === 'general' && <General />}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ManageLicenseKey };
