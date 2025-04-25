import React from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { Button } from '@/_ui/LeftSidebar';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const PageHandlerMenu = ({ darkMode }) => {
  const setShowEditingPopover = useStore((state) => state.setShowEditingPopover);
  const setShowPageEventsModal = useStore((state) => state.setShowPageEventsModal);

  const editingPage = useStore((state) => state.editingPage);
  const showEditingPopover = useStore((state) => state.showEditingPopover);
  const popoverTargetId = useStore((state) => state.popoverTargetId);
  const targetContainer = document.getElementById(popoverTargetId);
  const closePageEditPopover = useStore((state) => state.closePageEditPopover);
  const toggleEditPageHandleModal = useStore((state) => state.toggleEditPageHandleModal);
  const togglePageEventsModal = useStore((state) => state.togglePageEventsModal);
  const toggleEditPageNameInput = useStore((state) => state.toggleEditPageNameInput);
  const disableOrEnablePage = useStore((state) => state.disableOrEnablePage);
  const updatePageVisibility = useStore((state) => state.updatePageVisibility);
  const toggleDeleteConfirmationModal = useStore((state) => state.toggleDeleteConfirmationModal);
  const clonePage = useStore((state) => state.clonePage);
  const markAsHomePage = useStore((state) => state.markAsHomePage);
  const togglePagePermissionModal = useStore((state) => state.togglePagePermissionModal);
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;

  const closeMenu = () => {
    closePageEditPopover();
  };

  const homePageId = useStore((state) => state.app.homePageId);
  const page = editingPage;
  const isHomePage = page?.id === homePageId;
  const showMenu = showEditingPopover;

  const handlePageCallback = () => {
    setShowEditingPopover(false);
    setShowPageEventsModal(true);
  };
  const isDisabled = !!editingPage?.disabled;
  const isHidden = !!editingPage?.hidden;

  return (
    <Overlay
      placement="auto"
      target={targetContainer}
      show={showMenu}
      rootClose
      onHide={closeMenu}
      popperConfig={{
        modifiers: [
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['top', 'bottom', 'left', 'right'],
              flipVariations: true,
              allowedAutoPlacements: ['top', 'bottom'],
              boundary: 'viewport',
            },
          },
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              altAxis: true,
              tether: false,
            },
          },
          {
            name: 'offset',
            options: {
              offset: [0, 10],
            },
          },
        ],
      }}
    >
      {(props) => (
        <Popover {...props} id="page-handler-menu" className={darkMode ? 'dark-theme' : ''}>
          <Popover.Body key={page?.id}>
            <div className="card-body">
              <PageHandleField
                page={page}
                updatePageHandle={() => {
                  toggleEditPageHandleModal(true);
                }}
              />
              <hr style={{ margin: '0.75rem 0' }} />
              <div className="menu-options mb-0">
                <Field
                  id="rename-page"
                  text="Rename"
                  iconSrc={'assets/images/icons/input.svg'}
                  closeMenu={() => {}}
                  callback={() => {
                    toggleEditPageNameInput(true);
                  }}
                />
                {isDisabled || isHidden ? null : (
                  <Field
                    id="mark-as-home-page"
                    text="Mark home"
                    iconSrc={'assets/images/icons/home.svg'}
                    closeMenu={() => {}}
                    callback={() => markAsHomePage(editingPage.id)}
                  />
                )}
                {!isDisabled && (
                  <Field
                    id={isHidden ? 'unhide-page' : 'hide-page'}
                    text={isHidden ? 'Show page on app menu' : 'Hide page on app menu'}
                    iconSrc={`assets/images/icons/${isHidden ? 'eye' : 'eye-off'}.svg`}
                    closeMenu={() => {}}
                    callback={() => {
                      updatePageVisibility(editingPage.id, !editingPage.hidden);
                    }}
                    disabled={isHomePage}
                  />
                )}
                <Field
                  id="clone-page"
                  text="Duplicate page"
                  iconSrc={`assets/images/icons/clone.svg`}
                  closeMenu={closeMenu}
                  callback={() => {
                    clonePage(editingPage.id);
                  }}
                />
                <Field
                  id="settings"
                  text="Event Handlers"
                  customClass={'delete-btn'}
                  iconSrc={'assets/images/icons/editor/left-sidebar/page-settings.svg'}
                  closeMenu={() => {}}
                  callback={() => {
                    togglePageEventsModal(true);
                  }}
                />
                <Field
                  id={isDisabled ? 'enable-page' : 'disable-page'}
                  text={isDisabled ? 'Enable' : 'Disable'}
                  customClass={'delete-btn'}
                  iconSrc={`assets/images/icons/editor/left-sidebar/${isDisabled ? 'file-accept' : 'file-remove'}.svg`}
                  closeMenu={() => {}}
                  callback={() => {
                    disableOrEnablePage(editingPage.id, !editingPage.disabled);
                  }}
                  disabled={isHomePage}
                />

                <Field
                  id={isDisabled ? 'enable-page' : 'disable-page'}
                  disabled={!licenseValid}
                  classNames={'page-permission-btn'}
                  text={() => {
                    return (
                      <ToolTip
                        message={'Page permissions are available only in paid plans'}
                        placement="right"
                        show={!licenseValid}
                      >
                        <div className="d-flex align-items-center">
                          <div>Page permission</div>
                          {!licenseValid && <SolidIcon name="enterprisesmall" />}
                        </div>
                      </ToolTip>
                    );
                  }}
                  customClass={'delete-btn'}
                  iconSrc={`assets/images/icons/editor/left-sidebar/authorization.svg`}
                  closeMenu={closeMenu}
                  callback={(id) => {
                    togglePagePermissionModal(true);
                  }}
                />
                <Field
                  id="delete-page"
                  text="Delete page"
                  iconSrc={'assets/images/icons/delete.svg'}
                  customClass={isHomePage ? 'delete-btn' : 'field__danger delete-btn'}
                  closeMenu={() => {}}
                  callback={() => {
                    toggleDeleteConfirmationModal(true);
                  }}
                  disabled={isHomePage}
                />
              </div>
            </div>
          </Popover.Body>
        </Popover>
      )}
    </Overlay>
  );
};

