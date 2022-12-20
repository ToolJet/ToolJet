import React, { useState } from 'react';
import Fuse from 'fuse.js';
import { LeftSidebarItem } from '../SidebarItem';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import { SidebarPinnedButton } from '../SidebarPinnedButton';
import { PageHandler, AddingPageHandler } from './PageHandler';
import { GlobalSettings } from './GlobalSettings';
import _ from 'lodash';
import SortableList from '@/_components/SortableList';

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
  currentState,
  apps,
  dataQueries,
}) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);

  const handlePopoverPinnedState = () => {
    if (!popoverPinned) {
      updatePopoverPinnedState(true);
    }
  };

  const [allpages, setPages] = useState(pages);

  const [newPageBeingCreated, setNewPageBeingCreated] = useState(false);

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

  return (
    <>
      <LeftSidebarItem
        tip="Pages"
        {...trigger}
        icon="page"
        className={`left-sidebar-item left-sidebar-layout ${open && 'active'} left-sidebar-page-selector`}
        text={'Pages'}
      />
      <div
        {...content}
        className={`card popover left-sidebar-page-selector ${open || popoverPinned ? 'show' : 'hide'} ${
          darkMode && 'dark'
        } `}
        style={{
          minWidth: '295px',
          top: '45px',
          borderRadius: '0px',
          height: '100%',
          maxHeight: window.innerHeight,
          overflowX: 'hidden',
        }}
      >
        <div className="card-body p-0" onClick={(event) => event.stopPropagation()}>
          <HeaderSection darkMode={darkMode}>
            <HeaderSection.PanelHeader title="Pages">
              <div className="d-flex justify-content-end">
                <Button
                  onClick={() => setNewPageBeingCreated(true)}
                  darkMode={darkMode}
                  size="sm"
                  styles={{ width: '76px' }}
                >
                  <Button.Content title={'Add'} iconSrc={'assets/images/icons/plus.svg'} direction="left" />
                </Button>

                <GlobalSettings
                  darkMode={darkMode}
                  handlePopoverPinnedState={handlePopoverPinnedState}
                  showHideViewerNavigationControls={showHideViewerNavigationControls}
                  showPageViwerPageNavitation={appDefinition?.showViewerNavigation || false}
                />

                <SidebarPinnedButton
                  darkMode={darkMode}
                  component={'PageSelector'}
                  state={popoverPinned}
                  updateState={updatePopoverPinnedState}
                />
              </div>
            </HeaderSection.PanelHeader>
            <HeaderSection.SearchBoxComponent onChange={filterPages} placeholder={'Search'} placeholderIcon={'⌘S'} />
          </HeaderSection>

          <div className={`${darkMode && 'dark'} page-selector-panel-body`}>
            <div className="">
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
                  updatePopoverPinnedState={handlePopoverPinnedState}
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
                  dataQueries={dataQueries}
                />
              ) : (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                  <div className="text-center">
                    <img src="assets/images/no-results.svg" alt="empty-page" />
                    <p className="mt-3">No pages found</p>
                  </div>
                </div>
              )}

              {newPageBeingCreated && (
                <div className="page-handler">
                  <AddingPageHandler
                    addNewPage={addNewPage}
                    setNewPageBeingCreated={setNewPageBeingCreated}
                    switchPage={switchPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftSidebarPageSelector;
