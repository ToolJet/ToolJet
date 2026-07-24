import React, { memo, useState, useMemo, useCallback, useRef } from 'react';
import cx from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import { RenameInput } from './RenameInput';
import OverflowTooltip from '@/_components/OverflowTooltip';
import PageOptions from './PageOptions';
import { Overlay, Popover } from 'react-bootstrap';
import { AddEditPagePopup } from './AddNewPagePopup';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import EyeDisable from '@/_ui/Icon/solidIcons/EyeDisable';

export const PageGroupItem = memo(({ page, highlight, darkMode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPageOptions, toggleShowPageOptions] = useState(false);
  const [showEditPopover, setShowEditPopover] = useState(false);
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
    return (
      <div
        ref={optionsBtnRef}
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
          <div className="left">
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
        </div>
      </div>
    );
  }, [
    editingPage,
    page,
    highlight,
    darkMode,
    showPageOptions,
    showEditPopover,
    computedStyles?.text,
    pageVisibility,
    newPagePopupConfig?.mode,
    handleOpenPopup,
    setEditingPage,
    setNewPagePopupConfig,
    cloneGroup,
    openPageEditPopover,
    toggleDeleteConfirmationModal,
  ]);

  return memoizedContent;
});
