import React, { memo, useRef, useState, useCallback } from 'react';
import cx from 'classnames';
// import { RenameInput } from './RenameInput';
// import { PagehandlerMenu } from './PagehandlerMenu';
// import { EditModal } from './EditModal';
// import { SettingsModal } from './SettingsModal';
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
import { shallow } from 'zustand/shallow';
import { Overlay, Popover } from 'react-bootstrap';
import PageOptions from './PageOptions';
import { AddEditPagePopup } from './AddNewPagePopup';
import { ToolTip } from '@/_components';

export const PageMenuItem = withRouter(
  memo(({ darkMode, page, navigate }) => {
    const homePageId = useStore((state) => state.app.homePageId);
    const isHomePage = page.id === homePageId;
    const currentPageId = useStore((state) => state.currentPageId);
    const isSelected = page.id === currentPageId;
    const isHidden = page?.hidden ?? false;
    const isDisabled = page?.disabled ?? false;
    const [isHovered, setIsHovered] = useState(false);
    const shouldFreeze = useStore((state) => state.getShouldFreeze());
    const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
    const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
    const showEditingPopover = useStore((state) => state.showEditingPopover);
    const setNewPagePopupConfig = useStore((state) => state.setNewPagePopupConfig);
    const setEditingPage = useStore((state) => state.setEditingPage);
    const newPagePopupConfig = useStore((state) => state.newPagePopupConfig);
    const toggleDeleteConfirmationModal = useStore((state) => state.toggleDeleteConfirmationModal);
    const clonePage = useStore((state) => state.clonePage);
    const markAsHomePage = useStore((state) => state.markAsHomePage);
    const restricted = page?.permissions && page?.permissions?.length > 0;
    const {
      definition: { styles, properties },
    } = useStore((state) => state.pageSettings);
    const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
    // only update when the page is being edited
    const editingPage = useStore(
      (state) => state.editingPage,
      (prev, next) => {
        if (next?.id === page?.id) return false;
        if (prev?.id === page?.id) return false;
        return true;
      }
    );
    const editingPageName = useStore((state) => state.showEditPageNameInput);
    const [showPageOptions, toggleShowPageOptions] = useState(false);
    const [showEditPopover, setShowEditPopover] = useState(false);
    const popoverRef = useRef(null);

    const openPageEditPopover = useStore((state) => state.openPageEditPopover);
    const toggleEditPageNameInput = useStore((state) => state.toggleEditPageNameInput);

    const optionBtnRef = useRef(null);
    const moreBtnRef = useRef(null);

    const isEditingPage = editingPage?.id === page?.id;
    const icon = () => {
      const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
      // if (!isDisabled && !isHidden) {
      return <IconSelector iconColor={computedStyles?.icon?.color} iconName={iconName} pageId={page.id} />;
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

    const handlePageSwitch = useCallback(() => {
      if (page?.type === 'url' && page?.url) {
        const finalUrl = getAbsoluteUrl(page.url);
        if (finalUrl) {
          if (page.openIn === 'new_tab') {
            window.open(finalUrl, '_blank');
          } else {
            window.location.href = finalUrl;
          }
        }
        return;
      }

      if (page?.type === 'app' && page?.appId) {
        const baseUrl = `${window.public_config?.TOOLJET_HOST}/applications/${page.appId}`;
        if (page.openIn === 'new_tab') {
          window.open(baseUrl, '_blank');
        } else {
          window.location.href = baseUrl;
        }
        return;
      }

      if (currentPageId === page?.id) {
        return;
      }

      switchPage(page?.id, page?.handle);
      setCurrentPageHandle(page.handle);
    }, [
      page?.type,
      page.url,
      page.appId,
      page?.id,
      page.handle,
      page.openIn,
      currentPageId,
      switchPage,
      setCurrentPageHandle,
    ]);

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
            className={`page-menu-item ${showPageOptions && 'is-selected'} ${darkMode && 'dark-theme'}`}
            style={{
              position: 'relative',
              width: '100%',
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
                {' '}
                <div ref={optionBtnRef} className="left" data-cy={`pages-name-${page.name.toLowerCase()}`}>
                  {icon()}
                  <OverflowTooltip childrenClassName="page-name" style={{ ...computedStyles?.text, maxWidth: '159px' }}>
                    {page.name}
                  </OverflowTooltip>
                  <span
                    style={{
                      marginLeft: '8px',
                    }}
                    className="color-slate09 meta-text"
                  >
                    {isHomePage && (
                      <ToolTip message="Home page" placement="bottom">
                        <div>
                          <Home fill="var(--icon-default)" className="" width={16} height={16} />
                        </div>
                      </ToolTip>
                    )}

                    {isDisabled && 'Disabled'}
                    {isHidden && !isDisabled && (
                      <ToolTip message="Hidden page" placement="bottom">
                        <div>
                          <EyeDisable fill="var(--icon-default)" className="" width={16} height={16} />
                        </div>
                      </ToolTip>
                    )}
                  </span>
                </div>
                <div style={{ marginLeft: '8px', marginRight: 'auto' }}>
                  {licenseValid && restricted && <SolidIcon width="16" name="lock" fill="var(--icon-strong)" />}
                </div>
                <div>
                  {!shouldFreeze && (
                    // <button
                    //   style={{
                    //     backgroundColor: 'transparent',
                    //     border: 'none',
                    //     color: 'var(--color-slate12)',
                    //     cursor: 'pointer',
                    //     padding: '0',
                    //     ...((isEditingPage || currentPageId === page?.id) && {
                    //       opacity: 1,
                    //     }),
                    //   }}
                    //   className="edit-page-overlay-toggle"
                    //   onClick={handlePageMenuSettings}
                    //   ref={popoverRef}
                    //   id={`edit-popover-${page.id}`}
                    // >
                    //   <SolidIcon width="20" dataCy={`page-menu`} name="morevertical" />
                    // </button>
                    <div className="action-btn-wrapper">
                      <div onClick={handlePageSwitch} className="icon-btn">
                        <SolidIcon name="arrowright01" width="12" viewBox="0 0 12 12" />
                      </div>
                      <div
                        ref={moreBtnRef}
                        onClick={() => {
                          toggleShowPageOptions(true);
                        }}
                        className="icon-btn"
                      >
                        <SolidIcon name="morevertical01" width="12" viewBox="0 0 12 12" />
                      </div>

                      <Overlay
                        target={moreBtnRef.current}
                        show={showPageOptions}
                        placement="bottom-end"
                        rootClose
                        onHide={() => toggleShowPageOptions(false)}
                      >
                        <Popover id="edit-page-popover">
                          <div className="menu-options mb-0">
                            <PageOptions
                              text="Edit page details"
                              icon="editable"
                              darkMode={darkMode}
                              onClick={() => handleOpenPopup(page?.type || 'page', page)}
                            />
                            <PageOptions
                              text="Mark home"
                              icon="home"
                              darkMode={darkMode}
                              disabled={isHomePage}
                              onClick={() => markAsHomePage(page?.id)}
                            />
                            <PageOptions
                              text="Duplicate page"
                              icon="copy"
                              darkMode={darkMode}
                              onClick={() => clonePage(page?.id)}
                            />
                            <PageOptions
                              text="Delete page"
                              icon="trash"
                              darkMode={darkMode}
                              disabled={isHomePage}
                              onClick={() => {
                                openPageEditPopover(page);
                                toggleDeleteConfirmationModal(true);
                              }}
                            />
                          </div>
                        </Popover>
                      </Overlay>

                      <Overlay
                        target={optionBtnRef.current}
                        show={showEditPopover && newPagePopupConfig?.mode == 'edit'}
                        placement="left-start"
                        rootClose
                        onHide={() => {
                          setNewPagePopupConfig({ show: false, mode: null, type: null });
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
