import React, { useState } from 'react';
import { RenameInput } from './RenameInput';
import { PagehandlerMenu } from './PagehandlerMenu';
import { EditModal } from './EditModal';
import { SettingsModal } from './SettingsModal';
import _ from 'lodash';
import SortableList from '@/_components/SortableList';
import { toast } from 'react-hot-toast';

export const PageHandler = ({
  darkMode,
  page,
  switchPage,
  deletePage,
  renamePage,
  // clonePage,
  hidePage,
  unHidePage,
  homePageId,
  currentPageId,
  updateHomePage,
  updatePageHandle,
  updateOnPageLoadEvents,
  currentState,
  apps,
  pages,
  components,
  dataQueries,
}) => {
  const isHomePage = page.id === homePageId;
  const isSelected = page.id === currentPageId;
  const isHidden = page?.hidden ?? false;

  const [isEditingPageName, setIsEditingPageName] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPagehandlerMenu, setShowPagehandlerMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClose = () => {
    setShowEditModal(false);
    setShowPagehandlerMenu(true);
  };
  const handleShow = () => {
    setShowEditModal(true);
    setShowPagehandlerMenu(false);
  };

  const showSettings = () => {
    setShowSettingsModal(true);
  };

  const handleCallback = (id) => {
    setIsHovered(false);
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

      case 'settings':
        showSettings();
        break;

      // case 'duplicate-page':
      //   clonePage(page.id);
      //   break;

      case 'hide-page':
        hidePage(page.id);
        break;

      case 'unhide-page':
        unHidePage(page.id);
        break;

      default:
        break;
    }
  };

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`card cursor-pointer ${isSelected ? 'active' : 'non-active-page'}`}
      onClick={() => page.id != currentPageId && switchPage(page.id)}
    >
      <div className="card-body">
        <div className="row" role="button">
          <div className="col-auto">
            {!isHovered && isHomePage && (
              <img
                className="animation-fade"
                data-toggle="tooltip"
                title="home page"
                src="assets/images/icons/home.svg"
                height={14}
                width={14}
              />
            )}
            <SortableList.DragHandle show={isHovered} />
          </div>
          <div className="col text-truncate font-weight-400 page-name" data-cy="event-handler">
            {page.name}
          </div>
          <div className="col-auto page-icons">
            {isHidden && (
              <img
                data-toggle="tooltip"
                title="hidden"
                className="mx-2"
                src="assets/images/icons/eye-off.svg"
                height={14}
                width={14}
              />
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
                isHidden={isHidden}
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
            <SettingsModal
              page={page}
              show={showSettingsModal}
              handleClose={() => setShowSettingsModal(false)}
              darkMode={darkMode}
              updateOnPageLoadEvents={updateOnPageLoadEvents}
              currentState={currentState}
              apps={apps}
              pages={pages}
              components={components}
              dataQueries={dataQueries}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AddingPageHandler = ({ addNewPage, setNewPageBeingCreated, darkMode }) => {
  const handleAddingNewPage = (pageName) => {
    if (pageName.trim().length === 0) {
      toast('Page name should have at least 1 character', {
        icon: '⚠️',
      });
    }

    if (pageName && pageName.trim().length > 0) {
      addNewPage({ name: pageName, handle: _.kebabCase(pageName.toLowerCase()) });
    }
    setNewPageBeingCreated(false);
  };

  return (
    <div className="row" role="button">
      <div className="col-12">
        <input
          type="text"
          className={`form-control page-name-input ${darkMode && 'bg-transparent'}`}
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
