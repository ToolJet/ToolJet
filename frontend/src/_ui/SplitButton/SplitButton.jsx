import React from 'react';
import { DropdownButton, Dropdown } from 'react-bootstrap';
import { ThreeDotsVertical } from 'react-bootstrap-icons';

function SplitButton() {
  return (
    <DropdownButton
      id="custom-split-button"
      title="Action"
      variant="primary"
      menuAlign="right"
      menuRole="menu"
      toggleLabel={<ThreeDotsVertical size={20} />}
    >
      <Dropdown.Item href="#action/1">Action 1</Dropdown.Item>
      <Dropdown.Item href="#action/2">Action 2</Dropdown.Item>
      <Dropdown.Item href="#action/3">Action 3</Dropdown.Item>
    </DropdownButton>
  );
}

export default SplitButton;
