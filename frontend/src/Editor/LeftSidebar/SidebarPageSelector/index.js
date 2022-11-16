import React, { useState } from 'react';
import Fuse from 'fuse.js';
import { LeftSidebarItem } from '../SidebarItem';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import { SidebarPinnedButton } from '../SidebarPinnedButton';
import { PageHandler, AddingPageHandler } from './PageHandler';
import _ from 'lodash';

const LeftSidebarPageSelector = ({
  darkMode,
  currentPageId,
  addNewPage,
  switchPage,
  deletePage,
  renamePage,
  updateHomePage,
  updatePageHandle,
  queryPanelHeight,
  pages,
  homePageId,
}) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);

  const handlePopoverPinnedState = () => {
    if (!popoverPinned) {
      updatePopoverPinnedState(true);
    }
  };

  const [allpages, setPages] = useState(pages);

  const { isExpanded } = JSON.parse(localStorage.getItem('queryManagerPreferences'));
  const pageSelectorHeight = !isExpanded ? window.innerHeight - 85 : (queryPanelHeight * window.innerHeight) / 100 - 45;
  const isHomePage = homePageId === currentPageId;

  const [newPageBeingCreated, setNewPageBeingCreated] = useState(false);

  const filterPages = (value) => {
    if (!value || value.length === 0) return clearSearch();

    const fuse = new Fuse(allpages, { keys: ['name'], threshold: 0.3 });
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
          height: pageSelectorHeight,
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

                <Button
                  darkMode={darkMode}
                  onClick={null} //Todo: global page settings
                  size="sm"
                  styles={{ width: '28px', padding: 0 }}
                >
                  <Button.Content iconSrc="assets/images/icons/editor/left-sidebar/settings.svg" />
                </Button>

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
            <div className="list-group">
              {allpages.map((page) => (
                <div key={page.id} className="page-handler">
                  <PageHandler
                    darkMode={darkMode}
                    page={page}
                    isSelected={page.id === currentPageId}
                    switchPage={switchPage}
                    deletePage={deletePage}
                    renamePage={renamePage}
                    updatePopoverPinnedState={handlePopoverPinnedState}
                    isHomePage={isHomePage}
                    updateHomePage={updateHomePage}
                    updatePageHandle={updatePageHandle}
                  />
                </div>
              ))}
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
