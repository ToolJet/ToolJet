import React, { useRef } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import OverflowTooltip from '@/_components/OverflowTooltip';
import TreeSelectItemPopover from './TreeSelectItemPopover';
import { ToolTip } from '@/_components/ToolTip';
import { EllipsisVertical, Plus, Trash2, Pencil } from 'lucide-react';

export const TreeSelectItem = ({
  darkMode,
  item,
  onDeleteItem,
  onItemChange,
  onAddNestedItem,
  getResolvedValue,
  parentValue = null,
  activePopover,
  setActivePopover,
}) => {
  const optionBtnRef = useRef(null);
  const moreBtnRef = useRef(null);

  // Derive local visibility from shared state
  const showActionsPopover = activePopover?.id === item.value && activePopover?.type === 'actions';
  const showEditPopover = activePopover?.id === item.value && activePopover?.type === 'edit';
  const isEditing = showEditPopover || showActionsPopover;
  const hasChildren = item.children && item.children.length > 0;

  const handleEdit = () => {
    setActivePopover({ id: item.value, type: 'edit' });
  };

  const handleDelete = () => {
    setActivePopover(null);
    onDeleteItem?.(item.value, parentValue);
  };

  const handleAddNested = () => {
    setActivePopover(null);
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
          if (showEditPopover) {
            setActivePopover(null);
          } else {
            setActivePopover({ id: item.value, type: 'edit' });
          }
        }}
      >
        <div className="left">
          <OverflowTooltip childrenClassName="option-label">{item?.label || item?.value}</OverflowTooltip>
        </div>
        <div
          className={`action-btn-wrapper tw-mr-1`}
          onClick={(e) => {
            e.stopPropagation();
            handleAddNested();
          }}
        >
          <div className="icon-btn">
            <ToolTip message="Create nested option" placement="bottom">
              <Plus width={12} height={12} />
            </ToolTip>
          </div>
        </div>
        <div>
          <div className={`action-btn-wrapper ${showActionsPopover ? 'options-opened' : ''}`}>
            <div
              ref={moreBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setActivePopover({ id: item.value, type: 'actions' });
              }}
              className="icon-btn"
            >
              <EllipsisVertical width={12} height={12} />
            </div>

            <Overlay
              target={moreBtnRef.current}
              show={showActionsPopover}
              placement="bottom-end"
              rootClose
              onHide={() => setActivePopover(null)}
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
                    <Pencil className="treeselect-item-action-option-icon" width={12} height={12} />
                    <span className="treeselect-item-action-option-label">Edit option</span>
                  </div>
                  <div
                    className="treeselect-item-action-option treeselect-item-action-option-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    <Trash2 className="treeselect-item-action-option-icon" width={12} height={12} />
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
              onHide={() => setActivePopover(null)}
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
