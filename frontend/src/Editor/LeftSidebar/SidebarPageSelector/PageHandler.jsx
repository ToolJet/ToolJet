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
import EyeDisable from '@/_ui/Icon/solidIcons/EyeDisable';
import FileRemove from '@/_ui/Icon/solidIcons/FIleRemove';
import Home from '@/_ui/Icon/solidIcons/Home';

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
  disableEnablePage,
}) => {
  const isHomePage = page.id === homePageId;
  const isSelected = page.id === currentPageId;
  const isHidden = page?.hidden ?? false;
  const isDisabled = page?.disabled ?? false;
  const isIconApplied = isHomePage || isHidden || isDisabled;
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
      case 'disable-page':
        disableEnablePage({ pageId: page.id, isDisabled: true });
        break;
      case 'enable-page':
        disableEnablePage({ pageId: page.id });
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
            {!isHovered && isHomePage && <Home width={16} height={16} />}
            {/* When the page is hidden as well as disabled, disabled icon takes precedence */}
            {!isHovered && (isDisabled || (isDisabled && isHidden)) && (
              <FileRemove width={16} height={16} viewBox={'0 0 16 16'} />
            )}
            {!isHovered && isHidden && !isDisabled && <EyeDisable width={16} height={16} />}
            {/* When hovered on disabled page, show disabled icon instead of hovered icon */}
            {isHovered && isDisabled && <FileRemove width={16} height={16} viewBox={'0 0 16 16'} />}
            {isHovered && !isDisabled && (
              <div style={{ paddingRight: '4px' }}>
                <SortableList.DragHandle show />
              </div>
            )}
          </div>
          <div
            className="col text-truncate font-weight-400 page-name tj-text-xsm  color-slate12"
            data-cy={`pages-name-${String(page.name).toLowerCase()}`}
            style={isHomePage || isHidden || isHovered || isDisabled ? { paddingLeft: '0px' } : { paddingLeft: '16px' }}
          >
            {`${page.name}`}
            {isIconApplied && (
              <span
                style={{
                  marginLeft: '8px',
                }}
                className="color-slate09"
              >
                {isHomePage && 'Home'}
                {(isDisabled || (isDisabled && isHidden)) && 'Disabled'}
                {isHidden && !isDisabled && 'Hidden'}
              </span>
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
                isDisabled={isDisabled}
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
