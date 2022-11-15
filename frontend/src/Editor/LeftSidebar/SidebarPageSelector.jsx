import React, { useState } from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import _ from 'lodash';
import { OverlayTrigger, Popover, Modal } from 'react-bootstrap';
import Fuse from 'fuse.js';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import { Alert } from '@/_ui/Alert';

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

  const handlePopoverPinnedState = () => {
    if (!popoverPinned) {
      updatePopoverPinnedState(true);
    }
  };

  const pages = Object.entries(appDefinition.pages).map(([id, page]) => ({ id, ...page }));
  const [allpages, setPages] = useState(pages);

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
  darkMode,
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

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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

      case 'edit-page-handle':
        updatePopoverPinnedState(true);
        handleShow();
        break;

      default:
        break;
    }
  };

  if (isEditingPageName) {
    return <RenameInput page={page} updaterCallback={renamePage} updatePageEditMode={setIsEditingPageName} />;
  }
  const windowUrl = window.location.href;

  const slug = `...${windowUrl.split(page.handle)[0].substring(34, 49)}/`;
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
            {isSelected && isHomePage && <img src="assets/images/icons/home.svg" height={14} width={14} />}
          </div>
          <div className="col-auto">
            {isSelected && <PagehandlerMenu page={page} darkMode={darkMode} handlePageCallback={handleCallback} />}
            <EditModal slug={slug} page={page} show={show} handleClose={handleClose} darkMode={darkMode} />
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

const PagehandlerMenu = ({ page, slug, darkMode, handlePageCallback }) => {
  const closeMenu = () => {
    document.body.click();
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom'}
      rootClose
      overlay={
        <Popover id="page-handler-menu" className={darkMode && 'popover-dark-themed'}>
          <Popover.Content bsPrefix="popover-body">
            <div className="card-body">
              <PageHandleField slug={slug} page={page} updatePageHandle={handlePageCallback} closeMenu={closeMenu} />
              <hr style={{ margin: '0.75rem 0' }} />
              <div className="menu-options mb-0">
                <Field
                  id="rename-page"
                  text="Rename"
                  iconSrc={'assets/images/icons/input.svg'}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                />
                <Field
                  id="duplicate-page"
                  text="Duplicate"
                  iconSrc={'assets/images/icons/duplicate.svg'}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                />
                <Field
                  id="mark-as-home-page"
                  text="Mark home"
                  iconSrc={'assets/images/icons/home.svg'}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                />

                <Field
                  id="hide-page"
                  text="Hide Page"
                  iconSrc={'assets/images/icons/eye.svg'}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                />

                <Field
                  id="delete-page"
                  text="Delete page"
                  iconSrc={'assets/images/icons/delete.svg'}
                  customClass="field__danger"
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                />
              </div>
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

const Field = ({ id, text, iconSrc, customClass = '', closeMenu, callback = () => null }) => {
  const handleOnClick = () => {
    closeMenu();
    callback(id);
  };

  return (
    <div className={`field ${customClass ? ` ${customClass}` : ''}`}>
      <Button.UnstyledButton onClick={handleOnClick} styles={{ height: '28px' }}>
        <Button.Content title={text} iconSrc={iconSrc} direction="left" />
      </Button.UnstyledButton>
    </div>
  );
};

const PageHandleField = ({ slug, page, updatePageHandle, closeMenu }) => {
  const Label = () => {
    return (
      <label htmlFor="pin" className="form-label">
        Page Handle
      </label>
    );
  };

  const content = () => {
    return (
      <div className="col">
        <span style={{ color: '#889096' }}>{slug}</span>
        <span>{page.handle}</span>
      </div>
    );
  };

  return (
    <div className="mb-2 px-2">
      <Label />
      <Button.UnstyledButton
        onClick={() => {
          updatePageHandle('edit-page-handle');
          closeMenu();
        }}
        classNames="page-handle-button-container"
      >
        <Button.Content title={content} iconSrc={'assets/images/icons/input.svg'} direction="right" />
      </Button.UnstyledButton>
    </div>
  );
};

const EditModal = ({ slug, page, show, handleClose, darkMode }) => {
  const [error, setError] = useState(null);

  React.useEffect(() => {
    setError(null);
  }, [show]);

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="sm"
      centered
      className={`${darkMode && 'theme-dark'} page-handle-edit-modal `}
    >
      <Modal.Header>
        <Modal.Title style={{ fontSize: '16px', fontWeight: '400' }}>Edit page handle</Modal.Title>
        <span className="cursor-pointer" size="sm" onClick={() => handleClose()}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-x"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
      </Modal.Header>
      <Modal.Body>
        <div className="page-handle-edit-container mb-4">
          <EditInput slug={slug} value={page.handle} error={error} setError={setError} />
        </div>

        <div className="alert-container">
          <Alert svg="alert-info" cls="page-handler-alert">
            some warning about the effects changing pagehandle will create.
          </Alert>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button darkMode={darkMode} onClick={handleClose} styles={{ height: '32px' }}>
          <Button.Content title="Cancel" />
        </Button>
        <Button
          darkMode={darkMode}
          onClick={null}
          styles={{ backgroundColor: '#3E63DD', color: '#FDFDFE', height: '32px' }}
          disabled={error !== null}
        >
          <Button.Content title="Save" iconSrc="assets/images/icons/save.svg" direction="left" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const EditInput = ({ slug, value, error, setError }) => {
  const [pageHandle, setPageHandle] = useState(value);

  const onChangePageHandleValue = (event) => {
    setError(null);
    const newHandle = event.target.value;

    if (newHandle === '') setError('Page handle cannot be empty');
    if (newHandle === value) setError('Page handle cannot be same as the existing page handle');

    console.log('pagehandle value', newHandle);
    setPageHandle(newHandle);
  };

  return (
    <div className="input-group col">
      <div className="input-group-text">
        <span style={{ color: '#889096' }}>{slug}</span>
      </div>
      <input
        type="text"
        className={`page-handler-input form-control form-control-sm ${error ? 'is-invalid' : ''}`}
        placeholder={'Enter page handle'}
        onChange={onChangePageHandleValue}
        value={pageHandle}
      />
      <div className="invalid-feedback">{error}</div>
    </div>
  );
};
