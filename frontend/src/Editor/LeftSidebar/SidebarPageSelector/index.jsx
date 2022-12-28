import React, { useState } from 'react';
import Fuse from 'fuse.js';
import { LeftSidebarItem } from '../SidebarItem';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import { PageHandler, AddingPageHandler } from './PageHandler';
import { GlobalSettings } from './GlobalSettings';
import _ from 'lodash';
import SortableList from '@/_components/SortableList';
import Popover from '@/_ui/Popover';

const LeftSidebarPageSelector = ({
  appDefinition,
  selectedSidebarItem,
  setSelectedSidebarItem,
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
  const [allpages, setPages] = useState(pages);

  const [newPageBeingCreated, setNewPageBeingCreated] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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

  const popoverContent = (
    <div>
      <div className="card-body p-0" onClick={(event) => event.stopPropagation()}>
        <HeaderSection darkMode={darkMode}>
          <HeaderSection.PanelHeader title="Pages">
            <div className="d-flex justify-content-end">
              <Button
                onClick={() => setNewPageBeingCreated(true)}
                darkMode={darkMode}
                size="sm"
                styles={{ width: '28px', padding: 0 }}
              >
                <Button.Content iconSrc={'assets/images/icons/plus.svg'} direction="left" />
              </Button>
              <Button
                onClick={() => setShowSearch(!showSearch)}
                darkMode={darkMode}
                size="sm"
                styles={{ width: '28px', padding: 0 }}
              >
                <Button.Content iconSrc={'assets/images/icons/search.svg'} direction="left" />
              </Button>
              <GlobalSettings
                darkMode={darkMode}
                showHideViewerNavigationControls={showHideViewerNavigationControls}
                showPageViwerPageNavitation={appDefinition?.showViewerNavigation || false}
              />
            </div>
          </HeaderSection.PanelHeader>
          {showSearch && (
            <HeaderSection.SearchBoxComponent onChange={filterPages} placeholder={'Search'} placeholderIcon={'⌘S'} />
          )}
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
                <div>
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
  );

  return (
    <Popover
      handleToggle={(open) => {
        if (!open) setSelectedSidebarItem('');
      }}
      popoverContentClassName="p-0 sidebar-h-100-popover"
      side="right"
      popoverContent={popoverContent}
    >
      <LeftSidebarItem
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => setSelectedSidebarItem('page')}
        icon="page"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-page-selector`}
      />
    </Popover>
  );
};

export default LeftSidebarPageSelector;
