import React from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import './SplitButton.scss';
function SplitButton(props) {
  return (
    <Dropdown as={ButtonGroup} className="tj-splitbutton">
      <div className="tj-splibutton-wrapper">
        <Button variant="" className="tj-text-sm tj-splibutton-name">
          {props.name}
        </Button>
      </div>

      <Dropdown.Toggle split variant="" id="dropdown-split-basic" className="tj-splibutton-dropdown" />
      <Dropdown.Menu>
        <Dropdown.Item href="#/action-1">Choose from template</Dropdown.Item>
        <Dropdown.Item href="#/action-2">Import</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default SplitButton;
