import React, { memo, useState, useMemo, useCallback, useRef } from 'react';
import cx from 'classnames';
import * as Icons from '@tabler/icons-react';
import useStore from '@/AppBuilder/_stores/store';
import { RenameInput } from './RenameInput';
import IconSelector from './IconSelector';
import OverflowTooltip from '@/_components/OverflowTooltip';
import PageOptions from './PageOptions';
import { Overlay, Popover } from 'react-bootstrap';
import { AddEditPagePopup } from './AddNewPagePopup';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import Skip from '@/_ui/Icon/solidIcons/Skip';
import EyeDisable from '@/_ui/Icon/solidIcons/EyeDisable';

const Caret = memo((props) => {
  return (
    <svg {...props} width={17} height={16} viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.1257 4L5.27446 4C4.50266 4 4.02179 4.83721 4.41068 5.50387L7.33631 10.5192C7.72218 11.1807 8.67798 11.1807 9.06386 10.5192L11.9895 5.50387C12.3784 4.83721 11.8975 4 11.1257 4Z"
        fill="#ACB2B9"
      />
    </svg>
  );
});

const PageGroupActions = memo(({ onRename, onDelete }) => (
  <div className="right page-group-actions">
    <button onClick={onRename}>
      <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 12 12" fill="none">
        <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 12 12" fill="none">
          <path
            d="M7.89947 1.37616C8.40101 0.874614 9.21417 0.874614 9.71572 1.37616L10.6238 2.28428C11.1254 2.78583 11.1254 3.59899 10.6238 4.10053L9.81867 4.90571C9.75546 4.87441 9.68896 4.84056 9.62001 4.80426C9.15588 4.55992 8.60512 4.21698 8.19408 3.80594C7.78304 3.3949 7.4401 2.84414 7.19576 2.38002C7.15945 2.31105 7.1256 2.24454 7.0943 2.18133L7.89947 1.37616Z"
            fill="#6A727C"
          />
          <path
            d="M7.60483 4.3952C8.09122 4.8816 8.70981 5.26441 9.1997 5.52467L6.03336 8.69102C5.83686 8.88751 5.58194 9.01497 5.30686 9.05427L3.39979 9.32671C2.976 9.38725 2.61275 9.024 2.67329 8.60021L2.94573 6.69315C2.98503 6.41806 3.11249 6.16314 3.30898 5.96664L6.47533 2.80029C6.73559 3.29019 7.11842 3.90879 7.60483 4.3952Z"
            fill="#6A727C"
          />
          <path
            d="M1.41667 10.1667C1.18655 10.1667 1 10.3532 1 10.5833C1 10.8135 1.18655 11 1.41667 11H10.5833C10.8135 11 11 10.8135 11 10.5833C11 10.3532 10.8135 10.1667 10.5833 10.1667H1.41667Z"
            fill="#6A727C"
          />
        </svg>
      </svg>
    </button>
    <button onClick={onDelete}>
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.70313 1.4453C4.8886 1.1671 5.20083 1 5.53518 1H6.46482C6.79917 1 7.1114 1.1671 7.29687 1.4453L7.75 2.125H9.625C9.83211 2.125 10 2.29289 10 2.5C10 2.70711 9.83211 2.875 9.625 2.875H2.375C2.16789 2.875 2 2.70711 2 2.5C2 2.29289 2.16789 2.125 2.375 2.125H4.25L4.70313 1.4453Z"
            fill="#6A727C"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.5 11H4.5C3.39543 11 2.5 10.1046 2.5 9V3.5H9.5V9C9.5 10.1046 8.60457 11 7.5 11ZM5 5.125C5.20711 5.125 5.375 5.29289 5.375 5.5V9C5.375 9.20711 5.20711 9.375 5 9.375C4.79289 9.375 4.625 9.20711 4.625 9L4.625 5.5C4.625 5.29289 4.79289 5.125 5 5.125ZM7 5.125C7.20711 5.125 7.375 5.29289 7.375 5.5V9C7.375 9.20711 7.20711 9.375 7 9.375C6.79289 9.375 6.625 9.20711 6.625 9V5.5C6.625 5.29289 6.79289 5.125 7 5.125Z"
            fill="#6A727C"
          />
        </svg>
      </svg>
    </button>
  </div>
));

