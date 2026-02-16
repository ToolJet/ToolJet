import React, { useState, useRef } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import OverflowTooltip from '@/_components/OverflowTooltip';
import TreeSelectItemPopover from './TreeSelectItemPopover';

export const TreeSelectItem = ({
  darkMode,
  item,
  onDeleteItem,
  onItemChange,
  onAddNestedItem,
  getResolvedValue,
  parentValue = null,
}) => {
  const [showActionsPopover, setShowActionsPopover] = useState(false);
  const [showEditPopover, setShowEditPopover] = useState(false);
  const optionBtnRef = useRef(null);
  const moreBtnRef = useRef(null);

  const isEditing = showEditPopover || showActionsPopover;
  const hasChildren = item.children && item.children.length > 0;

  const handleEdit = () => {
    setShowActionsPopover(false);
    setShowEditPopover(true);
  };

  const handleDelete = () => {
    setShowActionsPopover(false);
    onDeleteItem?.(item.value, parentValue);
  };

  const handleAddNested = () => {
    setShowActionsPopover(false);
    onAddNestedItem?.(item.value);
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={optionBtnRef}
        className={`treeselect-option-item ${darkMode ? 'dark-theme theme-dark' : ''} ${
          isEditing ? 'is-selected' : ''
        } ${hasChildren ? 'has-children' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowEditPopover(!showEditPopover);
        }}
      >
        <div className="left">
          <OverflowTooltip childrenClassName="option-label">{item?.label || item?.value}</OverflowTooltip>
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
                className={`${darkMode ? 'dark-theme theme-dark' : ''} treeselect-item-actions-popover`}
              >
                <Popover.Body className="p-2">
                  <div
                    className="treeselect-item-action-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                  >
                    <TablerIcon
                      iconName="IconPencil"
                      size={16}
                      stroke={1.5}
                      className="treeselect-item-action-option-icon"
                    />
                    <span className="treeselect-item-action-option-label">Edit option</span>
                  </div>
                  <div
                    className="treeselect-item-action-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddNested();
                    }}
                  >
                    <TablerIcon
                      iconName="IconPlus"
                      size={16}
                      stroke={1.5}
                      className="treeselect-item-action-option-icon"
                    />
                    <span className="treeselect-item-action-option-label">Create nested option</span>
                  </div>
                  <div
                    className="treeselect-item-action-option treeselect-item-action-option-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    <TablerIcon
                      iconName="IconTrash"
                      size={16}
                      stroke={1.5}
                      className="treeselect-item-action-option-icon"
                    />
                    <span className="treeselect-item-action-option-label">Delete option</span>
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
              <TreeSelectItemPopover
                item={item}
                darkMode={darkMode}
                onItemChange={onItemChange}
                onDeleteItem={onDeleteItem}
                getResolvedValue={getResolvedValue}
                parentValue={parentValue}
              />
            </Overlay>
          </div>
        </div>
      </div>
    </div>
  );
};
