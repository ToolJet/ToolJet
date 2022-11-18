import React, { useState } from 'react';
import { RenameInput } from './RenameInput';
import { PagehandlerMenu } from './PagehandlerMenu';
import useHover from '@/_hooks/useHover';
import { EditModal } from './EditModal';
import _ from 'lodash';
import SortableList from '@/_components/SortableList';

export const PageHandler = ({
  darkMode,
  page,
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
  const isSelected = page.id === currentPageId;

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
            <SortableList.DragHandle show={isHovered} />
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
                isHome={isHomePage}
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