export const PageGroupItem = memo(({ page, index, collapsed, onCollapse, highlight, darkMode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPageOptions, toggleShowPageOptions] = useState(false);
  const [showEditPopover, setShowEditPopover] = useState(false);
  const [renamingPageGroup, setRenamingPageGroup] = useState(false);
  const {
    definition: { styles },
  } = useStore((state) => state.pageSettings);

  const moreBtnRef = useRef(null);
  const optionsBtnRef = useRef(null);

  const toggleDeleteConfirmationModal = useStore((state) => state.toggleDeleteConfirmationModal);
  const openPageEditPopover = useStore((state) => state.openPageEditPopover);
  const setNewPagePopupConfig = useStore((state) => state.setNewPagePopupConfig);
  const cloneGroup = useStore((state) => state.cloneGroup);
  const setEditingPage = useStore((state) => state.setEditingPage);
  const newPagePopupConfig = useStore((state) => state.newPagePopupConfig);
  const editingPage = useStore((state) => state.editingPage);
  const pageVisibility = useStore((state) => state.getPagesVisibility('canvas', page?.id));
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
  }, [styles, isHovered, page.id]);

  const computedStyles = computeStyles();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleOpenPopup = (type, page) => {
    // openPageEditPopover(page);
    setEditingPage(page);
    toggleShowPageOptions(false);
    setShowEditPopover(true);
    setNewPagePopupConfig({ type, mode: 'edit' });
  };

  const memoizedContent = useMemo(() => {
    const isEditing = editingPage?.id === page?.id;
    const childrenCount = page?.children?.length;
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ position: 'relative', width: '100%' }}
      >
        <div
          className={`page-menu-item page-group-item ${highlight ? 'highlight' : ''} ${
            darkMode ? 'dark-theme theme-dark' : ''
          } ${(showPageOptions || showEditPopover) && isEditing ? 'is-selected' : ''}`}
          onClick={() => {
            handleOpenPopup('group', page);
          }}
          // style={{ ...computedStyles?.pill }}
        >
          {renamingPageGroup ? (
            <>
              <div className="left"></div>
              <RenameInput page={page} updaterCallback={() => setRenamingPageGroup(false)} />
            </>
          ) : (
            <>
              <div ref={optionsBtnRef} className="left">
                <div className="page-name">
                  <OverflowTooltip childrenClassName="page-name" style={{ ...computedStyles?.text }}>
                    {page.name}
                  </OverflowTooltip>
                </div>
                <span className="color-slate09 meta-text d-flex align-items-center justify-content-center">
                  {pageVisibility && (
                    <ToolTip message="Hidden group" placement="bottom">
                      <div className=" d-flex align-items-center justify-content-center">
                        <EyeDisable fill="var(--icons-default)" className="" width={16} height={16} />
                      </div>
                    </ToolTip>
                  )}
                </span>
              </div>
              <div>
                <div className={cx('action-btn-wrapper', { 'options-opened': showPageOptions })}>
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
                    role="button"
                    className="icon-btn"
                  >
                    <SolidIcon name="morevertical01" width="12" viewBox="0 0 12 12" />
                  </div>

                  <Overlay
                    target={moreBtnRef.current}
                    show={showPageOptions && isEditing}
                    placement="bottom-end"
                    rootClose
                    onHide={() => {
                      setEditingPage(null);
                      toggleShowPageOptions(false);
                    }}
                  >
                    <Popover id="edit-page-popover" className={`${darkMode && 'dark-theme theme-dark'}`}>
                      <div className="menu-options mb-0">
                        <PageOptions
                          text="Edit group details"
                          icon="editable"
                          darkMode={darkMode}
                          onClick={() => handleOpenPopup('group', page)}
                        />
                        <PageOptions
                          text="Duplicate group"
                          icon="copy"
                          darkMode={darkMode}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleShowPageOptions(false);
                            cloneGroup(page?.id);
                          }}
                        />
                        <PageOptions
                          text="Delete group"
                          icon="trash"
                          darkMode={darkMode}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditingPage(page);
                            toggleShowPageOptions(false);
                            openPageEditPopover(page);
                            setNewPagePopupConfig({ show: false, mode: null, type: null });
                            toggleDeleteConfirmationModal(true);
                          }}
                        />
                      </div>
                    </Popover>
                  </Overlay>
                  <Overlay
                    target={optionsBtnRef.current}
                    show={showEditPopover && newPagePopupConfig?.mode == 'edit' && isEditing}
                    placement="left-start"
                    rootClose
                    onHide={() => {
                      setNewPagePopupConfig({ show: false, mode: null, type: null });
                      setShowEditPopover(false);
                      setEditingPage(null);
                      toggleShowPageOptions(false);
                    }}
                  >
                    <AddEditPagePopup darkMode={darkMode} />
                  </Overlay>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }, [
    editingPage,
    page,
    showPageOptions,
    highlight,
    darkMode,
    renamingPageGroup,
    computedStyles?.text,
    showEditPopover,
    newPagePopupConfig?.mode,
    handleOpenPopup,
    setEditingPage,
    cloneGroup,
    openPageEditPopover,
    toggleDeleteConfirmationModal,
    setNewPagePopupConfig,
  ]);

  return memoizedContent;
});
