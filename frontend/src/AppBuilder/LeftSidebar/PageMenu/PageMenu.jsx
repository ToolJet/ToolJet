import React, { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { HeaderSection } from '@/_ui/LeftSidebar';
// import { PageHandler, AddingPageHandler } from './PageHandler';
// import { GlobalSettings } from './GlobalSettings';
import _ from 'lodash';
import SortableList from '@/_components/SortableList';
// eslint-disable-next-line import/no-unresolved
import EmptyIllustration from '@assets/images/no-results.svg';
import { shallow } from 'zustand/shallow';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useStore from '@/AppBuilder/_stores/store';
import { AddingPageHandler, PageMenuItem } from './PageMenuItem';
import './style.scss';
import { buildTree } from './Tree/utilities';
import { SortableTree } from './Tree/SortableTree';
import { PageGroupMenu } from './AddPageButton';
import { PageHandlerMenu } from './PageHandlerMenu.jsx';
import { EditModal } from './EditModal';
import { SettingsModal } from './SettingsModal';
import { DeletePageConfirmationModal } from './DeletePageConfirmationModal';

export const PageMenu = ({
  // appDefinition={},
  darkMode,
  addNewPage,
  switchPage,
  pinned,
  setPinned,
}) => {
  // const pages = useStore((state) => state.pages);
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
        <HeaderSection darkMode={darkMode}>
          <HeaderSection.PanelHeader title="Pages" darkMode={darkMode}>
            <div className="d-flex justify-content-end" style={{ gap: '2px' }}>
              <ButtonSolid
                title={'Add Page'}
                onClick={() => (shouldFreeze ? enableReleasedVersionPopupState() : toggleShowAddNewPageInput(true))}
                className="left-sidebar-header-btn"
                fill={`var(--slate12)`}
                darkMode={darkMode}
                leftIcon="plus"
                iconWidth="14"
                variant="tertiary"
                disabled={shouldFreeze}
              ></ButtonSolid>
              <ButtonSolid
                title={'Settings'}
                onClick={shouldFreeze ? enableReleasedVersionPopupState : togglePageSettingMenu}
                className="left-sidebar-header-btn"
                fill={`var(--slate12)`}
                darkMode={darkMode}
                leftIcon="settings"
                iconWidth="14"
                variant="tertiary"
                disabled={shouldFreeze}
              ></ButtonSolid>

              {/* <ButtonSolid
                title={'Search'}
                onClick={() => toggleSearch(!showSearch)}
                darkMode={darkMode}
                className="left-sidebar-header-btn"
                fill={`var(--slate12)`}
                leftIcon="search"
                iconWidth="14"
                variant="tertiary"
              ></ButtonSolid> */}
              <ButtonSolid
                title={`${pinned ? 'Unpin' : 'Pin'}`}
                onClick={() => setPinned(!pinned)}
                variant="tertiary"
                className="left-sidebar-header-btn"
                fill={`var(--slate12)`}
                darkMode={darkMode}
                leftIcon={pinned ? 'unpin' : 'pin'}
                iconWidth="14"
              ></ButtonSolid>
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
            {/* {sortedAllPages.length > 0 ? ( */}
            <PageHandlerMenu darkMode={darkMode} />
            <EditModal darkMode={darkMode} />
            <SettingsModal darkMode={darkMode} />
            <DeletePageConfirmationModal darkMode={darkMode} />
            <SortableList
              Element={PageMenuItem}
              darkMode={darkMode}
              switchPage={switchPage}
              classNames="page-handler"
            />
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