const PageHandleField = ({ page, updatePageHandle }) => {
  const Label = () => {
    return (
      <label htmlFor="pin" className="form-label" data-cy={`header-page-handle`}>
        Page Handle
      </label>
    );
  };

  const content = () => {
    return (
      <div className="col text-truncate pe-3">
        <span style={{ color: '#889096' }}>.../</span>
        <span data-cy={`page-handle-text`}>{page?.handle}</span>
      </div>
    );
  };

  return (
    <div className="mb-2 px-2">
      <Label />
      <Button.UnstyledButton
        onClick={(e) => {
          e.stopPropagation();
          updatePageHandle();
        }}
        classNames="page-handle-button-container"
      >
        <Button.Content
          title={content}
          iconSrc={'assets/images/icons/input.svg'}
          direction="right"
          dataCy={`page-handler`}
        />
      </Button.UnstyledButton>
    </div>
  );
};

const Field = ({
  id,
  text,
  iconSrc,
  customClass = '',
  classNames,
  closeMenu,
  disabled = false,
  callback = () => null,
}) => {
  const handleOnClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    callback(id);
    closeMenu();
  };

  return (
    <div className={`field ${customClass ? ` ${customClass}` : ''}`}>
      <Button.UnstyledButton
        onClick={handleOnClick}
        styles={{ height: '28px' }}
        classNames={classNames}
        disabled={disabled}
      >
        <Button.Content title={text} iconSrc={iconSrc} direction="left" />
      </Button.UnstyledButton>
    </div>
  );
};
