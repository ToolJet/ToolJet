import React, { useState } from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import _ from 'lodash';
import RunjsIcon from '../Icons/runjs.svg';
import { toast } from 'react-hot-toast';
// eslint-disable-next-line import/no-unresolved
import { allSvgs } from '@tooljet/plugins/client';

export const LeftSidebarPageSelector = ({ appDefinition, pageHandle, addNewPage, switchPage }) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);

  const queryDefinitions = appDefinition['queries'];

  const queries = {};

  const pageHandles = Object.keys(appDefinition.pages ?? {});
  const pages = pageHandles.map((pageHandle) => ({
    name: appDefinition.pages[pageHandle].name ?? pageHandle,
    handle: pageHandle,
  }));

  if (!_.isEmpty(queryDefinitions)) {
    queryDefinitions.forEach((query) => {
      queries[query.name] = { id: query.id };
    });
  }

  const [newPageBeingCreated, setNewPageBeingCreated] = useState(false);

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
        style={{ resize: 'horizontal', maxWidth: '60%', minWidth: '422px', top: '120px' }}
      >
        <div style={{ marginTop: '1rem' }} className="card-body" onClick={(event) => event.stopPropagation()}>
          <div className="list-group">
            {pages.map((page) => (
              <>
                <a
                  onClick={() => switchPage(page.handle)}
                  className={`list-group-item list-group-item-action ${page.handle === pageHandle ? 'active' : ''}`}
                >
                  {page.name}
                </a>
              </>
            ))}
            {newPageBeingCreated ? (
              <a className="list-group-item">
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
              </a>
            ) : (
              <></>
            )}
          </div>
          <div className="add-new-page-button-container d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary btn-sm add-new-page"
              onClick={() => setNewPageBeingCreated(true)}
            >
              Add page
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
