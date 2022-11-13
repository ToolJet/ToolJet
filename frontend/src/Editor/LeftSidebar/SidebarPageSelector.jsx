import React, { useState } from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import _ from 'lodash';

export const LeftSidebarPageSelector = ({ darkMode, appDefinition, currentPageId, addNewPage, switchPage }) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);

  const pages = Object.entries(appDefinition.pages).map(([id, page]) => ({ id, ...page }));
  const { queryPanelHeight, isExpanded } = JSON.parse(localStorage.getItem('queryManagerPreferences'));
  const pageSelectorHeight = !isExpanded ? window.innerHeight - 85 : (queryPanelHeight * window.innerHeight) / 100 - 45;

  const [newPageBeingCreated, setNewPageBeingCreated] = useState(false);
  const [showHiddenOptionsForPageId, set] = useState(null);

  const pageItem = pages.map((page) => {
    const isSelected = page.id === currentPageId ? 'active-page' : '';

    return (
      <div
        onClick={() => switchPage(page.id)}
        key={page.id}
        className={`list-group-item d-flex justify-content-between align-items-center page-item ${isSelected}`}
        onMouseEnter={() => set(page.id)}
        onMouseLeave={() => set(null)}
      >
        {page.name}
        <div className="">
          <button
            className="btn badge bg-azure-lt"
            // onClick={this.deleteDataQuery}
            style={{
              display: showHiddenOptionsForPageId === page.id ? 'block' : 'none',
              marginTop: '3px',
            }}
          >
            <div>
              <img src="assets/images/icons/query-trash-icon.svg" width="12" height="12" className="mx-1" />
            </div>
          </button>
        </div>
      </div>
    );
  });

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
                  <div
                    type="button"
                    style={{ height: '26px' }}
                    className={`btn btn-sm btn-light m-1 ${darkMode && 'btn-outline-secondary'}`}
                    onClick={() => setNewPageBeingCreated(true)}
                  >
                    <img className="mx-1" src="assets/images/icons/plus.svg" width="12" height="12" />
                    <span className="mx-2">Add</span>
                  </div>

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
              <input type="text" className="form-control" placeholder="Search" />
            </div>
          </div>

          <div className="page-selector-panel-body">
            <div className="list-group">
              {pageItem}
              {newPageBeingCreated && (
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <input
                    type="text"
                    className="form-control"
                    onBlur={(event) => {
                      const name = event.target.value;
                      if (name) {
                        addNewPage({ name, handle: _.kebabCase(name.toLowerCase()) });
                      }
                      setNewPageBeingCreated(false);
                      event.stopPropagation();
                    }}
                  ></input>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
