import React, { useState, useRef, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import { SortableTree } from './Tree';

const AddMenuPopover = React.forwardRef(({ onAddItem, onAddGroup, onClose, darkMode, buttonWidth, ...props }, ref) => {
  return (
    <Popover
      ref={ref}
      {...props}
      style={{ ...props.style, width: buttonWidth ? `${buttonWidth}px` : 'auto', maxWidth: 'none' }}
      className={`${darkMode ? 'dark-theme theme-dark' : ''} nav-add-menu-popover`}
    >
      <Popover.Body>
        <div
          className="nav-add-menu-option"
          data-cy="inspector-navigation-add-menu-item-option"
          onClick={() => {
            onAddItem();
            onClose();
          }}
        >
          <span className="nav-add-menu-option-label">Add new menu item</span>
        </div>
        <div
          className="nav-add-menu-option"
          data-cy="inspector-navigation-add-group-option"
          onClick={() => {
            onAddGroup();
            onClose();
          }}
        >
          <span className="nav-add-menu-option-label">Add new group</span>
        </div>
      </Popover.Body>
    </Popover>
  );
});

AddMenuPopover.displayName = 'AddMenuPopover';

const NavItemsList = ({
  menuItems,
  darkMode,
  onDeleteItem,
  onItemChange,
  onAddItem,
  onAddGroup,
  onReorder,
  getResolvedValue,
}) => {
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(0);
  const addButtonRef = useRef(null);

  useEffect(() => {
    if (addButtonRef.current) {
      setButtonWidth(addButtonRef.current.offsetWidth);
    }
  }, []);

  return (
    <div className="navigation-inspector" data-cy="inspector-navigation-menu-items-list" style={{ marginBottom: '12px' }}>
      <SortableTree
        menuItems={menuItems}
        darkMode={darkMode}
        onDeleteItem={onDeleteItem}
        onItemChange={onItemChange}
        onReorder={onReorder}
        getResolvedValue={getResolvedValue}
      />
      <OverlayTrigger
        trigger="click"
        placement="bottom-start"
        show={showAddPopover}
        onToggle={(show) => setShowAddPopover(show)}
        rootClose
        overlay={
          <AddMenuPopover
            onAddItem={onAddItem}
            onAddGroup={onAddGroup}
            onClose={() => setShowAddPopover(false)}
            darkMode={darkMode}
            buttonWidth={buttonWidth}
          />
        }
      >
        <div ref={addButtonRef}>
          <AddNewButton
            onClick={() => setShowAddPopover(!showAddPopover)}
            dataCy="inspector-navigation-add-new-item"
            className="mt-2"
          >
            New menu item
          </AddNewButton>
        </div>
      </OverlayTrigger>
    </div>
  );
};

export default NavItemsList;
