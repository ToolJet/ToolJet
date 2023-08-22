import React, { useState } from 'react';
import { RenameInput } from './RenameInput';
import { PagehandlerMenu } from './PagehandlerMenu';
import { EditModal } from './EditModal';
import { SettingsModal } from './SettingsModal';
import _ from 'lodash';
import SortableList from '@/_components/SortableList';
import { toast } from 'react-hot-toast';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const PageHandler = ({
  darkMode,
  page,
  switchPage,
  deletePage,
  renamePage,
  clonePage,
  hidePage,
  unHidePage,
  homePageId,
  currentPageId,
  updateHomePage,
  updatePageHandle,
  updateOnPageLoadEvents,
  apps,
  pages,
  components,
  pinPagesPopover,
  haveUserPinned,
}) => {
  const isHomePage = page.id === homePageId;
  const isSelected = page.id === currentPageId;
  const isHidden = page?.hidden ?? false;

  const [isEditingPageName, setIsEditingPageName] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPagehandlerMenu, setShowPagehandlerMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );
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
        deletePage(page.id, isHomePage, page.name);
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

      case 'clone-page':
        clonePage(page.id);
        break;

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
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <div>
        <div className="row" role="button">
          <div className="col-auto d-flex align-items-center">
            {!isHovered && isHomePage && (
              <img
                className="animation-fade"
                data-toggle="tooltip"
                title="home page"
                src="assets/images/icons/home.svg"
                height={14}
                width={14}
                data-cy={'home-page-icon'}
              />
            )}
            <SortableList.DragHandle show={isHovered} />
          </div>
          <div
            className="col text-truncate font-weight-400 page-name tj-text-xsm"
            data-cy={`pages-name-${String(page.name).toLowerCase()}`}
          >
            {page.name}
          </div>
          <div className="col-auto page-icons">
            {isHidden && (
              <SolidIcon data-cy={'hide-page-icon'} width={14} title="hidden" data-toggle="tooltip" name="eyedisable" />
            )}
          </div>
          <div className="col-auto">
            {(isHovered || isSelected) && !isVersionReleased && (
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
              handleClose={() => {
                setShowSettingsModal(false);
                !haveUserPinned && pinPagesPopover(false);
              }}
              darkMode={darkMode}
              updateOnPageLoadEvents={updateOnPageLoadEvents}
              apps={apps}
              pages={pages}
              components={components}
              pinPagesPopover={pinPagesPopover}
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
    <div className="row" role="button" style={{ marginTop: '2px' }}>
      <div className="col-12">
        <input
          type="text"
          className={`form-control page-name-input color-slate12 ${darkMode && 'bg-transparent'}`}
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
