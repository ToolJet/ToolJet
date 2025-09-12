import React, { memo, useRef, useState, useCallback } from 'react';
import cx from 'classnames';
import * as Icons from '@tabler/icons-react';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import EyeDisable from '@/_ui/Icon/solidIcons/EyeDisable';
import FileRemove from '@/_ui/Icon/solidIcons/FIleRemove';
import Home from '@/_ui/Icon/solidIcons/Home';
import useStore from '@/AppBuilder/_stores/store';
import _ from 'lodash';
import { toast } from 'react-hot-toast';
import { RenameInput } from './RenameInput';
import IconSelector from './IconSelector';
import { withRouter } from '@/_hoc/withRouter';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';
import { Overlay, Popover } from 'react-bootstrap';
import PageOptions from './PageOptions';
import { AddEditPagePopup } from './AddNewPagePopup';
import { ToolTip } from '@/_components';
import Skip from '@/_ui/Icon/solidIcons/Skip';
import { resolveReferences } from '@/_helpers/utils';

export const PAGE_TYPES = {
  default: '',
  app: 'TJ app',
  url: 'URL',
};

export const PageMenuItem = withRouter(
  memo(({ darkMode, page, navigate, treeRef }) => {
    const { moduleId } = useModuleContext();
    const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
    const isHomePage = page.id === homePageId;
    const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
    const isSelected = page.id === currentPageId;
    const isHidden = useStore((state) => state.getPagesVisibility('canvas', page?.id));
    const isDisabled = page?.disabled ?? false;
    const [isHovered, setIsHovered] = useState(false);
    const shouldFreeze = useStore((state) => state.getShouldFreeze());
    const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
    const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
    const showEditingPopover = useStore((state) => state.showEditingPopover);
    const logError = useStore((state) => state.eventsSlice.logError);
    const setNewPagePopupConfig = useStore((state) => state.setNewPagePopupConfig);
    const setEditingPage = useStore((state) => state.setEditingPage);
    const newPagePopupConfig = useStore((state) => state.newPagePopupConfig);
    const toggleDeleteConfirmationModal = useStore((state) => state.toggleDeleteConfirmationModal);
    const togglePagePermissionModal = useStore((state) => state.togglePagePermissionModal);
    const clonePage = useStore((state) => state.clonePage);
    const markAsHomePage = useStore((state) => state.markAsHomePage);
    const restricted = page?.permissions && page?.permissions?.length > 0;
    const {
      definition: { styles, properties },
    } = useStore((state) => state.pageSettings);
    const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
    // only update when the page is being edited
    const editingPage = useStore((state) => state.editingPage);
    const editingPageName = useStore((state) => state.showEditPageNameInput);
    const [showPageOptions, toggleShowPageOptions] = useState(false);
    const [showEditPopover, setShowEditPopover] = useState(false);
    const popoverRef = useRef(null);

    const openPageEditPopover = useStore((state) => state.openPageEditPopover);
    const toggleEditPageNameInput = useStore((state) => state.toggleEditPageNameInput);

    const optionBtnRef = useRef(null);
    const moreBtnRef = useRef(null);

    const isEditingPage = editingPage?.id === page?.id;
    const icon = (props) => {
      const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
      // eslint-disable-next-line import/namespace
      const Icon = Icons?.[iconName] ?? Icons?.['IconFile'];

      return (
        <Icon {...props} style={{ width: '16px', height: '16px', color: 'var(--icons-default)', marginRight: '6px' }} />
      );

      // if (!isDisabled && !isHidden) {
      // }
      // if (isDisabled || (isDisabled && isHidden)) {
      //   return (
      //     <FileRemove fill={computedStyles?.icon?.fill} className=" " width={16} height={16} viewBox={'0 0 16 16'} />
      //   );
      // }
    };
    const computeStyles = useCallback(() => {
      const baseStyles = {
        pill: {
          borderRadius: `${styles.pillRadius.value}px`,
        },
        icon: {
          color: !styles.iconColor.isDefault && styles.iconColor.value,
          fill: !styles.iconColor.isDefault && styles.iconColor.value,
        },
      };

      switch (true) {
        case isSelected: {
          return {
            ...baseStyles,
            text: {
              color: !styles.selectedTextColor.isDefault && styles.selectedTextColor.value,
            },
            icon: {
              stroke: !styles.selectedIconColor.isDefault && styles.selectedIconColor.value,
              color: !styles.selectedIconColor.isDefault && styles.selectedIconColor.value,
              fill: !styles.selectedIconColor.isDefault && styles.selectedIconColor.value,
            },
            pill: {
              background: !styles.pillSelectedBackgroundColor.isDefault && styles.pillSelectedBackgroundColor.value,
              ...(page.id === editingPage?.id && {
                backgroundColor: 'var(--slate1)',
              }),
              ...baseStyles.pill,
            },
          };
        }
        case isHovered: {
          return {
            ...baseStyles,
            pill: {
              background: !styles.pillHoverBackgroundColor.isDefault && styles.pillHoverBackgroundColor.value,
              ...baseStyles.pill,
            },
          };
        }
        default: {
          return {
            text: {
              color: !styles.textColor.isDefault && styles.textColor.value,
            },
            icon: {
              color: !styles.iconColor.isDefault && styles.iconColor.value,
              fill: !styles.iconColor.isDefault && styles.iconColor.value,
            },
          };
        }
      }
    }, [styles, isSelected, isHovered, page.id, editingPage?.id]);

    const computedStyles = computeStyles();

    const labelStyle = {
      icon: {
        hidden: properties.style === 'text',
      },
      label: {
        hidden: properties.style === 'icon',
      },
    };

    const switchPage = useStore((state) => state.switchPage);

    const getAbsoluteUrl = (url) => {
      if (!url) return '';

      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return `https://${url}`;
    };

    const handlePageSwitch = useCallback(
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (page?.type === 'url') {
          if (page?.url) {
            const finalUrl = getAbsoluteUrl(page.url);
            if (finalUrl) {
              if (page.openIn === 'new_tab') {
                window.open(finalUrl, '_blank');
              } else {
                window.location.href = finalUrl;
              }
            }
          } else {
            logError(
              'Navigation',
              'navigation',
              { message: 'No URL provided', errorTarget: 'page' },
              { eventType: 'page' },
              {},
              '',
              page
            );
            return;
          }
          return;
        }

        if (page?.type === 'app') {
          if (page?.appId) {
            const baseUrl = `${window.public_config?.TOOLJET_HOST}/applications/${page.appId}`;
            if (page.openIn === 'new_tab') {
              window.open(baseUrl, '_blank');
            } else {
              window.location.href = baseUrl;
            }
          } else {
            logError(
              'Navigation',
              'navigation',
              { message: 'No application slug provided', errorTarget: 'page' },
              { eventType: 'page' },
              {},
              '',
              page
            );
            return;
          }
          return;
        }

        if (currentPageId === page?.id) {
          return;
        }

        switchPage(page?.id, page?.handle, [], moduleId);
        setCurrentPageHandle(page.handle);
      },
      [page, currentPageId, switchPage, moduleId, setCurrentPageHandle, logError]
    );

    const handlePageMenuSettings = useCallback(
      (event) => {
        event.stopPropagation();
        openPageEditPopover(page, popoverRef);
      },
      [popoverRef.current, page]
    );

    const handleOpenPopup = (type, page) => {
      // openPageEditPopover(page);
      setEditingPage(page);
      toggleShowPageOptions(false);
      setShowEditPopover(true);
      setNewPagePopupConfig({ type, mode: 'edit' });
    };
    function getTooltip() {
      const permission = page?.permissions?.length ? page?.permissions[0] : null;
      if (!permission) return '';
      const users = permission.users || [];
      const isSingle = permission.type === 'SINGLE';
      const isGroup = permission.type === 'GROUP';

      if (users.length === 0) return null;

      if (isSingle) {
        if (users.length === 1) {
          const email = users[0].user.email;
          return `Access restricted to ${email}`;
        } else {
          return `Access restricted to ${users.length} users`;
        }
      }

      if (isGroup) {
        if (users.length === 1) {
          const groupName = users[0].permissionGroup?.name ?? 'Group';
          return `Access restricted to ${groupName} group`;
        } else {
          return `Access restricted to ${users.length} groups`;
        }
      }

      return '';
    }
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '100%',
        }}
      >
        <>
          <div
            className={`page-menu-item ${darkMode && 'dark-theme theme-dark'} ${
              (showPageOptions || showEditPopover) && isEditingPage ? 'is-selected' : ''
            }`}
            style={{
              position: 'relative',
              width: '100%',
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenPopup(page?.type || 'page', page);
            }}
          >
            {editingPageName && editingPage?.id === page?.id ? (
              <>
                {' '}
                <div className="left">{icon()}</div>
                <RenameInput
                  page={page}
                  updaterCallback={() => {
                    toggleEditPageNameInput(false);
                  }}
                />
              </>
            ) : (
              <>
                <div ref={optionBtnRef} className="left" data-cy={`pages-name-${page.name.toLowerCase()}`}>
                  <div className="main-page-icon-wrapper">{icon()}</div>
                  <OverflowTooltip childrenClassName="page-name" style={{ ...computedStyles?.text }}>
                    {page.name}
                  </OverflowTooltip>
                  <span className="color-slate09 meta-text d-flex align-items-center justify-content-center">
                    {PAGE_TYPES[page?.type] && ( // If 'page' object has a 'type' property like 'URL'
                      <span className="page-type-text">{PAGE_TYPES[page?.type]}</span>
                    )}
                    {isHomePage && (
                      <ToolTip message="Home page" placement="bottom">
                        <div className=" d-flex align-items-center justify-content-center">
                          <Home fill="var(--icons-default)" className="" width={16} height={16} />
                        </div>
                      </ToolTip>
                    )}

                    {isDisabled && (
                      <ToolTip message="Disabled page" placement="bottom">
                        <div className=" d-flex align-items-center justify-content-center">
                          <Skip fill="var(--icons-default)" className="" width={16} height={16} viewBox="0 0 16 16" />
                        </div>
                      </ToolTip>
                    )}
                    {isHidden && !isDisabled && (
                      <ToolTip
                        message={page?.type !== PAGE_TYPES.default ? 'Hidden nav item' : 'Hidden page'}
                        placement="bottom"
                      >
                        <div className=" d-flex align-items-center justify-content-center">
                          <EyeDisable fill="var(--icons-default)" className="" width={16} height={16} />
                        </div>
                      </ToolTip>
                    )}
                    <div style={{ marginRight: 'auto' }}>
                      {licenseValid && restricted && (
                        <ToolTip message={getTooltip()}>
                          <div className="d-flex">
                            <SolidIcon width="16" name="lock" fill="var(--icons-default)" />
                          </div>
                        </ToolTip>
                      )}
                    </div>
                  </span>
                </div>
                <div>
                  {!shouldFreeze && (
                    <div
                      className={cx('action-btn-wrapper', {
                        'options-opened': showPageOptions && editingPage?.id == page?.id,
                      })}
                    >
                      <div onClick={handlePageSwitch} className="icon-btn">
                        <ToolTip message="Go to page" placement="bottom">
                          <div className=" d-flex align-items-center justify-content-center">
                            <SolidIcon name="arrowright01" fill="var(--icons-strong)" />
                          </div>
                        </ToolTip>
                      </div>
                      <div
                        ref={moreBtnRef}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingPage(page);
                          toggleShowPageOptions(true);
                          setNewPagePopupConfig({ show: false, mode: null, type: null });
                          setShowEditPopover(false);
                        }}
                        className="icon-btn"
                      >
                        <SolidIcon name="morevertical01" fill="var(--icons-strong)" width="12" viewBox="0 0 12 12" />
                      </div>

                      <Overlay
                        target={moreBtnRef.current}
                        show={showPageOptions && isEditingPage}
                        placement="bottom-end"
                        rootClose
                        transition={false}
                        modifiers={[
                          {
                            name: 'preventOverflow',
                            options: {
                              boundary: 'viewport',
                            },
                          },
                        ]}
                        onHide={() => {
                          setEditingPage(null);
                          toggleShowPageOptions(false);
                        }}
                      >
                        <Popover
                          style={{ zIndex: '99999', position: 'absolute' }}
                          id="edit-page-popover"
                          className={`${darkMode && 'dark-theme theme-dark'}`}
                        >
                          <div className="menu-options mb-0">
                            <PageOptions
                              text="Edit page details"
                              icon="editable"
                              darkMode={darkMode}
                              onClick={(e) => {
                                handleOpenPopup(page?.type || 'page', page);
                              }}
                            />
                            {page?.type === 'default' && (
                              <PageOptions
                                text="Mark home"
                                icon="home"
                                darkMode={darkMode}
                                disabled={isHomePage}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  markAsHomePage(page?.id, moduleId);
                                }}
                              />
                            )}
                            <PageOptions
                              text="Duplicate page"
                              icon="copy"
                              darkMode={darkMode}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleShowPageOptions(false);

                                clonePage(page?.id);
                              }}
                            />
                            <PageOptions
                              text="Delete page"
                              icon="trash"
                              darkMode={darkMode}
                              disabled={isHomePage}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleShowPageOptions(false);
                                openPageEditPopover(page);
                                toggleDeleteConfirmationModal(true);
                              }}
                            />
                            <PageOptions
                              text={
                                <ToolTip
                                  message={'Page permissions are available only in paid plans'}
                                  placement="right"
                                  show={!licenseValid}
                                >
                                  <div className="d-flex align-items-center enterprise-feature">
                                    <div>Page permission</div>
                                    {!licenseValid && <SolidIcon name="enterprisecrown" />}
                                  </div>
                                </ToolTip>
                              }
                              icon="lock"
                              darkMode={darkMode}
                              disabled={!licenseValid}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleShowPageOptions(false);
                                togglePagePermissionModal(true);
                              }}
                            />
                          </div>
                        </Popover>
                      </Overlay>

                      <Overlay
                        target={optionBtnRef.current}
                        show={showEditPopover && newPagePopupConfig?.mode == 'edit' && isEditingPage}
                        placement="left-start"
                        rootClose
                        onHide={() => {
                          setEditingPage(null);
                          setNewPagePopupConfig({ show: false, mode: null, type: null });
                          toggleShowPageOptions(false);
                          setShowEditPopover(false);
                        }}
                      >
                        <AddEditPagePopup darkMode={darkMode} />
                      </Overlay>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      </div>
    );
  })
);

export const AddingPageHandler = ({ darkMode }) => {
  const toggleShowAddNewPageInput = useStore((state) => state.toggleShowAddNewPageInput);
  const addNewPage = useStore((state) => state.addNewPage);
  const isPageGroup = useStore((state) => state.isPageGroup);
  const handleAddingNewPage = (pageName) => {
    if (pageName.trim().length === 0) {
      toast(`${isPageGroup ? 'Page group' : 'Page'} name should have at least 1 character`, {
        icon: '⚠️',
      });
    } else if (pageName.trim().length > 32) {
      toast(`${isPageGroup ? 'Page group' : 'Page'} name cannot exceed 32 characters`, {
        icon: '⚠️',
      });
    } else {
      addNewPage(pageName, _.kebabCase(pageName.toLowerCase()), isPageGroup);
    }
    toggleShowAddNewPageInput(false);
  };

  return (
    <div role="button" style={{ marginTop: '2px' }}>
      <div>
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
