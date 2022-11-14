import React, { useState } from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import _ from 'lodash';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { SearchBoxComponent } from '@/_ui/Search';
import Fuse from 'fuse.js';
import { Button } from '@/_ui/LeftSidebar';

export const LeftSidebarPageSelector = ({
  darkMode,
  appDefinition,
  currentPageId,
  addNewPage,
  switchPage,
  deletePage,
  renamePage,
  updateHomePage,
}) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);

  const pages = Object.entries(appDefinition.pages).map(([id, page]) => ({ id, ...page }));
  const [allpages, setPages] = useState(pages);

  // const pages = Object.entries(appDefinition.pages).map(([id, page]) => ({ id, ...page }));
  const { queryPanelHeight, isExpanded } = JSON.parse(localStorage.getItem('queryManagerPreferences'));
  const pageSelectorHeight = !isExpanded ? window.innerHeight - 85 : (queryPanelHeight * window.innerHeight) / 100 - 45;
  const isHomePage = appDefinition.homePageId === currentPageId;

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
      console.log('filtering pages -- pages', { pages, x: appDefinition.pages });
      setPages(pages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pages)]);

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
        className={`card popover left-sidebar-page-selector ${open || popoverPinned ? 'show' : 'hide'}`}
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
          <div className="page-selector-panel-header">
            <div className="panel-header-container row">
              <div className="col-3">
                <p className="text-muted m-0 fw-500">Pages</p>
              </div>
              <div className="col-9 px-1">
                <div className="d-flex justify-content-end">
                  <Button
                    onClick={() => setNewPageBeingCreated(true)}
                    darkMode={darkMode}
                    size="sm"
                    styles={{ width: '76px' }}
                  >
                    <Button.Content title={'Add'} iconSrc={'assets/images/icons/plus.svg'} direction="left" />
                  </Button>

                  <div
                    type="button"
                    style={{ height: '26px' }}
                    className={`btn btn-sm btn-light m-1 ${darkMode && 'btn-outline-secondary'}`}
                  >
                    <img
                      className=""
                      src="assets/images/icons/editor/left-sidebar/settings.svg"
                      width="12"
                      height="12"
                    />
                  </div>

                  <SidebarPinnedButton
                    darkMode={darkMode}
                    component={'PageSelector'}
                    state={popoverPinned}
                    updateState={updatePopoverPinnedState}
                  />
                </div>
              </div>
            </div>
            <div className="panel-search-container">
              <SearchBoxComponent
                onChange={filterPages}
                callback={null}
                placeholder={'Search'}
                placeholderIcon={'⌘S'}
              />
            </div>
          </div>

          <div className="page-selector-panel-body">
            <div className="list-group">
              {allpages.map((page) => (
                <div key={page.id} className="page-handler">
                  <PageHandler
                    page={page}
                    isSelected={page.id === currentPageId}
                    switchPage={switchPage}
                    deletePage={deletePage}
                    renamePage={renamePage}
                    updatePopoverPinnedState={updatePopoverPinnedState}
                    isHomePage={isHomePage}
                    updateHomePage={updateHomePage}
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

const PageHandler = ({
  page,
  isSelected,
  switchPage,
  deletePage,
  renamePage,
  updatePopoverPinnedState,
  isHomePage,
  updateHomePage,
}) => {
  const [isEditingPageName, setIsEditingPageName] = useState(false);

  const handleCallback = (id) => {
    switch (id) {
      case 'delete-page':
        deletePage(page.id, isHomePage);
        break;

      case 'rename-page':
        updatePopoverPinnedState(true);
        setIsEditingPageName(true);
        break;

      case 'mark-as-home-page':
        updateHomePage(page.id);
        break;

      default:
        break;
    }
  };

  if (isEditingPageName) {
    return <RenameInput page={page} updaterCallback={renamePage} updatePageEditMode={setIsEditingPageName} />;
  }

  return (
    <div className={`card ${isSelected ? 'active' : 'non-active-page'}`}>
      <div className="card-body">
        <div className="row" role="button" onClick={() => switchPage(page.id)}>
          <div className="col-auto">
            {isSelected && (
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0.666667 1.66667C0.666667 2.03486 0.965143 2.33333 1.33333 2.33333C1.70152 2.33333 2 2.03486 2 1.66667C2 1.29848 1.70152 1 1.33333 1C0.965143 1 0.666667 1.29848 0.666667 1.66667Z"
                  stroke="#8092AC"
                  strokeWidth="1.33333"
                />
                <path
                  d="M5.99992 1.66667C5.99992 2.03486 6.2984 2.33333 6.66659 2.33333C7.03478 2.33333 7.33325 2.03486 7.33325 1.66667C7.33325 1.29848 7.03478 1 6.66659 1C6.2984 1 5.99992 1.29848 5.99992 1.66667Z"
                  stroke="#8092AC"
                  strokeWidth="1.33333"
                />
                <path
                  d="M0.666667 7.00001C0.666667 7.3682 0.965143 7.66668 1.33333 7.66668C1.70152 7.66668 2 7.3682 2 7.00001C2 6.63182 1.70152 6.33334 1.33333 6.33334C0.965143 6.33334 0.666667 6.63182 0.666667 7.00001Z"
                  stroke="#8092AC"
                  strokeWidth="1.33333"
                />
                <path
                  d="M5.99992 7.00001C5.99992 7.3682 6.2984 7.66668 6.66659 7.66668C7.03478 7.66668 7.33325 7.3682 7.33325 7.00001C7.33325 6.63182 7.03478 6.33334 6.66659 6.33334C6.2984 6.33334 5.99992 6.63182 5.99992 7.00001Z"
                  stroke="#8092AC"
                  strokeWidth="1.33333"
                />
                <path
                  d="M0.666667 12.3333C0.666667 12.7015 0.965143 13 1.33333 13C1.70152 13 2 12.7015 2 12.3333C2 11.9651 1.70152 11.6667 1.33333 11.6667C0.965143 11.6667 0.666667 11.9651 0.666667 12.3333Z"
                  stroke="#8092AC"
                  strokeWidth="1.33333"
                />
                <path
                  d="M5.99992 12.3333C5.99992 12.7015 6.2984 13 6.66659 13C7.03478 13 7.33325 12.7015 7.33325 12.3333C7.33325 11.9651 7.03478 11.6667 6.66659 11.6667C6.2984 11.6667 5.99992 11.9651 5.99992 12.3333Z"
                  stroke="#8092AC"
                  strokeWidth="1.33333"
                />
              </svg>
            )}
          </div>
          <div className="col text-truncate" data-cy="event-handler">
            {page.name}
          </div>
          <div className="col-auto">
            {isSelected && isHomePage && (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.09469 0.910582C8.42013 0.585145 8.94776 0.585145 9.2732 0.910582L16.7732 8.41058C17.0115 8.64891 17.0828 9.00735 16.9538 9.31874C16.8249 9.63014 16.521 9.83317 16.1839 9.83317H15.3506V14.8332C15.3506 15.4962 15.0872 16.1321 14.6184 16.6009C14.1495 17.0698 13.5137 17.3332 12.8506 17.3332H4.51728C3.85424 17.3332 3.21835 17.0698 2.74951 16.6009C2.28067 16.1321 2.01728 15.4962 2.01728 14.8332V9.83317H1.18394C0.846892 9.83317 0.543028 9.63014 0.414044 9.31874C0.28506 9.00735 0.356356 8.64891 0.594688 8.41058L8.09469 0.910582ZM3.14304 8.21926C3.45903 8.33769 3.68394 8.6425 3.68394 8.99984V14.8332C3.68394 15.0542 3.77174 15.2661 3.92802 15.4224C4.0843 15.5787 4.29626 15.6665 4.51728 15.6665H12.8506C13.0716 15.6665 13.2836 15.5787 13.4399 15.4224C13.5961 15.2661 13.6839 15.0542 13.6839 14.8332V8.99984C13.6839 8.6425 13.9089 8.33769 14.2248 8.21926L8.68394 2.67835L3.14304 8.21926ZM6.18394 8.99984C6.18394 8.5396 6.55704 8.1665 7.01728 8.1665H10.3506C10.8108 8.1665 11.1839 8.5396 11.1839 8.99984V12.3332C11.1839 12.7934 10.8108 13.1665 10.3506 13.1665H7.01728C6.55704 13.1665 6.18394 12.7934 6.18394 12.3332V8.99984ZM7.85061 9.83317V11.4998H9.51728V9.83317H7.85061Z"
                  fill="#121212"
                />
              </svg>
            )}
          </div>
          <div className="col-auto">
            {isSelected && (
              <PagehandlerMenu
                darkMode={false}
                handlePageCallback={handleCallback}
                onToggle={updatePopoverPinnedState}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AddingPageHandler = ({ addNewPage, setNewPageBeingCreated }) => {
  const handleAddingNewPage = (pageName) => {
    if (pageName) {
      addNewPage({ name: pageName, handle: _.kebabCase(pageName.toLowerCase()) });
    }
    setNewPageBeingCreated(false);
  };

  return (
    <div className="row" role="button">
      <div className="col-12">
        <input
          type="text"
          className="form-control page-name-input"
          autoFocus
          onBlur={(event) => {
            const name = event.target.value;
            handleAddingNewPage(name);
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const name = event.target.value;
              handleAddingNewPage(name);
              event.stopPropagation();
            }
          }}
        />
      </div>
    </div>
  );
};

const RenameInput = ({ page, updaterCallback, updatePageEditMode }) => {
  const handleAddingNewPage = (pageName) => {
    if (pageName.length > 0 && pageName !== page.name) {
      updaterCallback(page.id, pageName);
    }
    updatePageEditMode(false);
  };

  return (
    <div className="row" role="button">
      <div className="col-12">
        <input
          type="text"
          className="form-control page-name-input"
          autoFocus
          defaultValue={page.name}
          onBlur={(event) => {
            const name = event.target.value;
            handleAddingNewPage(name);
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const name = event.target.value;
              handleAddingNewPage(name);
              event.stopPropagation();
            }
          }}
        />
      </div>
    </div>
  );
};

const PagehandlerMenu = ({ darkMode, handlePageCallback, onToggle }) => {
  const closeMenu = () => {
    document.body.click();
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom'}
      rootClose
      // onToggle={() => onToggle(true)}
      overlay={
        <Popover id="popover-app-menu" className={darkMode && 'popover-dark-themed'}>
          <Popover.Content bsPrefix="popover-body">
            <div className="card-body">
              <Field id="rename-page" text="Rename" closeMenu={closeMenu} callback={handlePageCallback} />
              <Field id="mark-as-home-page" text="Mark home" closeMenu={closeMenu} callback={handlePageCallback} />
              <Field id="change-page-handle" text="Change page handle" closeMenu={closeMenu} />
              <Field
                id="delete-page"
                text="Delete page"
                customClass="field__danger"
                closeMenu={closeMenu}
                callback={handlePageCallback}
              />
            </div>
          </Popover.Content>
        </Popover>
      }
    >
      <span>
        <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.333252 2.16667C0.333252 1.24619 1.07944 0.5 1.99992 0.5C2.92039 0.5 3.66659 1.24619 3.66659 2.16667C3.66659 3.08714 2.92039 3.83333 1.99992 3.83333C1.07944 3.83333 0.333252 3.08714 0.333252 2.16667ZM0.333252 8C0.333252 7.07953 1.07944 6.33333 1.99992 6.33333C2.92039 6.33333 3.66659 7.07953 3.66659 8C3.66659 8.92047 2.92039 9.66667 1.99992 9.66667C1.07944 9.66667 0.333252 8.92047 0.333252 8ZM0.333252 13.8333C0.333252 12.9129 1.07944 12.1667 1.99992 12.1667C2.92039 12.1667 3.66659 12.9129 3.66659 13.8333C3.66659 14.7538 2.92039 15.5 1.99992 15.5C1.07944 15.5 0.333252 14.7538 0.333252 13.8333Z"
            fill="#7E868C"
          />
        </svg>
      </span>
    </OverlayTrigger>
  );
};

const Field = ({ id, text, customClass = '', closeMenu, callback = () => null }) => {
  return (
    <div className={`field mb-3${customClass ? ` ${customClass}` : ''}`}>
      <span
        role="button"
        onClick={() => {
          closeMenu(text);
          console.log('filed fired', text);
          callback(id);
        }}
        data-cy={`${text.toLowerCase().replace(/\s+/g, '-')}-card-option`}
      >
        {text}
      </span>
    </div>
  );
};
