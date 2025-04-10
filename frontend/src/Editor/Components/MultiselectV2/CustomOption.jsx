import React from 'react';
import { components } from 'react-select';
const { Option } = components;
import { FormCheck } from 'react-bootstrap';
import './multiselectV2.scss';
import { highlightText } from '../DropdownV2/utils';

const CustomOption = (props) => {
  return (
    <Option {...props}>
      <div className="d-flex multiselct-widget-option">
        <FormCheck checked={props.isSelected} disabled={props?.isDisabled} />
        <span style={{ marginLeft: '5px' }}>
          {highlightText(props.label?.toString(), props.selectProps.inputValue)}
        </span>
      </div>
    </Option>
  );
};

export default CustomOption;
