import React, { useState } from 'react';
import Fuse from 'fuse.js';
import { HeaderSection } from '@/_ui/LeftSidebar';
import { PageHandler, AddingPageHandler } from './PageHandler';
import { GlobalSettings } from './GlobalSettings';
import _ from 'lodash';
import SortableList from '@/_components/SortableList';
// eslint-disable-next-line import/no-unresolved
import EmptyIllustration from '@assets/images/no-results.svg';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const LeftSidebarPageSelector = ({
  appDefinition,
  darkMode,
  currentPageId,
  addNewPage,
  switchPage,
  deletePage,
  renamePage,
  clonePage,
  hidePage,
  unHidePage,
  updateHomePage,
  updatePageHandle,
  pages,
  homePageId,
  showHideViewerNavigationControls,
  updateOnSortingPages,
  updateOnPageLoadEvents,
  apps,
  pinned,
  setPinned,
}) => {
  const [allpages, setPages] = useState(pages);
  const [haveUserPinned, setHaveUserPinned] = useState(false);
  const currentState = useCurrentState();
  const [newPageBeingCreated, setNewPageBeingCreated] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { enableReleasedVersionPopupState, isVersionReleased } = useAppVersionStore(
    (state) => ({
      enableReleasedVersionPopupState: state.actions.enableReleasedVersionPopupState,
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );

  const filterPages = (value) => {
    if (!value || value.length === 0) return clearSearch();

    const fuse = new Fuse(pages, { keys: ['name'], threshold: 0.3 });
    const result = fuse.search(value);
    setPages(result.map((item) => item.item));
  };

  const clearSearch = () => {
    setPages(pages);
  };

  React.useEffect(() => {
    if (!_.isEqual(pages, allpages)) {
      setPages(pages);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ pages })]);

  const pinPagesPopover = (state) => {
    if (!haveUserPinned) {
      setPinned(state);
    }
  };

  return (
    <div>
      <div className="card-body p-0 pb-5">
        <HeaderSection darkMode={darkMode}>
          <HeaderSection.PanelHeader
            title="Pages"
            settings={
              <GlobalSettings
                darkMode={darkMode}
                showHideViewerNavigationControls={showHideViewerNavigationControls}
                showPageViwerPageNavitation={appDefinition?.showViewerNavigation || false}
              />
            }
          >
            <div className="d-flex justify-content-end" style={{ gap: '2px' }}>
              <ButtonSolid
                title={'Add Page'}
                onClick={() => {
                  if (isVersionReleased) {
                    enableReleasedVersionPopupState();
                    return;
                  }
                  setNewPageBeingCreated(true);
                }}
                className="left-sidebar-header-btn "
                darkMode={darkMode}
                leftIcon="plus"
                iconWidth="14"
                variant="tertiary"
              ></ButtonSolid>
              <ButtonSolid
                title={'Search'}
                onClick={() => setShowSearch(!showSearch)}
                darkMode={darkMode}
                className="left-sidebar-header-btn "
                leftIcon="search"
                iconWidth="14"
                variant="tertiary"
              ></ButtonSolid>
              <ButtonSolid
                title={`${pinned ? 'Unpin' : 'Pin'}`}
                onClick={() => {
                  setPinned(!pinned);
                  !haveUserPinned && setHaveUserPinned(true);
                }}
                variant="tertiary"
                className="left-sidebar-header-btn"
                darkMode={darkMode}
                leftIcon={pinned ? 'unpin' : 'pin'}
                iconWidth="14"
              ></ButtonSolid>
            </div>
          </HeaderSection.PanelHeader>
          {showSearch && (
            <HeaderSection.SearchBoxComponent
              onChange={filterPages}
              placeholder={'Search'}
              placeholderIcon={''}
              darkMode={darkMode}
            />
          )}
        </HeaderSection>

        <div className={`${darkMode && 'dark-theme'} page-selector-panel-body`}>
          <div>
            {allpages.length > 0 ? (
              <SortableList
                data={allpages}
                Element={PageHandler}
                pages={allpages}
                darkMode={darkMode}
                switchPage={switchPage}
                deletePage={deletePage}
                renamePage={renamePage}
                clonePage={clonePage}
                hidePage={hidePage}
                unHidePage={unHidePage}
                homePageId={homePageId}
                currentPageId={currentPageId}
                updateHomePage={updateHomePage}
                updatePageHandle={updatePageHandle}
                classNames="page-handler"
                onSort={updateOnSortingPages}
                updateOnPageLoadEvents={updateOnPageLoadEvents}
                currentState={currentState}
                apps={apps}
                allpages={pages}
                components={appDefinition?.components ?? {}}
                pinPagesPopover={pinPagesPopover}
                haveUserPinned={haveUserPinned}
              />
            ) : (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                <div>
                  <EmptyIllustration />
                  <p data-cy={`label-no-pages-found`} className="mt-3  color-slate12">
                    No pages found
                  </p>
                </div>
              </div>
            )}

            {newPageBeingCreated && (
              <div className="page-handler">
                <AddingPageHandler
                  addNewPage={addNewPage}
                  setNewPageBeingCreated={setNewPageBeingCreated}
                  switchPage={switchPage}
                  darkMode={darkMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebarPageSelector;
