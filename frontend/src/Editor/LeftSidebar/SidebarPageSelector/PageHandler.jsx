import React, { useState } from 'react';
import { RenameInput } from './RenameInput';
import { PagehandlerMenu } from './PagehandlerMenu';
import useHover from '@/_hooks/useHover';
import { EditModal } from './EditModal';
import _ from 'lodash';

export const PageHandler = ({
  darkMode,
  page,
  isSelected,
  switchPage,
  deletePage,
  renamePage,
  updatePopoverPinnedState,
  homePageId,
  currentPageId,
  updateHomePage,
  updatePageHandle,
}) => {
  const isHomePage = page.id === homePageId;

  const [isEditingPageName, setIsEditingPageName] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPagehandlerMenu, setShowPagehandlerMenu] = useState(false);

  const handleClose = () => {
    setShowEditModal(false);
    setShowPagehandlerMenu(true);
  };
  const handleShow = () => {
    setShowEditModal(true);
    setShowPagehandlerMenu(false);
  };

  React.useEffect(() => {
    if (showPagehandlerMenu) {
      updatePopoverPinnedState(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPagehandlerMenu]);

  const handleCallback = (id) => {
    switch (id) {
      case 'delete-page':
        deletePage(page.id, isHomePage);
        break;

      case 'rename-page':
        setIsEditingPageName(true);
        break;

      case 'mark-as-home-page':
        updateHomePage(page.id);
        break;

      case 'edit-page-handle':
        handleShow();

        break;

      default:
        break;
    }
  };

  const [hoverRef, isHovered] = useHover();

  React.useEffect(() => {
    if (!isHovered && !isSelected && showPagehandlerMenu) {
      setShowPagehandlerMenu(false);
    }

    if (isHovered && currentPageId !== page.id) {
      setShowPagehandlerMenu(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  if (isEditingPageName) {
    return <RenameInput page={page} updaterCallback={renamePage} updatePageEditMode={setIsEditingPageName} />;
  }
  const windowUrl = window.location.href;

  const slug = windowUrl.split(page.handle)[0];

  return (
    <div
      onMouseLeave={() => setShowPagehandlerMenu(false)}
      ref={hoverRef}
      className={`card cursor-pointer ${isSelected ? 'active' : 'non-active-page'}`}
      onClick={() => switchPage(page.id)}
    >
      <div className="card-body">
        <div className="row" role="button">
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
            {(isHovered || isSelected) && isHomePage && (
              <img src="assets/images/icons/home.svg" height={14} width={14} />
            )}
          </div>
          <div className="col-auto">
            {(isHovered || isSelected) && (
              <PagehandlerMenu
                page={page}
                darkMode={darkMode}
                handlePageCallback={handleCallback}
                showMenu={showPagehandlerMenu}
                setShowMenu={setShowPagehandlerMenu}
                isHome={true}
              />
            )}
            <EditModal
              slug={slug}
              page={page}
              show={showEditModal}
              handleClose={handleClose}
              updatePageHandle={updatePageHandle}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AddingPageHandler = ({ addNewPage, setNewPageBeingCreated }) => {
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
