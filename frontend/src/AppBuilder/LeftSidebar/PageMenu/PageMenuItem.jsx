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
    const popoverRef = useRef(null);

    const openPageEditPopover = useStore((state) => state.openPageEditPopover);
    const toggleEditPageNameInput = useStore((state) => state.toggleEditPageNameInput);

    const isEditingPage = editingPage?.id === page?.id;
    const icon = () => {
      const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
      if (!isDisabled && !isHidden) {
        return <IconSelector iconColor={computedStyles?.icon?.color} iconName={iconName} pageId={page.id} />;
      }
      if (isDisabled || (isDisabled && isHidden)) {
        return (
          <FileRemove fill={computedStyles?.icon?.fill} className=" " width={16} height={16} viewBox={'0 0 16 16'} />
        );
      }
      if (isHidden && !isDisabled) {
        return <EyeDisable className="" width={16} height={16} />;
      }
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

    const handlePageSwitch = useCallback(() => {
      if (currentPageId === page.id) {
        return;
      }
      switchPage(page.id, page.handle);
      setCurrentPageHandle(page.handle);
    }, [currentPageId, page.id, page.handle, switchPage, setCurrentPageHandle]);

    const handlePageMenuSettings = useCallback(
      (event) => {
        event.stopPropagation();
        openPageEditPopover(page, popoverRef);
      },
      [popoverRef.current, page]
    );

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
            onClick={handlePageSwitch}
            className={`page-menu-item ${isSelected && 'is-selected'} ${darkMode && 'dark-theme'}`}
            style={{
              position: 'relative',
              width: '100%',
              ...computedStyles?.pill,
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
                <div className="left" data-cy={`pages-name-${page.name.toLowerCase()}`}>
                  {icon()}
                  <OverflowTooltip childrenClassName="page-name" style={{ ...computedStyles?.text }}>
                    {page.name}
                  </OverflowTooltip>
                  <span
                    style={{
                      marginLeft: '8px',
                    }}
                    className="color-slate09 meta-text"
                  >
                    {isHomePage && 'Home'}
                    {isDisabled && 'Disabled'}
                    {isHidden && !isDisabled && 'Hidden'}
                  </span>
                </div>
                <div style={{ marginLeft: '8px', marginRight: 'auto' }}>
                  {licenseValid && restricted && <SolidIcon width="16" name="lock" fill="var(--icon-strong)" />}
                </div>
                <div className={cx('right', { 'handler-menu-open': showEditingPopover })}>
                  {!shouldFreeze && (
                    <button
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--color-slate12)',
                        cursor: 'pointer',
                        padding: '0',
                        ...((isEditingPage || currentPageId === page?.id) && {
                          opacity: 1,
                        }),
                      }}
                      className="edit-page-overlay-toggle"
                      onClick={handlePageMenuSettings}
                      ref={popoverRef}
                      id={`edit-popover-${page.id}`}
                    >
                      <SolidIcon width="20" dataCy={`page-menu`} name="morevertical" />
                    </button>
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
