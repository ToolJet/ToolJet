import React, { forwardRef, useState, useRef } from 'react';
import classNames from 'classnames';
import * as Icons from '@tabler/icons-react';
import { Overlay, Popover } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import OverflowTooltip from '@/_components/OverflowTooltip';
import NavItemPopover from '../../../NavItemPopover';
import styles from './TreeItem.module.css';

// Menu Item Component (for regular items)
const MenuItem = ({ darkMode, item, onDeleteItem, onItemChange, getResolvedValue }) => {
  const [showActionsPopover, setShowActionsPopover] = useState(false);
  const [showEditPopover, setShowEditPopover] = useState(false);
  const optionBtnRef = useRef(null);
  const moreBtnRef = useRef(null);

  const isEditing = showEditPopover || showActionsPopover;

  const getIconComponent = () => {
    const iconName = item?.icon?.value || 'IconFile';
    const IconComponent = Icons?.[iconName] ?? Icons?.['IconFile'];
    return IconComponent;
  };

  const IconComponent = getIconComponent();

  const handleEdit = () => {
    setShowActionsPopover(false);
    setShowEditPopover(true);
  };

  const handleDelete = () => {
    setShowActionsPopover(false);
    onDeleteItem?.(item.id, item.parentId);
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={optionBtnRef}
        className={`page-menu-item ${darkMode ? 'dark-theme theme-dark' : ''} ${isEditing ? 'is-selected' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowEditPopover(!showEditPopover);
        }}
      >
        <div className="left">
          <div className="main-page-icon-wrapper">
            <IconComponent size={20} stroke={1.5} className="nav-item-icon" />
          </div>
          <OverflowTooltip childrenClassName="page-name">
            {getSafeRenderableValue(getResolvedValue?.(item?.label) ?? item?.label)}
          </OverflowTooltip>
        </div>
        <div>
          <div className={`action-btn-wrapper ${showActionsPopover ? 'options-opened' : ''}`}>
            <div
              ref={moreBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowActionsPopover(true);
                setShowEditPopover(false);
              }}
              className="icon-btn"
            >
              <SolidIcon name="morevertical01" fill="var(--icons-strong)" width="12" viewBox="0 0 12 12" />
            </div>

            <Overlay
              target={moreBtnRef.current}
              show={showActionsPopover}
              placement="bottom-end"
              rootClose
              onHide={() => setShowActionsPopover(false)}
            >
              <Popover
                style={{ zIndex: '99999' }}
                className={`${darkMode && 'dark-theme theme-dark'} nav-item-actions-popover`}
              >
                <Popover.Body className="p-2">
                  <div className="nav-item-action-option" onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                    <Icons.IconPencil size={16} stroke={1.5} className="nav-item-action-option-icon" />
                    <span className="nav-item-action-option-label">Edit menu item</span>
                  </div>
                  <div className="nav-item-action-option nav-item-action-option-danger" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                    <Icons.IconTrash size={16} stroke={1.5} className="nav-item-action-option-icon" />
                    <span className="nav-item-action-option-label">Delete nav item</span>
                  </div>
                </Popover.Body>
              </Popover>
            </Overlay>

            <Overlay
              target={optionBtnRef.current}
              show={showEditPopover}
              placement="left-start"
              rootClose
              onHide={() => setShowEditPopover(false)}
            >
              <NavItemPopover
                item={item}
                darkMode={darkMode}
                onItemChange={onItemChange}
                onDeleteItem={onDeleteItem}
                getResolvedValue={getResolvedValue}
                parentId={item.parentId}
              />
            </Overlay>
          </div>
        </div>
      </div>
    </div>
  );
};

// Group Item Component
const GroupMenuItem = ({ darkMode, item, highlight, onDeleteItem, onItemChange, getResolvedValue }) => {
  const [showActionsPopover, setShowActionsPopover] = useState(false);
  const [showEditPopover, setShowEditPopover] = useState(false);
  const optionsBtnRef = useRef(null);
  const moreBtnRef = useRef(null);

  const isEditing = showEditPopover || showActionsPopover;

  const handleEdit = () => {
    setShowActionsPopover(false);
    setShowEditPopover(true);
  };

  const handleDelete = () => {
    setShowActionsPopover(false);
    onDeleteItem?.(item.id);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={optionsBtnRef}
        className={`page-menu-item page-group-item ${highlight ? 'highlight' : ''} ${darkMode ? 'dark-theme theme-dark' : ''} ${isEditing ? 'is-selected' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowEditPopover(!showEditPopover);
        }}
      >
        <div className="left">
          <div className="page-name">
            <OverflowTooltip childrenClassName="page-name">
              {getSafeRenderableValue(getResolvedValue?.(item?.label) ?? item?.label)}
            </OverflowTooltip>
          </div>
        </div>
        <div>
          <div className={`action-btn-wrapper ${showActionsPopover ? 'options-opened' : ''}`}>
            <div
              ref={moreBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowActionsPopover(true);
                setShowEditPopover(false);
              }}
              role="button"
              className="icon-btn"
            >
              <SolidIcon name="morevertical01" width="12" viewBox="0 0 12 12" />
            </div>

            <Overlay
              target={moreBtnRef.current}
              show={showActionsPopover}
              placement="bottom-end"
              rootClose
              onHide={() => setShowActionsPopover(false)}
            >
              <Popover
                style={{ zIndex: '99999' }}
                className={`${darkMode && 'dark-theme theme-dark'} nav-item-actions-popover`}
              >
                <Popover.Body className="p-2">
                  <div className="nav-item-action-option" onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                    <Icons.IconPencil size={16} stroke={1.5} className="nav-item-action-option-icon" />
                    <span className="nav-item-action-option-label">Edit group</span>
                  </div>
                  <div className="nav-item-action-option nav-item-action-option-danger" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                    <Icons.IconTrash size={16} stroke={1.5} className="nav-item-action-option-icon" />
                    <span className="nav-item-action-option-label">Delete group</span>
                  </div>
                </Popover.Body>
              </Popover>
            </Overlay>

            <Overlay
              target={optionsBtnRef.current}
              show={showEditPopover}
              placement="left-start"
              rootClose
              onHide={() => setShowEditPopover(false)}
            >
              <NavItemPopover
                item={item}
                darkMode={darkMode}
                onItemChange={onItemChange}
                onDeleteItem={onDeleteItem}
                getResolvedValue={getResolvedValue}
              />
            </Overlay>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TreeItem = forwardRef(
  (
    {
      clone,
      depth,
      disableSelection,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth,
      indicator,
      collapsed,
      onCollapse,
      style,
      value,
      wrapperRef,
      groupToHighlight,
      darkMode,
      onDeleteItem,
      onItemChange,
      getResolvedValue,
      ...props
    },
    ref
  ) => {
    const shouldHighlight = groupToHighlight === value?.id;
    const isNested = depth > 0;

    return (
      <li
        {...handleProps}
        data-draggable="true"
        className={classNames(
          styles.Wrapper,
          clone && styles.clone,
          ghost && styles.ghost,
          indicator && styles.indicator,
          disableSelection && styles.disableSelection,
          disableInteraction && styles.disableInteraction,
          groupToHighlight && styles.removeBorder,
          'nav-handler'
        )}
        ref={wrapperRef}
        style={{
          '--spacing': `${indentationWidth * depth}px`,
        }}
      >
        <div
          className={styles.TreeItem}
          ref={ref}
          style={{
            ...style,
            width: '100%',
            ...(isNested && {
              borderLeft: '1px dashed var(--border-weak)',
              padding: '0 0 0 16px',
            }),
          }}
        >
          {!value?.isGroup ? (
            <MenuItem
              darkMode={darkMode}
              item={value}
              onDeleteItem={onDeleteItem}
              onItemChange={onItemChange}
              getResolvedValue={getResolvedValue}
            />
          ) : (
            <GroupMenuItem
              darkMode={darkMode}
              item={value}
              highlight={shouldHighlight}
              collapsed={collapsed}
              onCollapse={onCollapse}
              onDeleteItem={onDeleteItem}
              onItemChange={onItemChange}
              getResolvedValue={getResolvedValue}
            />
          )}
        </div>
      </li>
    );
  }
);

TreeItem.displayName = 'TreeItem';
