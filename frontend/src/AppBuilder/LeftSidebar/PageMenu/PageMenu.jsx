import React, { useEffect } from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import _ from 'lodash';
import SortableList from '@/_components/SortableList';
// eslint-disable-next-line import/no-unresolved

import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useStore from '@/AppBuilder/_stores/store';
import { AddingPageHandler, PageMenuItem } from './PageMenuItem';
import './style.scss';

import { SortableTree } from './Tree/SortableTree';
import { PageGroupMenu } from './AddPageButton';
import { PageHandlerMenu } from './PageHandlerMenu.jsx';
import { EditModal } from './EditModal';
import { SettingsModal } from './SettingsModal';
import { DeletePageConfirmationModal } from './DeletePageConfirmationModal';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import PagePermission from './PagePermission';

export const PageMenu = ({ darkMode, switchPage, pinned, setPinned }) => {
  const showAddNewPageInput = useStore((state) => state.showAddNewPageInput);
  const toggleShowAddNewPageInput = useStore((state) => state.toggleShowAddNewPageInput);
  const showSearch = useStore((state) => state.showSearch);
  const handleSearch = useStore((state) => state.handleSearch);
  const togglePageSettingMenu = useStore((state) => state.togglePageSettingMenu);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const enableReleasedVersionPopupState = useStore((state) => state.enableReleasedVersionPopupState);
  const closePageEditPopover = useStore((state) => state.closePageEditPopover);
  useEffect(() => {
    return () => {
      closePageEditPopover();
    };
  }, []);

  const license = useStore((state) => state.license);
  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

  const {
    definition: { styles },
  } = useStore((state) => state.pageSettings);
  return (
    <div style={{ height: '100%' }}>
      <div
        style={{
          background: !styles?.backgroundColor?.isDefault && styles?.backgroundColor?.value,
          height: '100%',
        }}
        className="card-body p-0 pb-5"
      >
        <HeaderSection title={'Pages'} darkMode={darkMode}>
          <HeaderSection.PanelHeader title="Pages" darkMode={darkMode}>
            <div className="d-flex justify-content-end" style={{ gap: '4px' }}>
              <button
                onClick={shouldFreeze ? enableReleasedVersionPopupState : togglePageSettingMenu}
                disabled={shouldFreeze}
                className={`page-menu-action-buttons ${darkMode ? 'dark-theme' : ''}`}
              >
                <SolidIcon name="settings" width="25" />
              </button>
              <button
                onClick={() => setPinned(!pinned)}
                className={`page-menu-action-buttons ${darkMode ? 'dark-theme' : ''}`}
              >
                <SolidIcon name={pinned ? 'unpin01' : 'pin'} width="16" />
              </button>
              <PageGroupMenu
                isLicensed={isLicensed}
                title={'Add Page'}
                onClick={() => (shouldFreeze ? enableReleasedVersionPopupState() : toggleShowAddNewPageInput(true))}
                className="left-sidebar-header-btn"
                fill={`var(--slate12)`}
                darkMode={darkMode}
                leftIcon="plus"
                iconWidth="14"
                variant="tertiary"
                disabled={shouldFreeze}
              ></PageGroupMenu>
            </div>
          </HeaderSection.PanelHeader>
          {showSearch && (
            <HeaderSection.SearchBoxComponent
              onChange={handleSearch}
              placeholder={'Search'}
              placeholderIcon={''}
              darkMode={darkMode}
            />
          )}
        </HeaderSection>
        <div
          className={`${darkMode && 'dark-theme'} page-selector-panel-body`}
          style={{ borderRight: !styles?.borderColor?.isDefault ? `1px solid ${styles?.borderColor?.value}` : '' }}
        >
          <div>
            <PageHandlerMenu darkMode={darkMode} />
            {isLicensed ? <PagePermission darkMode={darkMode} /> : <></>}
            <EditModal darkMode={darkMode} />
            <SettingsModal darkMode={darkMode} />
            <DeletePageConfirmationModal darkMode={darkMode} />
            {isLicensed ? (
              <SortableTree darkMode={darkMode} collapsible indicator={true} />
            ) : (
              <SortableList
                Element={PageMenuItem}
                darkMode={darkMode}
                switchPage={switchPage}
                classNames="page-handler"
              />
            )}
            {showAddNewPageInput && (
              <div className="page-handler">
                <AddingPageHandler darkMode={darkMode} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
